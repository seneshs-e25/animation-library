"use client";

import { useEffect, useRef, type CSSProperties } from "react";

/**
 * Curtain — animated WebGL2 layered-wave background.
 *
 * A deep-blue vertical gradient with a curtain of stacked, gently
 * undulating layers composited over it in overlay blend, fading out
 * towards the bottom edge. One fullscreen pass
 * into a <canvas> that fills its parent. All visual controls are exposed
 * as props and can be changed live without recreating the WebGL context.
 *
 * The layer geometry is a quartic scalar field fitted to the lit edges of
 * reference stock footage (every integer level of the field is one
 * layer edge), and the per-layer shading was measured from the same frame,
 * so the default look matches the design rather than approximating it.
 *
 * The loop idles while the canvas is off screen, and `prefers-reduced-motion`
 * holds a still frame. A lost WebGL context is rebuilt when the browser
 * restores it.
 *
 * Drop it into any positioned container:
 *
 *   <section className="relative overflow-hidden">
 *     <Curtain className="absolute inset-0 -z-10" />
 *     ...content...
 *   </section>
 */
export interface CurtainProps {
  /** Backdrop gradient colour at the top. Hex: #RGB, #RRGGBB or #RRGGBBAA (alpha ignored). */
  colorTop?: string;
  /** Backdrop gradient colour at the bottom. */
  colorBottom?: string;
  /** Lit face colour of the layers at the top of the frame. */
  layerLight?: string;
  /** Lit face colour of the layers at the bottom of the frame. */
  layerDark?: string;
  /** Animation speed multiplier. 0 freezes motion. Default 1. */
  speed?: number;
  /** Layer drift in layers per second (at speed 1). Negative reverses the direction. Default 0.06. */
  flow?: number;
  /** Undulation travelling along the layers, in layer widths (0–0.4). 0 = rigid layers. Default 0.1. */
  wave?: number;
  /** Opacity of the layered pattern over the gradient (0–1). Default 1. */
  intensity?: number;
  /** Height fraction where the pattern starts fading out (0–1). Default 0.46. */
  fadeStart?: number;
  /** Height fraction where the pattern is fully faded. Default 1. */
  fadeEnd?: number;
  /** Height fraction where the backdrop gradient starts (colorTop above it). Default 0.3. */
  gradientStart?: number;
  /** Height fraction where the gradient reaches colorBottom (may exceed 1). Default 1.7. */
  gradientEnd?: number;
  /** Pause the animation. The last frame stays visible and the render loop goes idle. */
  paused?: boolean;
  /** Cap on devicePixelRatio for rendering resolution. Lower it for large sections. Default 1.5. */
  maxPixelRatio?: number;
  className?: string;
  style?: CSSProperties;
}

export const CURTAIN_DEFAULTS = {
  colorTop: "#002F79",
  colorBottom: "#000000",
  layerLight: "#027EE1",
  layerDark: "#051E74",
  speed: 1.0,
  flow: 0.06,
  wave: 0.1,
  intensity: 1.0,
  fadeStart: 0.46,
  fadeEnd: 1.0,
  gradientStart: 0.3,
  gradientEnd: 1.7,
  paused: false,
  maxPixelRatio: 1.5,
} as const;

// A single hidden tab frame after refocus would otherwise advance the
// animation by the whole hidden duration.
const MAX_FRAME_DT = 0.1;

/* ------------------------------------------------------------------ */
/* Color helpers                                                       */
/* ------------------------------------------------------------------ */

const warnedColors = new Set<string>();

// Accepts #RGB, #RRGGBB, #RRGGBBAA (alpha ignored), with or without the
// leading "#". Anything else warns once and falls back to the default.
function parseHexColor(input: string, fallback: string): [number, number, number] {
  let hex = input.trim().replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(hex)) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  } else if (/^[0-9a-f]{6}([0-9a-f]{2})?$/i.test(hex)) {
    hex = hex.slice(0, 6);
  } else {
    if (!warnedColors.has(input)) {
      warnedColors.add(input);
      console.warn(`Curtain: invalid color "${input}" — falling back to "${fallback}".`);
    }
    hex = fallback.replace(/^#/, "");
  }
  const v = parseInt(hex, 16);
  return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255];
}

/* ------------------------------------------------------------------ */
/* Shaders (single pass: layer field -> shading -> overlay composite)  */
/* ------------------------------------------------------------------ */

const VERT = `#version 300 es
layout(location = 0) in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
out vec4 fragColor;

uniform vec2  uResolution;
uniform float uTime;
uniform float uFlow;
uniform float uWave;
uniform float uIntensity;
uniform vec2  uFade;      // fade start / end (viewport y, 0 = top)
uniform vec2  uGradient;  // gradient start / end (viewport y)
uniform vec3  uColorTop;
uniform vec3  uColorBottom;
uniform vec3  uLayerLight;
uniform vec3  uLayerDark;

// Layer field, fitted to the reference footage on a 16:9 frame with x, y in
// [0, 1]. Terms are x^i * y^j (i outer, j inner, i + j <= 4) about (0.5, 0.5).
// Every integer level of the field is the lit edge of one layer.
const float C[15] = float[15](
  4.050550, 9.700701, 8.444804, -0.712173, -3.885231,
  8.893625, 4.940033, -1.273526, -1.866641,
  11.238798, -7.033586, -18.633528,
  -9.458853, -10.812425,
  -12.658276
);

float field(vec2 p) {
  float x = p.x - 0.5, y = p.y - 0.5;
  float x2 = x * x, x3 = x2 * x, x4 = x3 * x;
  float y2 = y * y, y3 = y2 * y, y4 = y3 * y;
  return C[0] + C[1] * y + C[2] * y2 + C[3] * y3 + C[4] * y4
       + x  * (C[5] + C[6] * y + C[7] * y2 + C[8] * y3)
       + x2 * (C[9] + C[10] * y + C[11] * y2)
       + x3 * (C[12] + C[13] * y)
       + x4 *  C[14];
}

// Brightness across one layer (1 = fully lit face). q = 0 just below an
// edge, q -> 1 approaching the next edge. r = position in the reference
// frame. Near-horizontal layers on the left face the light: a lit plateau
// with a cast shadow under the edge above. Steep layers on the right turn
// away from it: a darker face that curls up into a bright edge. Both
// profiles were measured from the footage.
float layerShade(float q, vec2 r) {
  float hx = smoothstep(0.0, 0.5, r.x);
  float shAmp = mix(0.56, 0.46, hx);
  float shEnd = mix(0.70, 0.50, hx);
  float left  = 1.0 - shAmp * (1.0 - smoothstep(0.0, shEnd, q));
  float base  = mix(0.82, 0.68, smoothstep(0.55, 0.95, r.x)) - 0.12 * smoothstep(0.0, 0.5, r.y);
  float right = base + (1.0 - base) * pow(clamp((q - 0.5) / 0.43, 0.0, 1.0), 1.6);
  return mix(left, right, smoothstep(0.35, 0.65, r.x));
}

vec3 overlay(vec3 b, vec3 s) {
  vec3 lo = 2.0 * b * s;
  vec3 hi = 1.0 - 2.0 * (1.0 - b) * (1.0 - s);
  return mix(lo, hi, step(0.5, b));
}

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  // viewport uv, y down
  vec2 v = vec2(frag.x / uResolution.x, 1.0 - frag.y / uResolution.y);
  // background-size: cover mapping of the 16:9 reference frame
  float cs = max(uResolution.x / 16.0, uResolution.y / 9.0);
  vec2 r = vec2((frag.x - 0.5 * uResolution.x) / (cs * 16.0) + 0.5,
                (0.5 * uResolution.y - frag.y) / (cs * 9.0) + 0.5);

  float t = uTime;
  float f = field(r);
  // slow undulation travelling along the layers
  float w1 = sin(6.2831853 * (0.55 * r.x - 0.35 * r.y) - t * 0.45);
  float w2 = sin(6.2831853 * (0.90 * r.x + 0.60 * r.y) + t * 0.30 + 1.7);
  f += uWave * (0.7 * w1 + 0.3 * w2);
  f -= t * uFlow;

  float fw  = max(fwidth(f), 1e-4);
  float q   = fract(f);
  float cov = clamp(q / fw, 0.0, 1.0);              // pixel coverage past the edge
  float sh  = mix(layerShade(q + 1.0, r), layerShade(q, r), cov);

  // lit face colour falls off towards the bottom and is a touch cooler on the
  // left; the per-channel response to shading pushes darker parts towards navy
  vec3 lit = mix(uLayerLight, uLayerDark, pow(clamp(r.y, 0.0, 1.0), 1.6));
  lit *= vec3(1.0, mix(0.945, 1.0, r.x), mix(0.98, 1.0, r.x));
  vec3 pattern = lit * pow(vec3(clamp(sh, 0.0, 1.0)), vec3(1.0, 1.5, 0.7));

  // composite: gradient backdrop, overlay blend, vertical alpha mask
  float gt = clamp((v.y - uGradient.x) / max(uGradient.y - uGradient.x, 1e-4), 0.0, 1.0);
  vec3 bg  = mix(uColorTop, uColorBottom, gt);
  vec3 ov  = overlay(bg, clamp(pattern, 0.0, 1.0));
  float m  = clamp((uFade.y - v.y) / max(uFade.y - uFade.x, 1e-4), 0.0, 1.0) * uIntensity;
  vec3 col = mix(bg, ov, m);
  col += (hash12(frag) - 0.5) / 255.0;               // dither the dark gradient
  fragColor = vec4(col, 1.0);
}`;

/* ------------------------------------------------------------------ */
/* WebGL2 plumbing                                                     */
/* ------------------------------------------------------------------ */

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error("Shader compile error: " + info);
  }
  return sh;
}

function link(gl: WebGL2RenderingContext, vertSrc: string, fragSrc: string) {
  const prog = gl.createProgram()!;
  const vs = compile(gl, gl.VERTEX_SHADER, vertSrc);
  const fs = compile(gl, gl.FRAGMENT_SHADER, fragSrc);
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    throw new Error("Program link error: " + gl.getProgramInfoLog(prog));
  }
  return prog;
}

// Uniform locations are static per linked program — look them up once.
function uniformLocations<N extends string>(
  gl: WebGL2RenderingContext,
  prog: WebGLProgram,
  names: readonly N[],
): Record<N, WebGLUniformLocation | null> {
  const out = {} as Record<N, WebGLUniformLocation | null>;
  for (const name of names) out[name] = gl.getUniformLocation(prog, name);
  return out;
}

// Visual parameters the engine consumes; written by applyProps, read at
// render time.
interface EngineOpts {
  flow: number;
  wave: number;
  intensity: number;
  fadeStart: number;
  fadeEnd: number;
  gradientStart: number;
  gradientEnd: number;
  maxPixelRatio: number;
}

const UNIFORMS = [
  "uResolution",
  "uTime",
  "uFlow",
  "uWave",
  "uIntensity",
  "uFade",
  "uGradient",
  "uColorTop",
  "uColorBottom",
  "uLayerLight",
  "uLayerDark",
] as const;

class CurtainEngine {
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  private vao: WebGLVertexArrayObject;
  private quad: WebGLBuffer;
  private prog: WebGLProgram;
  private loc: Record<(typeof UNIFORMS)[number], WebGLUniformLocation | null>;
  private w = 0;
  private h = 0;
  private cssW = 0;
  private cssH = 0;
  private colorTop: [number, number, number] = [0, 0, 0];
  private colorBottom: [number, number, number] = [0, 0, 0];
  private layerLight: [number, number, number] = [0, 0, 0];
  private layerDark: [number, number, number] = [0, 0, 0];
  private colorKey = "";
  opts: EngineOpts;

  constructor(canvas: HTMLCanvasElement, opts: EngineOpts) {
    this.canvas = canvas;
    this.opts = opts;
    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
    });
    if (!gl) throw new Error("WebGL2 not supported");
    this.gl = gl;

    // One fullscreen triangle: cheaper than a quad (no diagonal seam, no
    // double-shaded pixels along it).
    this.quad = gl.createBuffer()!;
    this.vao = gl.createVertexArray()!;
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    this.prog = link(gl, VERT, FRAG);
    this.loc = uniformLocations(gl, this.prog, UNIFORMS);
  }

  setColors(topHex: string, bottomHex: string, lightHex: string, darkHex: string) {
    const key = `${topHex}|${bottomHex}|${lightHex}|${darkHex}`;
    if (key === this.colorKey) return;
    this.colorKey = key;
    this.colorTop = parseHexColor(topHex, CURTAIN_DEFAULTS.colorTop);
    this.colorBottom = parseHexColor(bottomHex, CURTAIN_DEFAULTS.colorBottom);
    this.layerLight = parseHexColor(lightHex, CURTAIN_DEFAULTS.layerLight);
    this.layerDark = parseHexColor(darkHex, CURTAIN_DEFAULTS.layerDark);
  }

  resize(cssW: number, cssH: number) {
    this.cssW = cssW;
    this.cssH = cssH;
    const dpr = Math.min(window.devicePixelRatio || 1, this.opts.maxPixelRatio);
    const w = Math.max(1, Math.round(cssW * dpr));
    const h = Math.max(1, Math.round(cssH * dpr));
    if (w === this.w && h === this.h) return;
    this.w = w;
    this.h = h;
    this.canvas.width = w;
    this.canvas.height = h;
  }

  // Recompute the backing-store size for the current CSS size — used when
  // devicePixelRatio or the maxPixelRatio cap changes without a layout resize.
  refreshSize() {
    if (this.cssW > 0 && this.cssH > 0) this.resize(this.cssW, this.cssH);
  }

  renderFrame(timeSeconds: number) {
    const gl = this.gl;
    if (this.w === 0 || this.h === 0) return;
    const o = this.opts;

    gl.bindVertexArray(this.vao);
    gl.viewport(0, 0, this.w, this.h);
    gl.useProgram(this.prog);
    gl.uniform2f(this.loc.uResolution, this.w, this.h);
    gl.uniform1f(this.loc.uTime, timeSeconds);
    gl.uniform1f(this.loc.uFlow, o.flow);
    gl.uniform1f(this.loc.uWave, o.wave);
    gl.uniform1f(this.loc.uIntensity, o.intensity);
    gl.uniform2f(this.loc.uFade, o.fadeStart, o.fadeEnd);
    gl.uniform2f(this.loc.uGradient, o.gradientStart, o.gradientEnd);
    gl.uniform3fv(this.loc.uColorTop, this.colorTop);
    gl.uniform3fv(this.loc.uColorBottom, this.colorBottom);
    gl.uniform3fv(this.loc.uLayerLight, this.layerLight);
    gl.uniform3fv(this.loc.uLayerDark, this.layerDark);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  dispose() {
    const gl = this.gl;
    gl.deleteProgram(this.prog);
    gl.deleteVertexArray(this.vao);
    gl.deleteBuffer(this.quad);
  }
}

/* ------------------------------------------------------------------ */
/* Context lifecycle                                                   */
/*                                                                     */
/* Browsers cap live WebGL contexts (~8–16), so a real unmount must    */
/* release its context. But React StrictMode re-runs the mount effect  */
/* on the SAME canvas, where losing the context would kill the second  */
/* engine. Resolution: defer the release one macrotask and cancel it   */
/* if a new engine claims the canvas first (the StrictMode remount is  */
/* synchronous, so it always wins the race).                           */
/* ------------------------------------------------------------------ */

const pendingContextRelease = new Map<HTMLCanvasElement, ReturnType<typeof setTimeout>>();

function scheduleContextRelease(canvas: HTMLCanvasElement) {
  pendingContextRelease.set(
    canvas,
    setTimeout(() => {
      pendingContextRelease.delete(canvas);
      canvas.getContext("webgl2")?.getExtension("WEBGL_lose_context")?.loseContext();
    }, 0),
  );
}

function cancelContextRelease(canvas: HTMLCanvasElement) {
  const timer = pendingContextRelease.get(canvas);
  if (timer !== undefined) {
    clearTimeout(timer);
    pendingContextRelease.delete(canvas);
  }
}

/* ------------------------------------------------------------------ */
/* React component                                                     */
/* ------------------------------------------------------------------ */

type ResolvedProps = Required<Omit<CurtainProps, "className" | "style">>;

// The single choke point between props and the engine: colors funnel
// through setColors (which no-ops when unchanged), scalars are plain
// writes, and a pixel-ratio change re-derives the backing-store size.
function applyProps(engine: CurtainEngine, p: ResolvedProps) {
  engine.setColors(p.colorTop, p.colorBottom, p.layerLight, p.layerDark);
  engine.opts.flow = p.flow;
  engine.opts.wave = p.wave;
  engine.opts.intensity = p.intensity;
  engine.opts.fadeStart = p.fadeStart;
  engine.opts.fadeEnd = p.fadeEnd;
  engine.opts.gradientStart = p.gradientStart;
  engine.opts.gradientEnd = p.gradientEnd;
  if (engine.opts.maxPixelRatio !== p.maxPixelRatio) {
    engine.opts.maxPixelRatio = p.maxPixelRatio;
    engine.refreshSize();
  }
}

export function Curtain({
  colorTop = CURTAIN_DEFAULTS.colorTop,
  colorBottom = CURTAIN_DEFAULTS.colorBottom,
  layerLight = CURTAIN_DEFAULTS.layerLight,
  layerDark = CURTAIN_DEFAULTS.layerDark,
  speed = CURTAIN_DEFAULTS.speed,
  flow = CURTAIN_DEFAULTS.flow,
  wave = CURTAIN_DEFAULTS.wave,
  intensity = CURTAIN_DEFAULTS.intensity,
  fadeStart = CURTAIN_DEFAULTS.fadeStart,
  fadeEnd = CURTAIN_DEFAULTS.fadeEnd,
  gradientStart = CURTAIN_DEFAULTS.gradientStart,
  gradientEnd = CURTAIN_DEFAULTS.gradientEnd,
  paused = CURTAIN_DEFAULTS.paused,
  maxPixelRatio = CURTAIN_DEFAULTS.maxPixelRatio,
  className,
  style,
}: CurtainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<CurtainEngine | null>(null);
  // Latest resolved props, read by the render loop — prop changes never
  // tear down the WebGL context or the loop.
  const propsRef = useRef<ResolvedProps>(null!);
  // Forces one render while paused so prop/size changes still show up.
  const dirtyRef = useRef(true);
  // Purely decorative motion, so `prefers-reduced-motion` freezes the
  // animation on a static frame (same effect as the `paused` prop).
  const reducedMotionRef = useRef(false);
  // Restarts the loop after it idles (paused). Set by the mount effect.
  const kickRef = useRef<(() => void) | null>(null);

  // Declared before the mount effect so propsRef is populated on mount.
  useEffect(() => {
    propsRef.current = {
      colorTop,
      colorBottom,
      layerLight,
      layerDark,
      speed,
      flow,
      wave,
      intensity,
      fadeStart,
      fadeEnd,
      gradientStart,
      gradientEnd,
      paused,
      maxPixelRatio,
    };
    const engine = engineRef.current;
    if (engine) {
      applyProps(engine, propsRef.current);
      dirtyRef.current = true;
      kickRef.current?.();
    }
  }, [
    colorTop,
    colorBottom,
    layerLight,
    layerDark,
    speed,
    flow,
    wave,
    intensity,
    fadeStart,
    fadeEnd,
    gradientStart,
    gradientEnd,
    paused,
    maxPixelRatio,
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    cancelContextRelease(canvas);

    const createEngine = () => {
      const engine = new CurtainEngine(canvas, {
        flow: propsRef.current.flow,
        wave: propsRef.current.wave,
        intensity: propsRef.current.intensity,
        fadeStart: propsRef.current.fadeStart,
        fadeEnd: propsRef.current.fadeEnd,
        gradientStart: propsRef.current.gradientStart,
        gradientEnd: propsRef.current.gradientEnd,
        maxPixelRatio: propsRef.current.maxPixelRatio,
      });
      engineRef.current = engine;
      applyProps(engine, propsRef.current);
      return engine;
    };

    let engine: CurtainEngine;
    try {
      engine = createEngine();
    } catch (e) {
      console.warn("Curtain: WebGL2 unavailable, rendering nothing.", e);
      return;
    }

    let rafId = 0;
    let running = false;
    let last: number | null = null;
    let time = 0;
    // Off screen, the loop idles: no GPU work for a section nobody can see.
    let onScreen = true;
    let lost = false;

    const frame = (now: number) => {
      const p = propsRef.current;
      const idle = p.paused || reducedMotionRef.current || !onScreen;
      if (last === null) last = now;
      const dt = Math.min((now - last) / 1000, MAX_FRAME_DT);
      last = now;

      if (!idle) time += dt * p.speed;

      if (!idle || dirtyRef.current) {
        engine.renderFrame(time);
        dirtyRef.current = false;
      }

      if (idle) {
        // Go idle; the props effect (or a resize) kicks the loop again.
        running = false;
        last = null;
        return;
      }
      rafId = requestAnimationFrame(frame);
    };

    const kick = () => {
      if (!running && !lost) {
        running = true;
        last = null;
        rafId = requestAnimationFrame(frame);
      }
    };
    kickRef.current = kick;

    // Paint synchronously — rAF can be delayed indefinitely on hidden or
    // throttled tabs, and a freshly resized (hence cleared) canvas is blank
    // until something draws into it.
    const paintNow = () => {
      if (lost) return;
      engine.renderFrame(time);
      dirtyRef.current = false;
    };

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = motionQuery.matches;
    const onMotionChange = () => {
      reducedMotionRef.current = motionQuery.matches;
      dirtyRef.current = true;
      kick();
    };
    motionQuery.addEventListener("change", onMotionChange);

    const visibility = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        if (onScreen) kick();
      },
      { rootMargin: "100px" },
    );
    visibility.observe(canvas);

    const observer = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect;
      engine.resize(rect.width, rect.height);
      paintNow();
      kick();
    });
    observer.observe(canvas);
    // content-box size, consistent with the observer's contentRect
    engine.resize(canvas.clientWidth, canvas.clientHeight);
    paintNow();
    kick();

    // ResizeObserver only fires on CSS-size changes; re-derive the backing
    // resolution when devicePixelRatio changes (monitor move, zoom). The
    // media query matches the *current* DPR, so re-arm after each change.
    let dprQuery: MediaQueryList | null = null;
    const onDprChange = () => {
      engine.refreshSize();
      paintNow();
      kick();
      armDprListener();
    };
    const armDprListener = () => {
      dprQuery?.removeEventListener("change", onDprChange);
      dprQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
      dprQuery.addEventListener("change", onDprChange);
    };
    armDprListener();

    // The GPU can drop the context (driver reset, too many contexts, mobile
    // backgrounding). preventDefault lets the browser restore it; then every
    // GPU resource is gone, so build a fresh engine on the same canvas.
    const onContextLost = (event: Event) => {
      event.preventDefault();
      lost = true;
      cancelAnimationFrame(rafId);
      running = false;
    };
    const onContextRestored = () => {
      try {
        engine = createEngine();
      } catch (e) {
        console.warn("Curtain: could not restore the WebGL context.", e);
        return;
      }
      lost = false;
      engine.resize(canvas.clientWidth, canvas.clientHeight);
      paintNow();
      kick();
    };
    canvas.addEventListener("webglcontextlost", onContextLost);
    canvas.addEventListener("webglcontextrestored", onContextRestored);

    return () => {
      cancelAnimationFrame(rafId);
      kickRef.current = null;
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
      motionQuery.removeEventListener("change", onMotionChange);
      visibility.disconnect();
      observer.disconnect();
      dprQuery?.removeEventListener("change", onDprChange);
      engine.dispose();
      engineRef.current = null;
      scheduleContextRelease(canvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
      style={{ display: "block", width: "100%", height: "100%", ...style }}
    />
  );
}

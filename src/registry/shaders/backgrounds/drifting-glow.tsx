"use client";

import { useEffect, useRef, type CSSProperties } from "react";

/**
 * Drifting glow: an animated WebGL2 background of soft colour glows on a
 * light base.
 *
 * Two large, heavily blurred ellipses of colour sit behind the content at
 * low opacity: a tall periwinkle one on the left that bleeds off the bottom,
 * and a wide sky-blue one at the lower right, overlapping in the middle,
 * where the blue deepens. Each is a flat wash with a soft edge, as on the
 * original, so the two hues stay distinct instead of blending into one. Each drifts slowly on its own looping path, so
 * the overlap deepens and moves. A gentle noise warp keeps their edges
 * organic instead of perfectly round, and a fine dither stops the soft
 * gradients from banding on a white page.
 *
 * One fullscreen pass. Props change live without recreating the WebGL
 * context. The loop idles off screen, `prefers-reduced-motion` holds a still
 * frame, and a lost context is rebuilt when the browser restores it.
 *
 *   <section className="relative isolate overflow-hidden bg-white">
 *     <DriftingGlow className="absolute inset-0 -z-10" />
 *     ...content...
 *   </section>
 */
export interface DriftingGlowProps {
  /** Page colour the glows sit on. Hex. */
  colorBase?: string;
  /** Glow 1, the tall one on the left. Hex. */
  color1?: string;
  /** Glow 2, the wide one at the lower right. Hex. */
  color2?: string;
  /** Overall animation speed. 0 freezes it. Default 1. */
  speed?: number;
  /** Opacity of each glow over the base (0–1). Default 0.22. */
  intensity?: number;
  /** Glow size multiplier (1 = the original proportions). Default 1. */
  size?: number;
  /** How far each glow wanders from its home position (0–0.5). Default 0.1. */
  drift?: number;
  /** Edge blur, as a fraction of each glow's radius (0.05–1). Default 0.45. */
  softness?: number;
  /** How much the glow edges ripple out of round (0–1). Default 0.35. */
  warp?: number;
  /** Dither that hides banding (0–2). Default 1. */
  grain?: number;
  /** Pause the animation. The last frame stays visible and the render loop goes idle. */
  paused?: boolean;
  /** Cap on devicePixelRatio. The image is soft, so 1 is plenty. Default 1. */
  maxPixelRatio?: number;
  className?: string;
  style?: CSSProperties;
}

export const DRIFTING_GLOW_DEFAULTS = {
  colorBase: "#FFFFFF",
  color1: "#748BFF",
  color2: "#46B9FF",
  speed: 1,
  intensity: 0.22,
  size: 1,
  drift: 0.1,
  softness: 0.45,
  warp: 0.35,
  grain: 1,
  paused: false,
  maxPixelRatio: 1,
} as const;

type ResolvedProps = {
  -readonly [K in keyof typeof DRIFTING_GLOW_DEFAULTS]: (typeof DRIFTING_GLOW_DEFAULTS)[K] extends string
    ? string
    : (typeof DRIFTING_GLOW_DEFAULTS)[K] extends boolean
      ? boolean
      : number;
};

// A single hidden tab frame after refocus would otherwise advance the
// animation by the whole hidden duration.
const MAX_FRAME_DT = 0.1;

const COLOR_KEYS = ["colorBase", "color1", "color2"] as const;

const warnedColors = new Set<string>();

function parseHexColor(input: string, fallback: string): [number, number, number] {
  let hex = input.trim().replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(hex)) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  } else if (/^[0-9a-f]{6}([0-9a-f]{2})?$/i.test(hex)) {
    hex = hex.slice(0, 6);
  } else {
    if (!warnedColors.has(input)) {
      warnedColors.add(input);
      console.warn(`DriftingGlow: invalid color "${input}" — falling back to "${fallback}".`);
    }
    hex = fallback.replace(/^#/, "");
  }
  const v = parseInt(hex, 16);
  return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255];
}

/* ------------------------------------------------------------------ */
/* Shaders                                                             */
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
uniform float uIntensity;
uniform float uSize;
uniform float uDrift;
uniform float uWarp;
uniform float uSoftness;
uniform float uGrain;
uniform vec3  uBase;
uniform vec3  uGlow[2];

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1.0, 0.0)), u.x),
             mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x), u.y);
}

// One glow: a flat, soft-edged ellipse (a blurred solid shape, not a
// gaussian, so its colour holds across its whole area) around a centre that
// loops on a slow Lissajous path. Distances are in section-diagonal units, so
// the glows keep their proportions at any aspect ratio.
float glow(vec2 p, vec2 home, vec2 freq, float phase, vec2 radius, float t) {
  vec2 c = home + uDrift * vec2(sin(t * freq.x + phase), cos(t * freq.y + phase * 1.7));
  float r = length((p - c) / radius);
  return 1.0 - smoothstep(1.0 - uSoftness, 1.0 + uSoftness, r);
}

void main() {
  float diag = length(uResolution);
  // Origin at the centre, y up, in diagonal units.
  vec2 p = (gl_FragCoord.xy - 0.5 * uResolution) / diag;
  float t = uTime * 0.35;

  // Low-frequency warp so the glows ripple out of round.
  vec2 w = vec2(vnoise(p * 3.0 + vec2(0.0, t * 0.6)), vnoise(p * 3.0 + vec2(5.2, -t * 0.6))) - 0.5;
  p += w * 0.12 * uWarp;

  // Home positions as fractions of the section (-0.5..0.5 from the centre,
  // y up), mapped into diagonal units: a tall glow left of centre and a wide
  // one lower right, overlapping in the middle.
  vec2 span = uResolution / diag;
  // Measured from the original at 1440 × 860: a 668 × 790 ellipse and a
  // 993 × 615 one.
  vec2 h1 = vec2(-0.254, -0.174) * span;
  vec2 h2 = vec2( 0.155, -0.124) * span;

  float g1 = glow(p, h1, vec2(0.71, 0.53), 0.0, vec2(0.199, 0.236) * uSize, t);
  float g2 = glow(p, h2, vec2(0.47, 0.83), 2.1, vec2(0.296, 0.183) * uSize, t);

  // Each glow tints the base like a translucent wash, so overlaps deepen.
  vec3 col = uBase;
  col = mix(col, uGlow[0], clamp(g1 * uIntensity, 0.0, 1.0));
  col = mix(col, uGlow[1], clamp(g2 * uIntensity, 0.0, 1.0));

  // Triangular dither, about one 8-bit step, to stop banding.
  float n = hash12(gl_FragCoord.xy) + hash12(gl_FragCoord.xy + 17.3) - 1.0;
  col += n * (1.5 / 255.0) * uGrain;
  fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
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

const UNIFORMS = [
  "uResolution",
  "uTime",
  "uIntensity",
  "uSize",
  "uDrift",
  "uWarp",
  "uSoftness",
  "uGrain",
  "uBase",
  "uGlow",
] as const;

class GlowEngine {
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  private vao: WebGLVertexArrayObject;
  private quad: WebGLBuffer;
  private prog: WebGLProgram;
  private loc = new Map<string, WebGLUniformLocation | null>();
  private w = 0;
  private h = 0;
  private cssW = 0;
  private cssH = 0;
  private maxPixelRatio: number;
  private colorKey = "";
  private base: [number, number, number] = [1, 1, 1];
  private glows = new Float32Array(6);
  props: ResolvedProps;

  constructor(canvas: HTMLCanvasElement, props: ResolvedProps) {
    this.canvas = canvas;
    this.props = props;
    this.maxPixelRatio = props.maxPixelRatio;
    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
    });
    if (!gl) throw new Error("WebGL2 not supported");
    this.gl = gl;

    // One fullscreen triangle.
    this.quad = gl.createBuffer()!;
    this.vao = gl.createVertexArray()!;
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    this.prog = link(gl, VERT, FRAG);
    for (const name of UNIFORMS) this.loc.set(name, gl.getUniformLocation(this.prog, name));
    this.setProps(props);
  }

  setProps(p: ResolvedProps) {
    this.props = p;
    const key = COLOR_KEYS.map((k) => p[k]).join("|");
    if (key !== this.colorKey) {
      this.colorKey = key;
      this.base = parseHexColor(p.colorBase, DRIFTING_GLOW_DEFAULTS.colorBase);
      (["color1", "color2"] as const).forEach((k, i) =>
        this.glows.set(parseHexColor(p[k], DRIFTING_GLOW_DEFAULTS[k]), i * 3),
      );
    }
    if (p.maxPixelRatio !== this.maxPixelRatio) {
      this.maxPixelRatio = p.maxPixelRatio;
      this.refreshSize();
    }
  }

  resize(cssW: number, cssH: number) {
    this.cssW = cssW;
    this.cssH = cssH;
    const dpr = Math.min(window.devicePixelRatio || 1, this.maxPixelRatio);
    const w = Math.max(1, Math.round(cssW * dpr));
    const h = Math.max(1, Math.round(cssH * dpr));
    if (w === this.w && h === this.h) return;
    this.w = w;
    this.h = h;
    this.canvas.width = w;
    this.canvas.height = h;
  }

  refreshSize() {
    if (this.cssW > 0 && this.cssH > 0) this.resize(this.cssW, this.cssH);
  }

  renderFrame(time: number) {
    const gl = this.gl;
    if (this.w === 0 || this.h === 0) return;
    const p = this.props;
    const l = (n: (typeof UNIFORMS)[number]) => this.loc.get(n) ?? null;

    gl.bindVertexArray(this.vao);
    gl.viewport(0, 0, this.w, this.h);
    gl.useProgram(this.prog);
    gl.uniform2f(l("uResolution"), this.w, this.h);
    gl.uniform1f(l("uTime"), time);
    gl.uniform1f(l("uIntensity"), p.intensity);
    gl.uniform1f(l("uSize"), p.size);
    gl.uniform1f(l("uDrift"), p.drift);
    gl.uniform1f(l("uWarp"), p.warp);
    gl.uniform1f(l("uSoftness"), p.softness);
    gl.uniform1f(l("uGrain"), p.grain);
    gl.uniform3fv(l("uBase"), this.base);
    gl.uniform3fv(l("uGlow"), this.glows);
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
/* Browsers cap live WebGL contexts, so a real unmount releases its    */
/* context, deferred one macrotask so a StrictMode remount on the same */
/* canvas can cancel it.                                               */
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

export function DriftingGlow({ className, style, ...rest }: DriftingGlowProps) {
  const resolved = { ...DRIFTING_GLOW_DEFAULTS } as ResolvedProps;
  for (const [k, v] of Object.entries(rest)) {
    if (v !== undefined) (resolved as Record<string, unknown>)[k] = v;
  }

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GlowEngine | null>(null);
  // Latest resolved props, read by the render loop; prop changes never
  // tear down the WebGL context or the loop.
  const propsRef = useRef<ResolvedProps>(resolved);
  const dirtyRef = useRef(true);
  const reducedMotionRef = useRef(false);
  const kickRef = useRef<(() => void) | null>(null);

  // Every render: hand the latest props to the engine and repaint once.
  // Declared before the mount effect so propsRef is current on mount.
  useEffect(() => {
    propsRef.current = resolved;
    const engine = engineRef.current;
    if (engine) {
      engine.setProps(resolved);
      dirtyRef.current = true;
      kickRef.current?.();
    }
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    cancelContextRelease(canvas);

    let rafId = 0;
    let running = false;
    let last: number | null = null;
    // Start a few seconds in so the glows aren't all at their path origins.
    let time = 6;
    let onScreen = true;
    let lost = false;
    let engine: GlowEngine;

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

    const createEngine = () => {
      const next = new GlowEngine(canvas, propsRef.current);
      engineRef.current = next;
      return next;
    };

    try {
      engine = createEngine();
    } catch (e) {
      console.warn("DriftingGlow: WebGL2 unavailable, rendering nothing.", e);
      return;
    }
    kickRef.current = kick;

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
    engine.resize(canvas.clientWidth, canvas.clientHeight);
    paintNow();
    kick();

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
        console.warn("DriftingGlow: could not restore the WebGL context.", e);
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

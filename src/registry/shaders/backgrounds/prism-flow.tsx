"use client";

import { useEffect, useRef, type CSSProperties } from "react";

/**
 * Prism flow: an animated WebGL2 background of a soft, spectral light stream.
 *
 * A broad, blurred stream sweeps diagonally across a deep navy field. Along
 * its edge the light splits into soft rainbow layers (coral, yellow, green,
 * cyan, pink) that keep cycling along the stream. Deeper in, the colour melts
 * into a pale haze, then into electric blue. The edge itself undulates slowly
 * and the whole field is gently domain-warped, so nothing has a hard line.
 *
 * One fullscreen pass. Props change live without recreating the WebGL
 * context. The loop idles off screen, `prefers-reduced-motion` holds a still
 * frame, and a lost context is rebuilt when the browser restores it.
 *
 *   <section className="relative isolate overflow-hidden bg-[#03055C]">
 *     <PrismFlow className="absolute inset-0 -z-10" />
 *     ...content...
 *   </section>
 */
export interface PrismFlowProps {
  /** Field colour outside the stream (top). Hex. */
  colorDeep?: string;
  /** Electric blue the far side of the stream settles into. */
  colorBase?: string;
  /** Pale haze inside the stream. */
  colorHaze?: string;
  /** The five spectrum colours, cycled in order along the stream's edge. */
  spectrum1?: string;
  spectrum2?: string;
  spectrum3?: string;
  spectrum4?: string;
  spectrum5?: string;
  /** Overall animation speed. 0 freezes it. Default 1. */
  speed?: number;
  /** How fast the spectrum cycles along the stream, in cycles per second at speed 1. Default 0.05. */
  cycle?: number;
  /** How many spectrum layers sit across the stream's edge. Default 1. */
  spread?: number;
  /** Direction of the stream, in degrees (0 = horizontal, negative = descending to the right). Default -20. */
  angle?: number;
  /** Where the stream's edge crosses the middle, in section heights (positive is up). Default 0.14. */
  offset?: number;
  /** Depth of the spectral band before it melts into haze, in section heights. Default 0.8. */
  width?: number;
  /** Softness of the stream's edge, in section heights. Default 0.14. */
  softness?: number;
  /** How much the field is warped by slow noise (0–0.6). Default 0.22. */
  warp?: number;
  /** Fine noise against colour banding (0–2). Default 1. */
  grain?: number;
  /** Pause the animation. The last frame stays visible and the render loop goes idle. */
  paused?: boolean;
  /** Cap on devicePixelRatio. The image is soft, so 1 is plenty. Default 1. */
  maxPixelRatio?: number;
  className?: string;
  style?: CSSProperties;
}

export const PRISM_FLOW_DEFAULTS = {
  colorDeep: "#03055C",
  colorBase: "#2A2CE0",
  colorHaze: "#A9B9F2",
  spectrum1: "#FF5E62",
  spectrum2: "#F4D35E",
  spectrum3: "#5CD38E",
  spectrum4: "#6FC8F5",
  spectrum5: "#E68BE3",
  speed: 1,
  cycle: 0.05,
  spread: 1,
  angle: -20,
  offset: 0.14,
  width: 0.8,
  softness: 0.14,
  warp: 0.22,
  grain: 1,
  paused: false,
  maxPixelRatio: 1,
} as const;

type ResolvedProps = {
  -readonly [K in keyof typeof PRISM_FLOW_DEFAULTS]: (typeof PRISM_FLOW_DEFAULTS)[K] extends string
    ? string
    : (typeof PRISM_FLOW_DEFAULTS)[K] extends boolean
      ? boolean
      : number;
};

// A single hidden tab frame after refocus would otherwise advance the
// animation by the whole hidden duration.
const MAX_FRAME_DT = 0.1;

const COLOR_KEYS = [
  "colorDeep",
  "colorBase",
  "colorHaze",
  "spectrum1",
  "spectrum2",
  "spectrum3",
  "spectrum4",
  "spectrum5",
] as const;

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
      console.warn(`PrismFlow: invalid color "${input}" — falling back to "${fallback}".`);
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
uniform float uCycle;      // spectrum phase, already × time
uniform float uSpread;
uniform float uAngle;
uniform float uOffset;
uniform float uWidth;
uniform float uSoftness;
uniform float uWarp;
uniform float uGrain;
uniform vec3  uDeep;
uniform vec3  uBase;
uniform vec3  uHaze;
uniform vec3  uSpectrum[5];

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

// Four octaves, rotated between octaves so no grid shows through.
float fbm(vec2 p) {
  const mat2 R = mat2(0.8, 0.6, -0.6, 0.8);
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * vnoise(p);
    p = R * p * 2.02 + 7.3;
    a *= 0.5;
  }
  return v;
}

// The five spectrum colours as a closed loop, x in any range.
vec3 spectrum(float x) {
  x = fract(x) * 5.0;
  int i = int(floor(x));
  float f = smoothstep(0.0, 1.0, fract(x));
  return mix(uSpectrum[i], uSpectrum[(i + 1) % 5], f);
}

void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
  float t = uTime;

  // Into the stream's frame: x along the stream, y across it (up = outside).
  float ca = cos(uAngle), sa = sin(uAngle);
  vec2 r = vec2(ca * p.x + sa * p.y, -sa * p.x + ca * p.y);

  // Slow domain warp, so every line in the image bends softly.
  vec2 w = vec2(fbm(r * 1.1 + vec2(0.0, t * 0.05)), fbm(r * 1.1 + vec2(5.2, -t * 0.04)));
  vec2 q = r + uWarp * (w - 0.5) * 2.0;

  // The stream's edge: a gently undulating line. d > 0 is inside.
  float edge = uOffset + 0.1 * sin(q.x * 1.6 + t * 0.25) + 0.06 * sin(q.x * 3.1 - t * 0.18);
  float d = edge - q.y;
  float inside = smoothstep(-uSoftness, uSoftness, d);
  float e = clamp(d / uWidth, 0.0, 1.0);

  // Spectral layers parallel to the edge, broken up by noise and cycling
  // along the stream over time.
  float c = e * uSpread + 0.3 * fbm(q * 0.6 + t * 0.03) + q.x * 0.08 - uCycle;
  vec3 spec = mix(spectrum(c), uHaze, 0.1);

  // The spectrum only lives in a narrow band at the edge; deeper in it melts
  // into haze, then settles into electric blue.
  float band = exp(-e * 2.4);
  vec3 stream = mix(uHaze, spec, band * 0.9);
  stream = mix(stream, uBase, smoothstep(0.3, 1.0, e) * 0.75 + smoothstep(uWidth, uWidth * 2.2, d) * 0.2);

  // Outside: deep navy, lifting slightly towards the stream.
  vec3 field = mix(uDeep, uBase, smoothstep(0.6, -0.4, q.y - uOffset) * 0.25);
  vec3 col = mix(field, stream, inside);

  // A soft glow along the edge, in the edge's own colour.
  col += spec * 0.14 * exp(-abs(d) / 0.07);

  col += (hash12(gl_FragCoord.xy) - 0.5) * (1.5 / 255.0) * uGrain;
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
  "uCycle",
  "uSpread",
  "uAngle",
  "uOffset",
  "uWidth",
  "uSoftness",
  "uWarp",
  "uGrain",
  "uDeep",
  "uBase",
  "uHaze",
  "uSpectrum",
] as const;

class PrismEngine {
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
  private colors = new Map<string, [number, number, number]>();
  private spectrum = new Float32Array(15);
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
      for (const k of COLOR_KEYS) this.colors.set(k, parseHexColor(p[k], PRISM_FLOW_DEFAULTS[k]));
      COLOR_KEYS.slice(3).forEach((k, i) => this.spectrum.set(this.colors.get(k)!, i * 3));
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

  renderFrame(time: number, cycle: number) {
    const gl = this.gl;
    if (this.w === 0 || this.h === 0) return;
    const p = this.props;
    const l = (n: (typeof UNIFORMS)[number]) => this.loc.get(n) ?? null;

    gl.bindVertexArray(this.vao);
    gl.viewport(0, 0, this.w, this.h);
    gl.useProgram(this.prog);
    gl.uniform2f(l("uResolution"), this.w, this.h);
    gl.uniform1f(l("uTime"), time);
    gl.uniform1f(l("uCycle"), cycle);
    gl.uniform1f(l("uSpread"), p.spread);
    gl.uniform1f(l("uAngle"), (p.angle * Math.PI) / 180);
    gl.uniform1f(l("uOffset"), p.offset);
    gl.uniform1f(l("uWidth"), Math.max(p.width, 0.01));
    gl.uniform1f(l("uSoftness"), Math.max(p.softness, 0.001));
    gl.uniform1f(l("uWarp"), p.warp);
    gl.uniform1f(l("uGrain"), p.grain);
    gl.uniform3fv(l("uDeep"), this.colors.get("colorDeep")!);
    gl.uniform3fv(l("uBase"), this.colors.get("colorBase")!);
    gl.uniform3fv(l("uHaze"), this.colors.get("colorHaze")!);
    gl.uniform3fv(l("uSpectrum"), this.spectrum);
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

export function PrismFlow({ className, style, ...rest }: PrismFlowProps) {
  const resolved = { ...PRISM_FLOW_DEFAULTS } as ResolvedProps;
  for (const [k, v] of Object.entries(rest)) {
    if (v !== undefined) (resolved as Record<string, unknown>)[k] = v;
  }

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<PrismEngine | null>(null);
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
    // Start a few seconds in so the first frame is already a settled image.
    let time = 8;
    let cycle = 0;
    let onScreen = true;
    let lost = false;
    let engine: PrismEngine;

    const frame = (now: number) => {
      const p = propsRef.current;
      const idle = p.paused || reducedMotionRef.current || !onScreen;
      if (last === null) last = now;
      const dt = Math.min((now - last) / 1000, MAX_FRAME_DT);
      last = now;

      if (!idle) {
        time += dt * p.speed;
        cycle += dt * p.speed * p.cycle;
      }

      if (!idle || dirtyRef.current) {
        engine.renderFrame(time, cycle);
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
      const next = new PrismEngine(canvas, propsRef.current);
      engineRef.current = next;
      return next;
    };

    try {
      engine = createEngine();
    } catch (e) {
      console.warn("PrismFlow: WebGL2 unavailable, rendering nothing.", e);
      return;
    }
    kickRef.current = kick;

    const paintNow = () => {
      if (lost) return;
      engine.renderFrame(time, cycle);
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
        console.warn("PrismFlow: could not restore the WebGL context.", e);
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

"use client";

import { useEffect, useRef, type CSSProperties } from "react";

/**
 * Neon marble: an animated WebGL2 background of saturated neon liquid.
 *
 * The whole frame is a flowing, marbled liquid in neon colours (violet,
 * magenta, orange, lime and teal) folded into long diagonal streaks, with
 * darker pockets for depth and a film grain over it. It's layered domain
 * warping: noise warps the coordinates of noise, which warps the
 * coordinates of noise again. The final value runs through a looping
 * five-colour palette that slowly cycles, so colours travel through the folds.
 *
 * One fullscreen pass. Props change live without recreating the WebGL
 * context. The loop idles off screen, `prefers-reduced-motion` holds a still
 * frame, and a lost context is rebuilt when the browser restores it.
 *
 *   <section className="relative isolate overflow-hidden bg-[#3A1468]">
 *     <NeonMarble className="absolute inset-0 -z-10" />
 *     ...content...
 *   </section>
 */
export interface NeonMarbleProps {
  /** The five palette colours, looped in order through the folds. Hex. */
  color1?: string;
  color2?: string;
  color3?: string;
  color4?: string;
  color5?: string;
  /** Colour of the dark pockets. */
  colorShadow?: string;
  /** Overall animation speed. 0 freezes it. Default 1. */
  speed?: number;
  /** How fast the palette travels through the folds, in cycles per second at speed 1. Default 0.03. */
  cycle?: number;
  /** Size of the liquid's features (higher = smaller, busier folds). Default 0.5. */
  scale?: number;
  /** How strongly the liquid folds over itself (0–2). Default 0.85. */
  warp?: number;
  /** How long the streaks are drawn out along the flow (1 = no stretch). Default 2.2. */
  stretch?: number;
  /** Direction of the streaks, in degrees. Default -28. */
  angle?: number;
  /** How many colour bands run through one fold. Default 0.8. */
  spread?: number;
  /** How dark the shadow pockets get (0–1). Default 0.55. */
  shadow?: number;
  /** Film grain (0–2). Default 1. */
  grain?: number;
  /** Pause the animation. The last frame stays visible and the render loop goes idle. */
  paused?: boolean;
  /** Cap on devicePixelRatio. The image is soft, so 1 is plenty. Default 1. */
  maxPixelRatio?: number;
  className?: string;
  style?: CSSProperties;
}

export const NEON_MARBLE_DEFAULTS = {
  color1: "#6E4BF2",
  color2: "#E24FB6",
  color3: "#FF7A2E",
  color4: "#B8EE4C",
  color5: "#5FA7A0",
  colorShadow: "#3A1468",
  speed: 1,
  cycle: 0.03,
  scale: 0.5,
  warp: 0.85,
  stretch: 2.2,
  angle: -28,
  spread: 0.8,
  shadow: 0.55,
  grain: 1,
  paused: false,
  maxPixelRatio: 1,
} as const;

type ResolvedProps = {
  -readonly [K in keyof typeof NEON_MARBLE_DEFAULTS]: (typeof NEON_MARBLE_DEFAULTS)[K] extends string
    ? string
    : (typeof NEON_MARBLE_DEFAULTS)[K] extends boolean
      ? boolean
      : number;
};

// A single hidden tab frame after refocus would otherwise advance the
// animation by the whole hidden duration.
const MAX_FRAME_DT = 0.1;

const COLOR_KEYS = ["color1", "color2", "color3", "color4", "color5", "colorShadow"] as const;

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
      console.warn(`NeonMarble: invalid color "${input}" — falling back to "${fallback}".`);
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
uniform float uCycle;      // palette phase, already × time
uniform float uScale;
uniform float uWarp;
uniform float uStretch;
uniform float uAngle;
uniform float uSpread;
uniform float uShadow;
uniform float uGrain;
uniform vec3  uPalette[5];
uniform vec3  uShadowColor;

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

// Three octaves, rotated between octaves so no grid shows through. Few
// octaves keep the liquid soft and broad.
float fbm(vec2 p) {
  const mat2 R = mat2(0.8, 0.6, -0.6, 0.8);
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 3; i++) {
    v += a * vnoise(p);
    p = R * p * 2.03 + 11.7;
    a *= 0.5;
  }
  return v;
}

// The five palette colours as a closed loop, x in any range.
vec3 palette(float x) {
  x = fract(x) * 5.0;
  int i = int(floor(x));
  float f = smoothstep(0.0, 1.0, fract(x));
  return mix(uPalette[i], uPalette[(i + 1) % 5], f);
}

void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
  float t = uTime * 0.12;

  // Into the streak frame, drawn out along x so the folds become streaks.
  float ca = cos(uAngle), sa = sin(uAngle);
  p = vec2(ca * p.x + sa * p.y, -sa * p.x + ca * p.y);
  p.x /= max(uStretch, 0.1);
  p *= uScale * 2.0;

  // Layered domain warp: noise bends noise, which bends noise again.
  vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm(p + 4.0 * uWarp * q + vec2(1.7, 9.2) + 0.15 * t),
                fbm(p + 4.0 * uWarp * q + vec2(8.3, 2.8) - 0.126 * t));
  float f = fbm(p + 4.0 * uWarp * r);

  // Colour comes from where the liquid ended up, so it follows the folds.
  vec3 col = palette(f * uSpread * 2.0 + length(q) * 0.4 + r.x * 0.3 - uCycle);

  // Dark pockets where the second warp layer runs low, for depth.
  float lit = smoothstep(0.18, 0.6, r.y);
  col = mix(mix(uShadowColor, col, 0.35), col, mix(1.0, lit, uShadow));

  // Film grain.
  col += (hash12(gl_FragCoord.xy) - 0.5) * 0.11 * uGrain;
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
  "uScale",
  "uWarp",
  "uStretch",
  "uAngle",
  "uSpread",
  "uShadow",
  "uGrain",
  "uPalette",
  "uShadowColor",
] as const;

class NeonEngine {
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
  private palette = new Float32Array(15);
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
      for (const k of COLOR_KEYS) this.colors.set(k, parseHexColor(p[k], NEON_MARBLE_DEFAULTS[k]));
      COLOR_KEYS.slice(0, 5).forEach((k, i) => this.palette.set(this.colors.get(k)!, i * 3));
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
    gl.uniform1f(l("uScale"), p.scale);
    gl.uniform1f(l("uWarp"), p.warp);
    gl.uniform1f(l("uStretch"), p.stretch);
    gl.uniform1f(l("uAngle"), (p.angle * Math.PI) / 180);
    gl.uniform1f(l("uSpread"), p.spread);
    gl.uniform1f(l("uShadow"), p.shadow);
    gl.uniform1f(l("uGrain"), p.grain);
    gl.uniform3fv(l("uPalette"), this.palette);
    gl.uniform3fv(l("uShadowColor"), this.colors.get("colorShadow")!);
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

export function NeonMarble({ className, style, ...rest }: NeonMarbleProps) {
  const resolved = { ...NEON_MARBLE_DEFAULTS } as ResolvedProps;
  for (const [k, v] of Object.entries(rest)) {
    if (v !== undefined) (resolved as Record<string, unknown>)[k] = v;
  }

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<NeonEngine | null>(null);
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
    let engine: NeonEngine;

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
      const next = new NeonEngine(canvas, propsRef.current);
      engineRef.current = next;
      return next;
    };

    try {
      engine = createEngine();
    } catch (e) {
      console.warn("NeonMarble: WebGL2 unavailable, rendering nothing.", e);
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
        console.warn("NeonMarble: could not restore the WebGL context.", e);
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

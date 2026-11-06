"use client";

import { useEffect, useRef, type CSSProperties } from "react";

/**
 * Aurora — animated WebGL2 gradient background.
 *
 * Renders a 5-pass shader pipeline (gradient → polar → liquify →
 * chromatic aberration → blinds) into a <canvas> that fills its parent.
 * All visual controls are exposed as props and can be changed live
 * without recreating the WebGL context.
 *
 * The loop idles while the canvas is off screen, and `prefers-reduced-motion`
 * holds a still frame. A lost WebGL context is rebuilt when the browser
 * restores it.
 *
 * Drop it into any positioned container:
 *
 *   <section className="relative overflow-hidden">
 *     <Aurora className="absolute inset-0 -z-10" />
 *     ...content...
 *   </section>
 */
export interface AuroraProps {
  /** Lightest color of the gradient ramp. Hex: #RGB, #RRGGBB or #RRGGBBAA (alpha ignored). */
  colorLight?: string;
  /** Middle color of the gradient ramp. */
  colorMid?: string;
  /** Darkest color of the gradient ramp. */
  colorDark?: string;
  /** Animation speed multiplier. 0 freezes motion. Default 1. */
  speed?: number;
  /** Liquify warp amplitude (0–0.4). Default 0.222. */
  warpAmplitude?: number;
  /** Liquify warp frequency (0–0.3). Default 0.12. */
  warpFrequency?: number;
  /** Number of blinds stripes (min 2). Default 24. */
  stripeCount?: number;
  /** Stripe fringe/dispersion strength (0–1). Default 0.31. */
  stripeDispersion?: number;
  /** Chromatic aberration strength (0–0.02). Default 0.006. */
  chromaticAberration?: number;
  /** Pause the animation. The last frame stays visible and the render loop goes idle. */
  paused?: boolean;
  /** Cap on devicePixelRatio for rendering resolution. Lower it for large sections. Default 2. */
  maxPixelRatio?: number;
  className?: string;
  style?: CSSProperties;
}

export const AURORA_DEFAULTS = {
  colorLight: "#96ABD7",
  colorMid: "#5973C2",
  colorDark: "#FFFFFF",
  speed: 1.0,
  warpAmplitude: 0.222,
  warpFrequency: 0.12,
  stripeCount: 24,
  stripeDispersion: 0.31,
  chromaticAberration: 0.006,
  paused: false,
  maxPixelRatio: 2,
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
      console.warn(`Aurora: invalid color "${input}" — falling back to "${fallback}".`);
    }
    hex = fallback.replace(/^#/, "");
  }
  const v = parseInt(hex, 16);
  return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255];
}

// Build an 11-stop ramp by interpolating light -> mid -> dark,
// matching the two-segment blend the shader itself uses.
function buildColorStops(lightHex: string, midHex: string, darkHex: string) {
  const light = parseHexColor(lightHex, AURORA_DEFAULTS.colorLight);
  const mid = parseHexColor(midHex, AURORA_DEFAULTS.colorMid);
  const dark = parseHexColor(darkHex, AURORA_DEFAULTS.colorDark);
  const N = 11;
  const flat = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    for (let k = 0; k < 3; k++) {
      flat[i * 3 + k] =
        t < 0.5
          ? light[k] + (mid[k] - light[k]) * (t * 2)
          : mid[k] + (dark[k] - mid[k]) * ((t - 0.5) * 2);
    }
  }
  return { flat, count: N };
}

/* ------------------------------------------------------------------ */
/* Shaders (5-pass pipeline: gradient -> polar -> liquify -> chromatic */
/* aberration -> blinds).                                              */
/* ------------------------------------------------------------------ */

const VERT = `#version 300 es
layout(location = 0) in vec2 position;
out vec2 vUv;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
  vUv = position * 0.5 + 0.5;
}`;

const FRAG_GRADIENT = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform float uColorCount;
uniform vec3 uColors[11];

vec3 srgbToLinear(vec3 c){ return pow(c, vec3(2.2)); }
vec3 linearToSrgb(vec3 c){ return pow(c, vec3(1.0/2.2)); }

vec3 blendStops(vec3 a, vec3 b, float t) {
  return linearToSrgb(mix(srgbToLinear(a), srgbToLinear(b), t));
}

vec3 getGradientColor(float t) {
  int count = int(clamp(uColorCount, 2.0, 11.0));
  t = clamp(t, 0.0, 1.0);
  float scaled = t * float(count - 1);
  int seg = min(int(floor(scaled)), count - 2);
  float localT = scaled - float(seg);
  return blendStops(uColors[seg], uColors[seg + 1], localT);
}

void main() {
  fragColor = vec4(getGradientColor(vUv.x), 1.0);
}`;

const FRAG_POLAR = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uTexture;
uniform vec2 uResolution;
const float PI = 3.14159265359;

void main() {
  float aspect = uResolution.x / uResolution.y;
  vec2 p = (vUv - 0.5) * vec2(aspect, 1.0);
  float radius = length(p);
  float angle = atan(p.y, p.x);
  float xCoord = (angle + PI) / (2.0 * PI);
  fragColor = texture(uTexture, vec2(radius, xCoord));
}`;

const FRAG_LIQUIFY = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform float uTime;
uniform float uLiquifyAmplitude;
uniform float uLiquifyFrequency;
const float PI = 3.14159265;
const float LIQUIFY_SPEED = 0.2;

mat2 rot(float a) { return mat2(cos(a), -sin(a), sin(a), cos(a)); }

vec2 liquify(vec2 st) {
  float aspect = uResolution.x / uResolution.y;
  vec2 pos = vec2(0.5);
  st -= pos;
  st.x *= aspect;
  st = st * rot(0.459 * 2.0 * PI);

  float freq = 5.0 * (uLiquifyFrequency + 0.1);
  float t = uTime * LIQUIFY_SPEED;
  float amplitude = uLiquifyAmplitude;

  for (float i = 1.0; i <= 5.0; i++) {
    st = st * rot(i / 5.0 * PI * 2.0);
    float ff = i * freq;
    st.x += amplitude * cos(ff * st.y + t);
    st.y += amplitude * sin(ff * st.x + t);
  }

  st = st * rot(0.459 * -2.0 * PI);
  st.x /= aspect;
  st += pos;
  return st;
}

void main() {
  vec2 uv = liquify(vUv);
  fragColor = texture(uTexture, clamp(uv, 0.0, 1.0));
}`;

const FRAG_CHROMATIC = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform float uChromaStrength;

void main() {
  float aspect = uResolution.x / uResolution.y;
  vec2 p = (vUv - 0.5) * vec2(aspect, 1.0);
  float dist = length(p);
  vec2 dir = dist > 0.0001 ? p / dist : vec2(0.0);
  vec2 normalizedDir = vec2(dir.x / aspect, dir.y);

  vec2 offset = uChromaStrength * normalizedDir * dist;

  vec4 colorR = texture(uTexture, vUv + offset);
  vec4 colorG = texture(uTexture, vUv);
  vec4 colorB = texture(uTexture, vUv - offset);

  fragColor = vec4(colorR.r, colorG.g, colorB.b, colorR.a * colorG.a * colorB.a);
}`;

const FRAG_BLINDS = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform float uBlindsDivisions;
uniform float uBlindsDispersion;
const float PI = 3.14159265;
const float BLINDS_ANGLE = 0.25;      // turns -> vertical stripes
const float BLINDS_DISTORTION = 0.1;  // -> exponent 1.4

mat2 rot(float a) { return mat2(cos(a), -sin(a), sin(a), cos(a)); }
vec2 scaleAspect(vec2 st) { return st * vec2(uResolution.x / uResolution.y, 1.0); }
vec2 unscaleAspect(vec2 st) { return st * vec2(uResolution.y / uResolution.x, 1.0); }

vec3 channelDistort(float segment) {
  vec3 first = vec3(1.0, 0.0, 0.0);
  vec3 second = vec3(0.0, 1.0, 0.0);
  vec3 third = vec3(0.0, 0.0, 1.0);
  return mix(
    mix(first, second, segment * 2.0),
    mix(second, third, (segment - 0.5) * 2.0),
    step(0.5, segment)
  );
}

vec2 applyStyle(vec2 st, vec2 pos, float angle) {
  st = rot(angle * 2.0 * PI) * (st - pos) + pos;
  return unscaleAspect(st);
}

vec2 blindsDistort(vec2 st, vec2 pos, float divisions, float dist, float amount, float angle, out vec3 d) {
  float segment = fract((st.y - pos.y) * divisions);
  d = channelDistort(segment);
  st.y -= pow(d.r, dist) / 10.0 * amount;
  st.y += pow(d.b, dist) / 10.0 * amount;
  return applyStyle(st, pos, angle);
}

void main() {
  vec2 uv = vUv;
  vec2 pos = scaleAspect(vec2(0.5));
  vec2 st = scaleAspect(uv);
  st = rot(BLINDS_ANGLE * -2.0 * PI) * (st - pos) + pos;

  float divisions = max(uBlindsDivisions, 2.0);
  float dist = BLINDS_DISTORTION * 4.0 + 1.0;
  float amount = uBlindsDispersion;

  vec2 texelX = dFdx(st) * 1.5;
  vec2 texelY = dFdy(st) * 1.5;

  vec3 distort, scratch;
  vec2 result  = blindsDistort(st,        pos, divisions, dist, amount, BLINDS_ANGLE, distort);
  vec2 result1 = blindsDistort(st+texelX, pos, divisions, dist, amount, BLINDS_ANGLE, scratch);
  vec2 result2 = blindsDistort(st+texelY, pos, divisions, dist, amount, BLINDS_ANGLE, scratch);
  vec2 result3 = blindsDistort(st-texelX, pos, divisions, dist, amount, BLINDS_ANGLE, scratch);
  vec2 result4 = blindsDistort(st-texelY, pos, divisions, dist, amount, BLINDS_ANGLE, scratch);

  vec2 finalUv = (result + result1 + result2 + result3 + result4) / 5.0;
  fragColor = texture(uTexture, clamp(finalUv, 0.0, 1.0));
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

interface Fbo {
  fbo: WebGLFramebuffer;
  tex: WebGLTexture;
  w: number;
  h: number;
}

function makeFbo(gl: WebGL2RenderingContext, w: number, h: number): Fbo {
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const fbo = gl.createFramebuffer()!;
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { fbo, tex, w, h };
}

function resizeFbo(gl: WebGL2RenderingContext, target: Fbo, w: number, h: number) {
  gl.bindTexture(gl.TEXTURE_2D, target.tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  target.w = w;
  target.h = h;
}

// Visual parameters the engine consumes; written by applyProps, read at
// bake/render time.
interface EngineOpts {
  warpAmplitude: number;
  warpFrequency: number;
  stripeCount: number;
  stripeDispersion: number;
  chromaticAberration: number;
  maxPixelRatio: number;
}

const GRADIENT_UNIFORMS = ["uColorCount", "uColors[0]"] as const;
const POLAR_UNIFORMS = ["uResolution", "uTexture"] as const;
const LIQUIFY_UNIFORMS = ["uResolution", "uTime", "uLiquifyAmplitude", "uLiquifyFrequency", "uTexture"] as const;
const CHROMA_UNIFORMS = ["uResolution", "uChromaStrength", "uTexture"] as const;
const BLINDS_UNIFORMS = ["uResolution", "uBlindsDivisions", "uBlindsDispersion", "uTexture"] as const;

class AuroraEngine {
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  private vao: WebGLVertexArrayObject;
  private quad: WebGLBuffer;
  private progGradient: WebGLProgram;
  private progPolar: WebGLProgram;
  private progLiquify: WebGLProgram;
  private progChroma: WebGLProgram;
  private progBlinds: WebGLProgram;
  private locGradient: Record<(typeof GRADIENT_UNIFORMS)[number], WebGLUniformLocation | null>;
  private locPolar: Record<(typeof POLAR_UNIFORMS)[number], WebGLUniformLocation | null>;
  private locLiquify: Record<(typeof LIQUIFY_UNIFORMS)[number], WebGLUniformLocation | null>;
  private locChroma: Record<(typeof CHROMA_UNIFORMS)[number], WebGLUniformLocation | null>;
  private locBlinds: Record<(typeof BLINDS_UNIFORMS)[number], WebGLUniformLocation | null>;
  private fboGradient: Fbo | null = null;
  private fboPolar: Fbo | null = null;
  private fboLiquify: Fbo | null = null;
  private fboChroma: Fbo | null = null;
  private w = 0;
  private h = 0;
  private cssW = 0;
  private cssH = 0;
  private baked = false;
  private colors = new Float32Array(0);
  private colorCount = 0;
  private colorKey = "";
  opts: EngineOpts;

  constructor(canvas: HTMLCanvasElement, opts: EngineOpts) {
    this.canvas = canvas;
    this.opts = opts;
    const gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: false });
    if (!gl) throw new Error("WebGL2 not supported");
    this.gl = gl;

    // One fullscreen-quad VAO shared by all passes: every program uses the
    // same VERT with position pinned to location 0.
    this.quad = gl.createBuffer()!;
    this.vao = gl.createVertexArray()!;
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    this.progGradient = link(gl, VERT, FRAG_GRADIENT);
    this.progPolar = link(gl, VERT, FRAG_POLAR);
    this.progLiquify = link(gl, VERT, FRAG_LIQUIFY);
    this.progChroma = link(gl, VERT, FRAG_CHROMATIC);
    this.progBlinds = link(gl, VERT, FRAG_BLINDS);

    this.locGradient = uniformLocations(gl, this.progGradient, GRADIENT_UNIFORMS);
    this.locPolar = uniformLocations(gl, this.progPolar, POLAR_UNIFORMS);
    this.locLiquify = uniformLocations(gl, this.progLiquify, LIQUIFY_UNIFORMS);
    this.locChroma = uniformLocations(gl, this.progChroma, CHROMA_UNIFORMS);
    this.locBlinds = uniformLocations(gl, this.progBlinds, BLINDS_UNIFORMS);
  }

  setColors(lightHex: string, midHex: string, darkHex: string) {
    const key = `${lightHex}|${midHex}|${darkHex}`;
    if (key === this.colorKey) return;
    this.colorKey = key;
    const stops = buildColorStops(lightHex, midHex, darkHex);
    this.colors = stops.flat;
    this.colorCount = stops.count;
    this.baked = false;
  }

  resize(cssW: number, cssH: number) {
    const gl = this.gl;
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

    if (!this.fboGradient) {
      this.fboGradient = makeFbo(gl, w, h);
      this.fboPolar = makeFbo(gl, w, h);
      this.fboLiquify = makeFbo(gl, w, h);
      this.fboChroma = makeFbo(gl, w, h);
    } else {
      resizeFbo(gl, this.fboGradient, w, h);
      resizeFbo(gl, this.fboPolar!, w, h);
      resizeFbo(gl, this.fboLiquify!, w, h);
      resizeFbo(gl, this.fboChroma!, w, h);
    }
    this.baked = false;
  }

  // Recompute the backing-store size for the current CSS size — used when
  // devicePixelRatio or the maxPixelRatio cap changes without a layout resize.
  refreshSize() {
    if (this.cssW > 0 && this.cssH > 0) this.resize(this.cssW, this.cssH);
  }

  // The gradient + polar passes only depend on colors and size, so they
  // are baked once and reused until either changes.
  private bakeBase() {
    const gl = this.gl;

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fboGradient!.fbo);
    gl.useProgram(this.progGradient);
    gl.uniform1f(this.locGradient.uColorCount, this.colorCount);
    gl.uniform3fv(this.locGradient["uColors[0]"], this.colors);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fboPolar!.fbo);
    gl.useProgram(this.progPolar);
    gl.uniform2f(this.locPolar.uResolution, this.w, this.h);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.fboGradient!.tex);
    gl.uniform1i(this.locPolar.uTexture, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    this.baked = true;
  }

  renderFrame(timeSeconds: number) {
    const gl = this.gl;
    if (this.w === 0 || this.h === 0) return;

    gl.bindVertexArray(this.vao);
    gl.viewport(0, 0, this.w, this.h);
    if (!this.baked) this.bakeBase();
    const { warpAmplitude, warpFrequency, stripeCount, stripeDispersion, chromaticAberration } = this.opts;

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fboLiquify!.fbo);
    gl.useProgram(this.progLiquify);
    gl.uniform2f(this.locLiquify.uResolution, this.w, this.h);
    gl.uniform1f(this.locLiquify.uTime, timeSeconds);
    gl.uniform1f(this.locLiquify.uLiquifyAmplitude, warpAmplitude);
    gl.uniform1f(this.locLiquify.uLiquifyFrequency, warpFrequency);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.fboPolar!.tex);
    gl.uniform1i(this.locLiquify.uTexture, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fboChroma!.fbo);
    gl.useProgram(this.progChroma);
    gl.uniform2f(this.locChroma.uResolution, this.w, this.h);
    gl.uniform1f(this.locChroma.uChromaStrength, chromaticAberration);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.fboLiquify!.tex);
    gl.uniform1i(this.locChroma.uTexture, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.useProgram(this.progBlinds);
    gl.uniform2f(this.locBlinds.uResolution, this.w, this.h);
    gl.uniform1f(this.locBlinds.uBlindsDivisions, stripeCount);
    gl.uniform1f(this.locBlinds.uBlindsDispersion, stripeDispersion);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.fboChroma!.tex);
    gl.uniform1i(this.locBlinds.uTexture, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  dispose() {
    const gl = this.gl;
    for (const f of [this.fboGradient, this.fboPolar, this.fboLiquify, this.fboChroma]) {
      if (f) {
        gl.deleteFramebuffer(f.fbo);
        gl.deleteTexture(f.tex);
      }
    }
    for (const p of [this.progGradient, this.progPolar, this.progLiquify, this.progChroma, this.progBlinds]) {
      gl.deleteProgram(p);
    }
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

type ResolvedProps = Required<Omit<AuroraProps, "className" | "style">>;

// The single choke point between props and the engine: colors funnel
// through setColors (which no-ops when unchanged), scalars are plain
// writes, and a pixel-ratio change re-derives the backing-store size.
function applyProps(engine: AuroraEngine, p: ResolvedProps) {
  engine.setColors(p.colorLight, p.colorMid, p.colorDark);
  engine.opts.warpAmplitude = p.warpAmplitude;
  engine.opts.warpFrequency = p.warpFrequency;
  engine.opts.stripeCount = p.stripeCount;
  engine.opts.stripeDispersion = p.stripeDispersion;
  engine.opts.chromaticAberration = p.chromaticAberration;
  if (engine.opts.maxPixelRatio !== p.maxPixelRatio) {
    engine.opts.maxPixelRatio = p.maxPixelRatio;
    engine.refreshSize();
  }
}

export function Aurora({
  colorLight = AURORA_DEFAULTS.colorLight,
  colorMid = AURORA_DEFAULTS.colorMid,
  colorDark = AURORA_DEFAULTS.colorDark,
  speed = AURORA_DEFAULTS.speed,
  warpAmplitude = AURORA_DEFAULTS.warpAmplitude,
  warpFrequency = AURORA_DEFAULTS.warpFrequency,
  stripeCount = AURORA_DEFAULTS.stripeCount,
  stripeDispersion = AURORA_DEFAULTS.stripeDispersion,
  chromaticAberration = AURORA_DEFAULTS.chromaticAberration,
  paused = AURORA_DEFAULTS.paused,
  maxPixelRatio = AURORA_DEFAULTS.maxPixelRatio,
  className,
  style,
}: AuroraProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<AuroraEngine | null>(null);
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
      colorLight,
      colorMid,
      colorDark,
      speed,
      warpAmplitude,
      warpFrequency,
      stripeCount,
      stripeDispersion,
      chromaticAberration,
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
    colorLight,
    colorMid,
    colorDark,
    speed,
    warpAmplitude,
    warpFrequency,
    stripeCount,
    stripeDispersion,
    chromaticAberration,
    paused,
    maxPixelRatio,
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    cancelContextRelease(canvas);

    const createEngine = () => {
      const engine = new AuroraEngine(canvas, {
        warpAmplitude: propsRef.current.warpAmplitude,
        warpFrequency: propsRef.current.warpFrequency,
        stripeCount: propsRef.current.stripeCount,
        stripeDispersion: propsRef.current.stripeDispersion,
        chromaticAberration: propsRef.current.chromaticAberration,
        maxPixelRatio: propsRef.current.maxPixelRatio,
      });
      engineRef.current = engine;
      applyProps(engine, propsRef.current);
      return engine;
    };

    let engine: AuroraEngine;
    try {
      engine = createEngine();
    } catch (e) {
      console.warn("Aurora: WebGL2 unavailable, rendering nothing.", e);
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
        // Go idle; the props effect, a resize, or scrolling back kicks it again.
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
      dirtyRef.current = true;
      kick();
    });
    observer.observe(canvas);
    // content-box size, consistent with the observer's contentRect
    engine.resize(canvas.clientWidth, canvas.clientHeight);
    kick();

    // ResizeObserver only fires on CSS-size changes; re-derive the backing
    // resolution when devicePixelRatio changes (monitor move, zoom). The
    // media query matches the *current* DPR, so re-arm after each change.
    let dprQuery: MediaQueryList | null = null;
    const onDprChange = () => {
      engine.refreshSize();
      dirtyRef.current = true;
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
        console.warn("Aurora: could not restore the WebGL context.", e);
        return;
      }
      lost = false;
      engine.resize(canvas.clientWidth, canvas.clientHeight);
      dirtyRef.current = true;
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

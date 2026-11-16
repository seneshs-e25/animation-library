"use client";

import { useEffect, useRef, type CSSProperties } from "react";

/**
 * Layer Cascade — animated WebGL2 stacked-layer background.
 *
 * A static four-cornered shape (a rounded rectangle by default) sits on top
 * of a stack of layers of the same shape, each one a little larger, more
 * turned and darker than the one in front of it, fanning out to black at the
 * edges of the frame. New layers keep sliding out from under the top shape
 * and sink down through the stack: growing, turning and dimming as they
 * recede, until they melt into the background. The top shape never moves.
 * Move its four corners with the `corners` prop to skew it into any
 * quadrilateral; the layers behind follow the same outline. The colour is one screen-space gradient
 * (cyan at the top, violet in the middle, deep blue at the bottom) that each
 * layer reveals at its own depth.
 *
 * One fullscreen pass into a <canvas> that fills its parent. All visual
 * controls are props and change live without recreating the WebGL context.
 * The loop idles while the canvas is off screen, and `prefers-reduced-motion`
 * holds a still frame. A lost WebGL context is rebuilt when the browser
 * restores it.
 *
 * Drop it into any positioned container:
 *
 *   <section className="relative overflow-hidden">
 *     <LayerCascade className="absolute inset-0 -z-10" />
 *     ...content...
 *   </section>
 */
export interface LayerCascadeProps {
  /** Gradient colour at the top of the frame. Hex: #RGB, #RRGGBB or #RRGGBBAA (alpha ignored). */
  colorTop?: string;
  /** Gradient colour through the middle. */
  colorMid?: string;
  /** Gradient colour at the bottom. */
  colorBottom?: string;
  /** Colour behind the stack, which the deepest layers fade into. */
  background?: string;
  /** Animation speed multiplier. 0 freezes motion. Default 1. */
  speed?: number;
  /** Layers per second that sink down the stack (at speed 1). Default 0.12. */
  flow?: number;
  /** Number of layers behind the top rectangle (2–16). Default 12. */
  layers?: number;
  /** Gap between layers, as a fraction of the section height (0.005–0.15). Default 0.04. */
  spread?: number;
  /** Rotation added per layer, in degrees (-10–10). Default 0. */
  twist?: number;
  /** Brightness kept per layer going back (0.3–1). Lower = darker stack. Default 0.8. */
  falloff?: number;
  /**
   * The top shape's four corners, clockwise from the top left, as [x, y]
   * fractions of the section (0 = left / top, 1 = right / bottom). Values
   * slightly outside 0–1 push a corner past the edge. Default: a rounded
   * rectangle inset about 14% from the left, top and bottom and 19% from the right.
   */
  corners?: readonly (readonly [number, number])[];
  /** Corner rounding of the top shape, as a fraction of the section height. Back layers round off more. Default 0.06. */
  radius?: number;
  /** Soft shadow each layer casts on the one behind it (0–1). Default 0.3. */
  shadow?: number;
  /** Pause the animation. The last frame stays visible and the render loop goes idle. */
  paused?: boolean;
  /** Cap on devicePixelRatio for rendering resolution. Lower it for large sections. Default 1.5. */
  maxPixelRatio?: number;
  className?: string;
  style?: CSSProperties;
}

export const LAYER_CASCADE_DEFAULTS = {
  colorTop: "#00E5FF",
  colorMid: "#5200FF",
  colorBottom: "#1C00A3",
  background: "#000000",
  speed: 1.0,
  flow: 0.12,
  layers: 12,
  spread: 0.04,
  twist: 0,
  falloff: 0.8,
  corners: [
    [0.141, 0.139],
    [0.815, 0.147],
    [0.814, 0.828],
    [0.138, 0.828],
  ] as readonly (readonly [number, number])[],
  radius: 0.06,
  shadow: 0.3,
  paused: false,
  maxPixelRatio: 1.5,
};

// A single hidden tab frame after refocus would otherwise advance the
// animation by the whole hidden duration.
const MAX_FRAME_DT = 0.1;
const MAX_LAYERS = 16;

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
      console.warn(`LayerCascade: invalid color "${input}" — falling back to "${fallback}".`);
    }
    hex = fallback.replace(/^#/, "");
  }
  const v = parseInt(hex, 16);
  return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255];
}

/* ------------------------------------------------------------------ */
/* Shaders (single pass: layer stack, front to back)                   */
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
uniform int   uLayers;
uniform float uSpread;
uniform float uTwist;     // radians per layer
uniform float uFalloff;
uniform vec2  uV[4];     // top shape corners, inset by uRadius (section-height units)
uniform vec2  uPivot;    // centre of the top shape, the stack turns around it
uniform float uShadow;
uniform float uRadius;   // fraction of the section height
uniform vec3  uColorTop;
uniform vec3  uColorMid;
uniform vec3  uColorBottom;
uniform vec3  uBackground;

// Exact signed distance to the corner polygon (Inigo Quilez). Works for
// convex, concave and even self-crossing quads.
float sdQuad(vec2 p) {
  float d = dot(p - uV[0], p - uV[0]);
  float s = 1.0;
  for (int i = 0, j = 3; i < 4; j = i, i++) {
    vec2 e = uV[j] - uV[i];
    vec2 w = p - uV[i];
    vec2 b = w - e * clamp(dot(w, e) / max(dot(e, e), 1e-8), 0.0, 1.0);
    d = min(d, dot(b, b));
    bvec3 c = bvec3(p.y >= uV[i].y, p.y < uV[j].y, e.x * w.y > e.y * w.x);
    if (all(c) || all(not(c))) s *= -1.0;
  }
  return s * sqrt(d);
}

// Distance (section-height units) from p to the layer at depth d. d = 0 is
// the static top shape; larger d sits further back. Each layer is the top
// shape offset outward by d gaps (so gaps stay even and corners round off
// as it grows), turned by d twists around the shape's centre.
float layerDist(vec2 p, float d) {
  float a = uTwist * d;
  float ca = cos(a), sa = sin(a);
  vec2 q = mat2(ca, -sa, sa, ca) * (p - uPivot) + uPivot;
  return sdQuad(q) - uRadius - uSpread * d;
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
  // section-height units, y up, origin at the centre
  float cs = uResolution.y;
  vec2 p = (frag - 0.5 * uResolution) / cs;
  float px = 1.0 / cs;  // one pixel, for antialiasing

  // one gradient across the frame: top colour at the upper right, through
  // the middle colour to the bottom colour at the lower left
  vec2 ga = vec2(0.66, -0.02), gb = vec2(0.28, 1.05);
  float gt = clamp(dot(v - ga, gb - ga) / dot(gb - ga, gb - ga), 0.0, 1.0);
  vec3 grad = gt < 0.6
    ? mix(uColorTop, uColorMid, smoothstep(0.0, 0.6, gt))
    : mix(uColorMid, uColorBottom, smoothstep(0.6, 1.0, gt));

  float phase = fract(uTime * uFlow);
  float n = float(uLayers);
  vec3  col = vec3(0.0);
  float alpha = 0.0;
  float prevDist = 1e3;

  // front to back: k = 0 is the static top rectangle; every layer behind it
  // drifts back by phase, so a new one slides out from under the top one
  // (starting exactly at its size, hence hidden) and the deepest one melts
  // into the background.
  for (int k = 0; k <= ${MAX_LAYERS}; k++) {
    if (k > uLayers) break;
    float d = k == 0 ? 0.0 : float(k) - 1.0 + phase;
    float sd = layerDist(p, d);
    float cov = clamp(0.5 - sd / px, 0.0, 1.0);
    if (cov > 0.0) {
      float lum = pow(uFalloff, d);
      vec3 c = mix(uBackground, grad * lum, clamp(n - d, 0.0, 1.0));
      // soft shadow from the layer in front, strongest along its edge
      c *= 1.0 - uShadow * exp(-max(prevDist, 0.0) / 0.035);
      col += (1.0 - alpha) * cov * c;
      alpha += (1.0 - alpha) * cov;
      if (alpha > 0.999) break;
    }
    prevDist = sd;
  }
  col += (1.0 - alpha) * uBackground;
  col += (hash12(frag) - 0.5) / 255.0;  // dither the dark steps
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

/* ------------------------------------------------------------------ */
/* Corner geometry                                                     */
/* ------------------------------------------------------------------ */

// Converts the corner fractions to section-height units (y up, origin at
// the centre) and insets them by the rounding radius, so that the shader's
// "distance to the inset polygon minus radius" gives a shape whose straight
// edges sit exactly on the corners the user placed, with rounded corners.
function cornerGeometry(
  corners: readonly (readonly [number, number])[],
  aspect: number,
  radius: number,
): { verts: Float32Array; pivot: [number, number]; radius: number } {
  const src = corners.length === 4 ? corners : LAYER_CASCADE_DEFAULTS.corners;
  const pts = src.map(([x, y]) => [(x - 0.5) * aspect, 0.5 - y] as [number, number]);
  const pivot: [number, number] = [
    (pts[0][0] + pts[1][0] + pts[2][0] + pts[3][0]) / 4,
    (pts[0][1] + pts[1][1] + pts[2][1] + pts[3][1]) / 4,
  ];
  // Keep the rounding smaller than the shortest edge allows.
  let minEdge = Infinity;
  for (let i = 0; i < 4; i++) {
    const a = pts[i], b = pts[(i + 1) % 4];
    minEdge = Math.min(minEdge, Math.hypot(b[0] - a[0], b[1] - a[1]));
  }
  const r = Math.min(radius, minEdge * 0.35);
  // Signed area tells the winding, so "inward" is right either way.
  let area = 0;
  for (let i = 0; i < 4; i++) {
    const a = pts[i], b = pts[(i + 1) % 4];
    area += a[0] * b[1] - b[0] * a[1];
  }
  const sign = area >= 0 ? 1 : -1;
  const verts = new Float32Array(8);
  for (let i = 0; i < 4; i++) {
    const prev = pts[(i + 3) % 4], cur = pts[i], next = pts[(i + 1) % 4];
    // inward unit normals of the two edges meeting at this corner
    const n1 = inwardNormal(prev, cur, sign);
    const n2 = inwardNormal(cur, next, sign);
    // move along the bisector so both edges move in by r
    const bx = n1[0] + n2[0], by = n1[1] + n2[1];
    const dot = n1[0] * n2[0] + n1[1] * n2[1];
    const k = dot > -0.9 ? r / (1 + dot) : 0; // skip near-hairpin corners
    verts[i * 2] = cur[0] + bx * k;
    verts[i * 2 + 1] = cur[1] + by * k;
  }
  return { verts, pivot, radius: r };
}

function inwardNormal(a: [number, number], b: [number, number], sign: number): [number, number] {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  return [(-dy / len) * sign, (dx / len) * sign];
}

// Visual parameters the engine consumes; written by applyProps, read at
// render time.
interface EngineOpts {
  flow: number;
  layers: number;
  spread: number;
  twist: number;
  falloff: number;
  corners: readonly (readonly [number, number])[];
  radius: number;
  shadow: number;
  maxPixelRatio: number;
}

const UNIFORMS = [
  "uResolution",
  "uTime",
  "uFlow",
  "uLayers",
  "uSpread",
  "uTwist",
  "uFalloff",
  "uV",
  "uPivot",
  "uShadow",
  "uRadius",
  "uColorTop",
  "uColorMid",
  "uColorBottom",
  "uBackground",
] as const;

class LayerCascadeEngine {
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
  private colorMid: [number, number, number] = [0, 0, 0];
  private colorBottom: [number, number, number] = [0, 0, 0];
  private background: [number, number, number] = [0, 0, 0];
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

  setColors(topHex: string, midHex: string, bottomHex: string, bgHex: string) {
    const key = `${topHex}|${midHex}|${bottomHex}|${bgHex}`;
    if (key === this.colorKey) return;
    this.colorKey = key;
    const D = LAYER_CASCADE_DEFAULTS;
    this.colorTop = parseHexColor(topHex, D.colorTop);
    this.colorMid = parseHexColor(midHex, D.colorMid);
    this.colorBottom = parseHexColor(bottomHex, D.colorBottom);
    this.background = parseHexColor(bgHex, D.background);
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
    const layers = Math.round(Math.min(Math.max(o.layers, 2), MAX_LAYERS));

    gl.bindVertexArray(this.vao);
    gl.viewport(0, 0, this.w, this.h);
    gl.useProgram(this.prog);
    gl.uniform2f(this.loc.uResolution, this.w, this.h);
    gl.uniform1f(this.loc.uTime, timeSeconds);
    gl.uniform1f(this.loc.uFlow, o.flow);
    gl.uniform1i(this.loc.uLayers, layers);
    gl.uniform1f(this.loc.uSpread, o.spread);
    gl.uniform1f(this.loc.uTwist, (o.twist * Math.PI) / 180);
    gl.uniform1f(this.loc.uFalloff, Math.min(Math.max(o.falloff, 0.05), 1));
    const geo = cornerGeometry(o.corners, this.w / this.h, Math.max(o.radius, 0));
    gl.uniform2fv(this.loc.uV, geo.verts);
    gl.uniform2f(this.loc.uPivot, geo.pivot[0], geo.pivot[1]);
    gl.uniform1f(this.loc.uShadow, Math.min(Math.max(o.shadow, 0), 1));
    gl.uniform1f(this.loc.uRadius, geo.radius);
    gl.uniform3fv(this.loc.uColorTop, this.colorTop);
    gl.uniform3fv(this.loc.uColorMid, this.colorMid);
    gl.uniform3fv(this.loc.uColorBottom, this.colorBottom);
    gl.uniform3fv(this.loc.uBackground, this.background);
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

type ResolvedProps = Required<Omit<LayerCascadeProps, "className" | "style">>;

// The single choke point between props and the engine: colors funnel
// through setColors (which no-ops when unchanged), scalars are plain
// writes, and a pixel-ratio change re-derives the backing-store size.
function applyProps(engine: LayerCascadeEngine, p: ResolvedProps) {
  engine.setColors(p.colorTop, p.colorMid, p.colorBottom, p.background);
  engine.opts.flow = p.flow;
  engine.opts.layers = p.layers;
  engine.opts.spread = p.spread;
  engine.opts.twist = p.twist;
  engine.opts.falloff = p.falloff;
  engine.opts.corners = p.corners;
  engine.opts.radius = p.radius;
  engine.opts.shadow = p.shadow;
  if (engine.opts.maxPixelRatio !== p.maxPixelRatio) {
    engine.opts.maxPixelRatio = p.maxPixelRatio;
    engine.refreshSize();
  }
}

export function LayerCascade({
  colorTop = LAYER_CASCADE_DEFAULTS.colorTop,
  colorMid = LAYER_CASCADE_DEFAULTS.colorMid,
  colorBottom = LAYER_CASCADE_DEFAULTS.colorBottom,
  background = LAYER_CASCADE_DEFAULTS.background,
  speed = LAYER_CASCADE_DEFAULTS.speed,
  flow = LAYER_CASCADE_DEFAULTS.flow,
  layers = LAYER_CASCADE_DEFAULTS.layers,
  spread = LAYER_CASCADE_DEFAULTS.spread,
  twist = LAYER_CASCADE_DEFAULTS.twist,
  falloff = LAYER_CASCADE_DEFAULTS.falloff,
  corners = LAYER_CASCADE_DEFAULTS.corners,
  radius = LAYER_CASCADE_DEFAULTS.radius,
  shadow = LAYER_CASCADE_DEFAULTS.shadow,
  paused = LAYER_CASCADE_DEFAULTS.paused,
  maxPixelRatio = LAYER_CASCADE_DEFAULTS.maxPixelRatio,
  className,
  style,
}: LayerCascadeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<LayerCascadeEngine | null>(null);
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

  const cornersKey = corners.map((c) => c.join(",")).join(" ");

  // Declared before the mount effect so propsRef is populated on mount.
  useEffect(() => {
    propsRef.current = {
      colorTop,
      colorMid,
      colorBottom,
      background,
      speed,
      flow,
      layers,
      spread,
      twist,
      falloff,
      corners,
      radius,
      shadow,
      paused,
      maxPixelRatio,
    };
    const engine = engineRef.current;
    if (engine) {
      applyProps(engine, propsRef.current);
      dirtyRef.current = true;
      kickRef.current?.();
    }
    // `corners` is tracked through cornersKey (by value, not identity).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    colorTop,
    colorMid,
    colorBottom,
    background,
    speed,
    flow,
    layers,
    spread,
    twist,
    falloff,
    // compared by value, so an inline array literal doesn't re-apply every render
    cornersKey,
    radius,
    shadow,
    paused,
    maxPixelRatio,
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    cancelContextRelease(canvas);

    const createEngine = () => {
      const engine = new LayerCascadeEngine(canvas, {
        flow: propsRef.current.flow,
        layers: propsRef.current.layers,
        spread: propsRef.current.spread,
        twist: propsRef.current.twist,
        falloff: propsRef.current.falloff,
        corners: propsRef.current.corners,
        radius: propsRef.current.radius,
        shadow: propsRef.current.shadow,
        maxPixelRatio: propsRef.current.maxPixelRatio,
      });
      engineRef.current = engine;
      applyProps(engine, propsRef.current);
      return engine;
    };

    let engine: LayerCascadeEngine;
    try {
      engine = createEngine();
    } catch (e) {
      console.warn("LayerCascade: WebGL2 unavailable, rendering nothing.", e);
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
        console.warn("LayerCascade: could not restore the WebGL context.", e);
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

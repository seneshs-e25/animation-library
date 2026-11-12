"use client";

import { useEffect, useRef, type CSSProperties } from "react";

/**
 * Ribbon wave: a folded silk ribbon rendered as a real 3D mesh in WebGL2,
 * on a transparent canvas. After the Stripe homepage hero.
 *
 * How it's built:
 * - Geometry (once, on the CPU): a 400×400 plane, finely subdivided, folded
 *   in half like a sheet of paper: two layers a few units apart, joined by a
 *   tight half-cylinder. That fold is what you see as the ribbon turning back.
 * - Shape (vertex shader): three rotations whose angles fall off smoothly
 *   along the sheet (`expStep`), so the folded sheet curls and corkscrews
 *   progressively along its length, plus a gentle noise displacement. Then
 *   a model transform and an orthographic camera.
 * - Surface (fragment shader): colour from a soft, painterly 2D palette (made
 *   from the colour props), fibre streaks from high-frequency noise across
 *   the sheet, and shading from how stretched the surface is on screen
 *   (`dFdy(uv)`), so curls and folds catch a sheen without any lights.
 *   Film grain on top.
 * - Motion: almost none. One twist wobbles by ±0.1 rad and the sheet drifts
 *   slightly, on noise advancing about 0.04 units a second. It holds its
 *   shape and only breathes.
 *
 * Props change live without recreating the WebGL context. The loop idles
 * off screen, `prefers-reduced-motion` holds a still frame, and a lost context
 * is rebuilt when the browser restores it.
 *
 *   <section className="relative isolate overflow-hidden bg-white">
 *     <RibbonWave className="pointer-events-none absolute inset-0 z-[1]" />
 *     ...content...
 *   </section>
 */
export interface RibbonWaveProps {
  /** Palette colours, hex. 1: pale edge light, 2: violet, 3: pink, 4: orange, 5: warm highlight. */
  color1?: string;
  color2?: string;
  color3?: string;
  color4?: string;
  color5?: string;
  /** Optional palette image (any size, CORS-enabled) instead of the generated one. Sampled by position on the sheet. */
  paletteSrc?: string;
  /** Speed of the breathing motion. 1 is Stripe's pace (barely moving); 0 freezes it. Default 1. */
  speed?: number;
  /** Curl along the length (main twist), radians. Default -0.65. */
  twistX?: number;
  /** Twist across the width, radians. Default 0.41. */
  twistY?: number;
  /** Second curl along the length, radians. Default -0.58. */
  twistZ?: number;
  /** How quickly each twist fades along the sheet (higher = later, sharper). Defaults 3.63 / 0.7 / 3.95. */
  twistPowerX?: number;
  twistPowerY?: number;
  twistPowerZ?: number;
  /** Orientation of the folded sheet, in degrees. Defaults -25.76 / -6.74 / 107.4. */
  rotationX?: number;
  rotationY?: number;
  rotationZ?: number;
  /** Position of the sheet, in px at a 761px-tall section (it scales with the section). Defaults 593 / -302 (593 puts the ribbon where Stripe has it in a full-width section). */
  positionX?: number;
  positionY?: number;
  /** Overall size multiplier. Default 1. */
  scale?: number;
  /** Fibre streak strength multiplier (0 = smooth). Default 1. */
  fibres?: number;
  /** Sheen where the surface curls away. Default 1.98. */
  glow?: number;
  /** Colour saturation. Default 1. */
  saturation?: number;
  /** Film grain (0–2). Default 1.1. */
  grain?: number;
  /** Pause the animation. The last frame stays visible and the render loop goes idle. */
  paused?: boolean;
  /** Cap on devicePixelRatio for rendering resolution. Default 2. */
  maxPixelRatio?: number;
  className?: string;
  style?: CSSProperties;
}

export const RIBBON_WAVE_DEFAULTS = {
  color1: "#C9DAFF",
  color2: "#9A6BFF",
  color3: "#FF78C8",
  color4: "#FF9F1A",
  color5: "#FFD9A8",
  paletteSrc: "",
  speed: 1,
  twistX: -0.65,
  twistY: 0.41,
  twistZ: -0.58,
  twistPowerX: 3.63,
  twistPowerY: 0.7,
  twistPowerZ: 3.95,
  rotationX: -25.76,
  rotationY: -6.74,
  rotationZ: 107.4,
  positionX: 593,
  positionY: -302,
  scale: 1,
  fibres: 1,
  glow: 1.98,
  saturation: 1,
  grain: 1.1,
  paused: false,
  maxPixelRatio: 2,
} as const;

type ResolvedProps = {
  -readonly [K in keyof typeof RIBBON_WAVE_DEFAULTS]: (typeof RIBBON_WAVE_DEFAULTS)[K] extends string
    ? string
    : (typeof RIBBON_WAVE_DEFAULTS)[K] extends boolean
      ? boolean
      : number;
};

/** Section height the positions and sizes are designed at. */
const REF_HEIGHT = 761;
/** Base non-uniform scale of the sheet, before `scale`. */
const BASE_SCALE: [number, number, number] = [9, 8, 5];
/** Noise units per second at speed 1, and where the noise clock starts. */
const NOISE_PER_SECOND = 0.04;
const NOISE_START = 0.7;
// A single hidden tab frame after refocus would otherwise advance the
// animation by the whole hidden duration.
const MAX_FRAME_DT = 0.1;

/* ------------------------------------------------------------------ */
/* Geometry: a plane folded in half                                    */
/* ------------------------------------------------------------------ */

function foldedSheet(size = 400, segX = 128, segY = 256) {
  const half = size / 2;
  const cols = segX + 1;
  const rows = segY + 1;
  const positions = new Float32Array(cols * rows * 3);
  const uvs = new Float32Array(cols * rows * 2);
  const crease = 16; // half-length of the bend, in sheet units

  let pi = 0;
  let ui = 0;
  for (let r = 0; r < rows; r++) {
    const v = 1 - r / segY;
    const y = half - (r / segY) * size;
    for (let c = 0; c < cols; c++) {
      const u = c / segX;
      let x = u * size - half;
      // Gap between the two layers: 8 units, pinched to 4 along the middle
      // of the length so the layers part slightly at the ends.
      const gap = 4 - 2 * Math.pow(4 * v * (1 - v), 9.5);
      let z: number;
      if (x < -crease) {
        z = gap; // first layer, as is
      } else if (x <= crease) {
        // wrap around a half-cylinder of radius `gap`
        const a = (Math.PI * (x + crease)) / (2 * crease);
        z = Math.cos(a) * gap;
        x = Math.sin(a) * gap - crease;
      } else {
        z = -gap; // second layer, mirrored back under the first
        x = -x;
      }
      x += size / 4;
      // Stand the folded sheet up: −90° about X, then −90° about Y,
      // which maps (x, y, z) to (y, z, x).
      positions[pi++] = y;
      positions[pi++] = z;
      positions[pi++] = x;
      uvs[ui++] = u;
      uvs[ui++] = v;
    }
  }

  const indices = new Uint32Array(segX * segY * 6);
  let ii = 0;
  for (let r = 0; r < segY; r++) {
    for (let c = 0; c < segX; c++) {
      const a = c + cols * r;
      const b = c + cols * (r + 1);
      const d = c + 1 + cols * (r + 1);
      const e = c + 1 + cols * r;
      indices[ii++] = a;
      indices[ii++] = b;
      indices[ii++] = e;
      indices[ii++] = b;
      indices[ii++] = d;
      indices[ii++] = e;
    }
  }
  return { positions, uvs, indices };
}

/* ------------------------------------------------------------------ */
/* Palette: soft painterly blobs, u across the sheet, v along it        */
/* ------------------------------------------------------------------ */

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
      console.warn(`RibbonWave: invalid color "${input}" — falling back to "${fallback}".`);
    }
    hex = fallback.replace(/^#/, "");
  }
  const v = parseInt(hex, 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

// [u, v, radius, colour index]. The sheet folds at u = 0.5, so the left half
// is the top layer and the right half the layer folded under it.
const BLOBS: [number, number, number, number][] = [
  [0.02, 0.1, 0.32, 0],
  [0.24, 0.12, 0.3, 3],
  [0.12, 0.45, 0.28, 2],
  [0.3, 0.55, 0.26, 4],
  [0.08, 0.9, 0.3, 1],
  [0.4, 0.86, 0.28, 3],
  [0.42, 0.3, 0.22, 2],
  [0.62, 0.15, 0.3, 2],
  [0.72, 0.48, 0.24, 1],
  [0.88, 0.2, 0.3, 3],
  [0.6, 0.75, 0.3, 3],
  [0.9, 0.62, 0.26, 2],
  [0.96, 0.94, 0.3, 1],
  [0.98, 0.04, 0.2, 0],
];

function makePalette(colors: string[]) {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const d = RIBBON_WAVE_DEFAULTS;
  const fallbacks = [d.color1, d.color2, d.color3, d.color4, d.color5];
  const rgb = colors.map((c, i) => parseHexColor(c, fallbacks[i]));
  const css = (i: number, a: number) => `rgba(${rgb[i][0]},${rgb[i][1]},${rgb[i][2]},${a})`;

  if ("filter" in ctx) ctx.filter = "blur(14px)";
  ctx.fillStyle = css(2, 1);
  ctx.fillRect(-20, -20, size + 40, size + 40);
  for (const [u, v, r, ci] of BLOBS) {
    const x = u * size;
    const y = (1 - v) * size;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * size);
    g.addColorStop(0, css(ci, 1));
    g.addColorStop(0.55, css(ci, 0.75));
    g.addColorStop(1, css(ci, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  // A pale streak along the fold.
  const s = ctx.createLinearGradient(size * 0.44, 0, size * 0.56, 0);
  s.addColorStop(0, "rgba(255,244,230,0)");
  s.addColorStop(0.5, "rgba(255,244,230,0.55)");
  s.addColorStop(1, "rgba(255,244,230,0)");
  ctx.fillStyle = s;
  ctx.fillRect(0, 0, size, size);
  return canvas;
}

/* ------------------------------------------------------------------ */
/* Shaders                                                             */
/* ------------------------------------------------------------------ */

// 2D simplex noise (Ashima Arts / Stefan Gustavson, MIT).
const NOISE = `
vec3 permute3(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute3(permute3(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}`;

const VERT = `#version 300 es
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec2 aUv;

uniform float uTime;
uniform vec3  uTwist;      // x: along-length curl, y: across, z: second curl
uniform vec3  uTwistPow;
uniform mat4  uModel;
uniform vec2  uView;       // design px -> clip

out vec2 vUv;
${NOISE}

// 1 near x = 0, falling smoothly to 0; n sets how late and how sharply.
float expStep(float x, float n) { return exp2(-exp2(n) * pow(x, n)); }

vec3 rotateAxis(vec3 v, vec3 axis, float a) {
  axis = normalize(axis);
  float c = cos(a), s = sin(a);
  return v * c + cross(axis, v) * s + axis * dot(axis, v) * (1.0 - c);
}

void main() {
  vUv = aUv;
  vec3 p = aPos;

  // Gentle drift of the whole sheet.
  p.y += -7.8 * snoise(vec2(p.x * 0.005831 + uTime, p.z * 0.016 + uTime));

  // The curl: each rotation fades along the sheet, so the twist builds up
  // progressively instead of turning the sheet rigidly. Only the main curl
  // breathes (±0.1 rad).
  float curl = uTwist.x - 0.1 * snoise(vec2(aUv.y * 2.0, uTime));
  p = rotateAxis(p, vec3(0.5, 0.0, 0.5), uTwist.y * expStep(aUv.x, uTwistPow.y));
  p = rotateAxis(p, vec3(0.0, 0.5, 0.5), curl * expStep(aUv.y, uTwistPow.x));
  p = rotateAxis(p, vec3(0.5, 0.0, 0.5), uTwist.z * expStep(aUv.y, uTwistPow.z));

  vec4 w = uModel * vec4(p, 1.0);
  gl_Position = vec4(w.xy * uView, -w.z / 8000.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uPalette;
uniform float uResY;        // device px
uniform float uGlow;
uniform float uFibres;
uniform float uSaturation;
uniform float uGrain;
${NOISE}

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float parabola(float x, float k) { return pow(4.0 * x * (1.0 - x), k); }

void main() {
  // Sheen: how stretched the surface is vertically on screen. It changes
  // where the sheet curls away, which reads as light without any lights.
  float pdy = dFdy(vUv).y * uResY * uGlow;
  pdy = clamp(pdy * 0.5 + 0.5, 0.0, 1.0);
  pdy = pow(pdy, 0.806);
  pdy = clamp(smoothstep(0.0, 0.834, pdy), 0.0, 1.0);

  vec3 col = texture(uPalette, vUv).rgb;

  // Fibres: noise that's very fine across the sheet (u) and long along it
  // (v), so it streaks along the ribbon. Faded towards the long edges.
  float strength = 0.2, freq = 600.0, atten = 0.9, paraPow = 3.0;
  float edge = 1.0 - parabola(vUv.x, paraPow);
  float n0 = snoise(vec2(vUv.x * 0.1, vUv.y * 0.5));
  float n1 = snoise(vec2(vUv.x * (freq + freq * 0.5 * n0), vUv.y * 4.0 * n0)) * 0.5 + 0.5;
  col += n1 * strength * uFibres * (1.0 - col.b * atten) * pdy * edge;

  col = mix(vec3(dot(col, vec3(0.299, 0.587, 0.114))), col, uSaturation);

  col += (1.0 - pdy) * 0.25;
  col += (hash12(gl_FragCoord.xy) - 0.5) * 0.07 * uGrain;
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

const DEG = Math.PI / 180;

/** Column-major T · Rx · Ry · Rz · S (Euler order XYZ). */
function modelMatrix(p: ResolvedProps): Float32Array {
  const [rx, ry, rz] = [p.rotationX * DEG, p.rotationY * DEG, p.rotationZ * DEG];
  const a = Math.cos(rx), b = Math.sin(rx);
  const c = Math.cos(ry), d = Math.sin(ry);
  const e = Math.cos(rz), f = Math.sin(rz);
  const ae = a * e, af = a * f, be = b * e, bf = b * f;
  // Rotation rows for Euler order XYZ.
  const r = [
    [c * e, -c * f, d],
    [af + be * d, ae - bf * d, -b * c],
    [bf - ae * d, be + af * d, a * c],
  ];
  const s = [BASE_SCALE[0] * p.scale, BASE_SCALE[1] * p.scale, BASE_SCALE[2] * p.scale];
  const m = new Float32Array(16);
  for (let col = 0; col < 3; col++) {
    for (let row = 0; row < 3; row++) m[col * 4 + row] = r[row][col] * s[col];
  }
  m[12] = p.positionX;
  m[13] = p.positionY;
  m[14] = 0;
  m[15] = 1;
  return m;
}

const UNIFORMS = [
  "uTime",
  "uTwist",
  "uTwistPow",
  "uModel",
  "uView",
  "uPalette",
  "uResY",
  "uGlow",
  "uFibres",
  "uSaturation",
  "uGrain",
] as const;

class RibbonEngine {
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  private vao: WebGLVertexArrayObject;
  private buffers: WebGLBuffer[];
  private indexCount: number;
  private prog: WebGLProgram;
  private texture: WebGLTexture;
  private loc = new Map<string, WebGLUniformLocation | null>();
  private w = 0;
  private h = 0;
  private cssW = 0;
  private cssH = 0;
  private maxPixelRatio: number;
  private paletteKey = "";
  private disposed = false;
  onPaletteReady: (() => void) | null = null;
  props: ResolvedProps;

  constructor(canvas: HTMLCanvasElement, props: ResolvedProps) {
    this.canvas = canvas;
    this.props = props;
    this.maxPixelRatio = props.maxPixelRatio;
    const gl = canvas.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: true,
      depth: true,
      stencil: false,
    });
    if (!gl) throw new Error("WebGL2 not supported");
    this.gl = gl;

    const { positions, uvs, indices } = foldedSheet();
    this.indexCount = indices.length;
    this.vao = gl.createVertexArray()!;
    gl.bindVertexArray(this.vao);
    const pos = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, pos);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    const uv = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, uv);
    gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);
    const idx = gl.createBuffer()!;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idx);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    gl.bindVertexArray(null);
    this.buffers = [pos, uv, idx];

    this.prog = link(gl, VERT, FRAG);
    for (const name of UNIFORMS) this.loc.set(name, gl.getUniformLocation(this.prog, name));

    this.texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.setProps(props);
  }

  private uploadPalette(source: TexImageSource) {
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  }

  setProps(p: ResolvedProps) {
    this.props = p;
    const key = [p.color1, p.color2, p.color3, p.color4, p.color5, p.paletteSrc].join("|");
    if (key !== this.paletteKey) {
      this.paletteKey = key;
      this.uploadPalette(makePalette([p.color1, p.color2, p.color3, p.color4, p.color5]));
      if (p.paletteSrc) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          if (this.disposed || this.paletteKey !== key) return;
          this.uploadPalette(img);
          this.onPaletteReady?.();
        };
        img.onerror = () => console.warn(`RibbonWave: couldn't load paletteSrc "${p.paletteSrc}".`);
        img.src = p.paletteSrc;
      }
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

  renderFrame(noiseTime: number) {
    const gl = this.gl;
    if (this.w === 0 || this.h === 0 || this.cssH === 0) return;
    const p = this.props;
    const l = (n: (typeof UNIFORMS)[number]) => this.loc.get(n) ?? null;
    // Design px -> clip, scaled so the composition keeps its proportions to
    // the section height.
    const fit = this.cssH / REF_HEIGHT;

    gl.viewport(0, 0, this.w, this.h);
    gl.clearColor(0, 0, 0, 0);
    gl.clearDepth(1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);
    gl.disable(gl.CULL_FACE);

    gl.useProgram(this.prog);
    gl.bindVertexArray(this.vao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.uniform1i(l("uPalette"), 0);
    gl.uniform1f(l("uTime"), noiseTime);
    gl.uniform3f(l("uTwist"), p.twistX, p.twistY, p.twistZ);
    gl.uniform3f(l("uTwistPow"), p.twistPowerX, p.twistPowerY, p.twistPowerZ);
    gl.uniformMatrix4fv(l("uModel"), false, modelMatrix(p));
    gl.uniform2f(l("uView"), (2 * fit) / this.cssW, (2 * fit) / this.cssH);
    gl.uniform1f(l("uResY"), this.h);
    gl.uniform1f(l("uGlow"), p.glow);
    gl.uniform1f(l("uFibres"), p.fibres);
    gl.uniform1f(l("uSaturation"), p.saturation);
    gl.uniform1f(l("uGrain"), p.grain);
    gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_INT, 0);
    gl.bindVertexArray(null);
  }

  dispose() {
    this.disposed = true;
    const gl = this.gl;
    gl.deleteProgram(this.prog);
    gl.deleteVertexArray(this.vao);
    for (const b of this.buffers) gl.deleteBuffer(b);
    gl.deleteTexture(this.texture);
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

export function RibbonWave({ className, style, ...rest }: RibbonWaveProps) {
  const resolved = { ...RIBBON_WAVE_DEFAULTS } as ResolvedProps;
  for (const [k, v] of Object.entries(rest)) {
    if (v !== undefined) (resolved as Record<string, unknown>)[k] = v;
  }

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<RibbonEngine | null>(null);
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
    let time = NOISE_START;
    let onScreen = true;
    let lost = false;
    let engine: RibbonEngine;

    const frame = (now: number) => {
      const p = propsRef.current;
      const idle = p.paused || reducedMotionRef.current || !onScreen;
      if (last === null) last = now;
      const dt = Math.min((now - last) / 1000, MAX_FRAME_DT);
      last = now;

      if (!idle) time += dt * NOISE_PER_SECOND * p.speed;

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
      const next = new RibbonEngine(canvas, propsRef.current);
      next.onPaletteReady = () => {
        dirtyRef.current = true;
        kick();
      };
      engineRef.current = next;
      return next;
    };

    try {
      engine = createEngine();
    } catch (e) {
      console.warn("RibbonWave: WebGL2 unavailable, rendering nothing.", e);
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
        console.warn("RibbonWave: could not restore the WebGL context.", e);
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

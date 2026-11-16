"use client";

import * as React from "react";
import { Spline } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Point = [number, number];
type Curve = [number, number, number, number];

/** CSS keywords as the cubic-bezier curves the browser uses for them. */
const KEYWORDS: Record<string, Curve> = {
  linear: [0, 0, 1, 1],
  ease: [0.25, 0.1, 0.25, 1],
  "ease-in": [0.42, 0, 1, 1],
  "ease-out": [0, 0, 0.58, 1],
  "ease-in-out": [0.42, 0, 0.58, 1],
};

/** Reads a CSS timing function into its four control values, or null. */
export function parseEasing(value: string): Curve | null {
  const v = value.trim();
  if (KEYWORDS[v]) return KEYWORDS[v];
  const m = v.match(
    /^cubic-bezier\(\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^)]+)\)$/,
  );
  if (!m) return null;
  const n = m.slice(1).map(Number) as Curve;
  return n.every(Number.isFinite) ? n : null;
}

const round = (n: number) => Math.round(n * 100) / 100;
const toCss = (c: Curve) => `cubic-bezier(${c.map(round).join(", ")})`;

// Plot geometry. x runs 0–1; y runs Y_MIN–Y_MAX so overshooting curves fit.
const W = 240;
const H = 200;
const PAD = 12;
const Y_MIN = -0.3;
const Y_MAX = 1.3;
const sx = (x: number) => PAD + x * (W - PAD * 2);
const sy = (y: number) =>
  H - PAD - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * (H - PAD * 2);
const ux = (px: number) => (px - PAD) / (W - PAD * 2);
const uy = (py: number) =>
  Y_MIN + ((H - PAD - py) / (H - PAD * 2)) * (Y_MAX - Y_MIN);
const clamp = (n: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, n));

/**
 * The easing's `cubic-bezier(...)` value, with an "Edit curve" button that
 * opens a graph of the curve. Its two control points are draggable handles
 * (arrow keys nudge a focused handle by 0.01, Shift by 0.1). Every change is
 * reported as a `cubic-bezier(...)` string.
 */
export function BezierEditor({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  /** Names the handles for screen readers, e.g. "Easing in". */
  label: string;
}) {
  const curve = parseEasing(value);
  const svgRef = React.useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = React.useState<0 | 1 | null>(null);
  const [open, setOpen] = React.useState(false);
  const graphId = React.useId();

  if (!curve) return null;
  const [x1, y1, x2, y2] = curve;
  const handles: Point[] = [
    [x1, y1],
    [x2, y2],
  ];

  function move(index: 0 | 1, x: number, y: number) {
    const next = [...curve!] as Curve;
    next[index * 2] = round(clamp(x, 0, 1));
    next[index * 2 + 1] = round(clamp(y, -1, 2));
    onChange(toCss(next));
  }

  function fromPointer(index: 0 | 1, e: React.PointerEvent) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    move(
      index,
      ux(((e.clientX - rect.left) / rect.width) * W),
      uy(((e.clientY - rect.top) / rect.height) * H),
    );
  }

  function onKeyDown(index: 0 | 1, e: React.KeyboardEvent) {
    const step = e.shiftKey ? 0.1 : 0.01;
    const [x, y] = handles[index];
    const delta: Record<string, Point> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, step],
      ArrowDown: [0, -step],
    };
    const d = delta[e.key];
    if (!d) return;
    e.preventDefault();
    move(index, x + d[0], y + d[1]);
  }

  const path = `M ${sx(0)} ${sy(0)} C ${sx(x1)} ${sy(y1)}, ${sx(x2)} ${sy(y2)}, ${sx(1)} ${sy(1)}`;

  return (
    <div className="space-y-2">
      <p className="font-mono text-[11px] text-muted-foreground tabular-nums">
        {toCss(curve)}
      </p>
      <Button
        type="button"
        variant="ghost"
        className="-ml-2 text-muted-foreground hover:text-foreground"
        size="sm"
        aria-expanded={open}
        aria-controls={graphId}
        onClick={() => setOpen((v) => !v)}
      >
        <Spline />
        {open ? "Hide curve" : "Edit curve"}
      </Button>
      {open && (
        <svg
          id={graphId}
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full touch-none rounded-md border bg-muted/30 select-none"
          role="group"
          aria-label={`${label} curve`}
        >
          {/* The 0–1 box: start bottom-left, end top-right. */}
          <rect
            x={sx(0)}
            y={sy(1)}
            width={sx(1) - sx(0)}
            height={sy(0) - sy(1)}
            className="fill-none stroke-border"
            strokeDasharray="3 3"
          />
          <line
            x1={sx(0)}
            y1={sy(0)}
            x2={sx(1)}
            y2={sy(1)}
            className="stroke-border"
          />

          {/* Handle arms. */}
          <line
            x1={sx(0)}
            y1={sy(0)}
            x2={sx(x1)}
            y2={sy(y1)}
            className="stroke-muted-foreground"
            strokeWidth={1}
          />
          <line
            x1={sx(1)}
            y1={sy(1)}
            x2={sx(x2)}
            y2={sy(y2)}
            className="stroke-muted-foreground"
            strokeWidth={1}
          />

          <path
            d={path}
            className="fill-none stroke-foreground"
            strokeWidth={2}
            strokeLinecap="round"
          />
          <circle cx={sx(0)} cy={sy(0)} r={3} className="fill-foreground" />
          <circle cx={sx(1)} cy={sy(1)} r={3} className="fill-foreground" />

          {handles.map(([x, y], i) => {
            const index = i as 0 | 1;
            return (
              <circle
                key={i}
                cx={sx(x)}
                cy={sy(y)}
                r={7}
                tabIndex={0}
                role="slider"
                aria-label={`${label} handle ${i + 1}`}
                aria-valuetext={`x ${x}, y ${y}`}
                className={cn(
                  "cursor-grab fill-background stroke-foreground outline-none focus-visible:stroke-[3]",
                  dragging === index && "cursor-grabbing",
                )}
                strokeWidth={2}
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  setDragging(index);
                }}
                onPointerMove={(e) =>
                  dragging === index && fromPointer(index, e)
                }
                onPointerUp={() => setDragging(null)}
                onPointerCancel={() => setDragging(null)}
                onKeyDown={(e) => onKeyDown(index, e)}
              />
            );
          })}
        </svg>
      )}
    </div>
  );
}

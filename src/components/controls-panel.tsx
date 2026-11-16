"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BezierEditor, parseEasing } from "@/components/bezier-editor";
import type { Control, ControlValues } from "@/registry/types";

type Props = {
  controls: Control[];
  /** Shown at the top of the Motion group, e.g. why there's no easing. */
  motionNote?: string;
  values: ControlValues;
  onChange: (name: string, value: string | number | boolean) => void;
};

/** Easing dropdowns: named like one, or every option is a CSS timing function. */
const EASING_NAME = /^(ease|easing)$|Ease$|Easing$/;
function isEasingSelect(control: Control) {
  return (
    control.type === "select" &&
    (EASING_NAME.test(control.name) || control.options.every((o) => parseEasing(o.value) !== null))
  );
}
/** Props that change how something moves, beyond its duration and easing. */
const MOTION_NAME =
  /scale|speed|stagger|delay|interval|rise|travel|distance|overshoot|scrub|direction|lift|replay|loop|autoplay|paused|pause|slowOnHover|scrollBoost|slideOffset|offsetY|tabShift|hoverGrow|threshold|^(trigger|from|timeline|start|end|arriveAt|flow|cycle|wave)$/i;

type Kind = "timing" | "easing" | "other";

/** How a control sorts in the panel, or null when it isn't motion. */
function motionKind(control: Control): Kind | null {
  const isEasing = isEasingSelect(control);
  const isTiming = control.type === "number" && (control.unit === "ms" || control.unit === "s");
  const inferred = isEasing || isTiming || MOTION_NAME.test(control.name);
  if (!(control.motion ?? inferred)) return null;
  return isTiming ? "timing" : isEasing ? "easing" : "other";
}

/**
 * Pairs an easing with its duration by name: `duration` with `ease`/`easing`,
 * `cardDuration` with `cardEase`, `exitDuration` with `exitEase`, `fade` with
 * `fadeEase`.
 */
const stem = (name: string) => name.replace(/(Duration|Ease|Easing)$/, "").replace(/^(duration|ease|easing)$/, "");

/**
 * Motion comes first, since keeping motion data is the point of the library.
 * Each duration is followed by its own easing (duration in, easing in,
 * duration out, easing out); easings with no matching duration come after
 * the timings, then other motion props (scale, speed, direction...).
 */
function orderMotion(list: { control: Control; kind: Kind }[]) {
  const timings = list.filter((c) => c.kind !== "other");
  const easings = timings.filter((c) => c.kind === "easing");
  const used = new Set<Control>();
  const out: Control[] = [];
  for (const { control, kind } of timings) {
    if (kind !== "timing") continue;
    out.push(control);
    const pair = easings.find((e) => !used.has(e.control) && stem(e.control.name) === stem(control.name));
    if (pair) {
      used.add(pair.control);
      out.push(pair.control);
    }
  }
  out.push(...easings.filter((e) => !used.has(e.control)).map((e) => e.control));
  out.push(...list.filter((c) => c.kind === "other").map((c) => c.control));
  return out;
}

/** Splits controls into main motion, micro-interactions and everything else (copy, colours, sizes). */
function groupControls(controls: Control[]) {
  const sorted = controls.map((control) => ({ control, kind: motionKind(control) }));
  const motion = sorted.filter((c): c is { control: Control; kind: Kind } => c.kind !== null);
  return {
    main: orderMotion(motion.filter((c) => !c.control.secondary)),
    micro: orderMotion(motion.filter((c) => c.control.secondary)),
    rest: sorted.filter((c) => c.kind === null).map((c) => c.control),
  };
}

const groupLabel = "text-xs font-medium tracking-wide text-muted-foreground uppercase";

export function ControlsPanel({ controls, motionNote, values, onChange }: Props) {
  const { main, micro, rest } = groupControls(controls);
  const hasMotion = main.length > 0 || micro.length > 0 || !!motionNote;
  return (
    <div className="space-y-6">
      {hasMotion && (
        <div className="space-y-5">
          <p className={groupLabel}>Motion</p>
          {motionNote && <p className="text-xs leading-relaxed text-muted-foreground">{motionNote}</p>}
          <ControlList controls={main} values={values} onChange={onChange} />
          {micro.length > 0 && (
            <>
              <p className="pt-1 text-xs text-muted-foreground">Micro-interactions</p>
              <ControlList controls={micro} values={values} onChange={onChange} />
            </>
          )}
        </div>
      )}
      {hasMotion && rest.length > 0 && <hr className="border-border" />}
      {rest.length > 0 && (
        <div className="space-y-5">
          {hasMotion && <p className={groupLabel}>Style &amp; content</p>}
          <ControlList controls={rest} values={values} onChange={onChange} />
        </div>
      )}
    </div>
  );
}

function ControlList({ controls, values, onChange }: Omit<Props, "motionNote">) {
  return (
    <>
      {controls.map((control) => {
        const id = `control-${control.name}`;
        const value = values[control.name];

        switch (control.type) {
          case "number":
            return (
              <div key={control.name} className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor={id}>{control.label}</Label>
                  <span className="font-mono text-xs text-muted-foreground tabular-nums">
                    {value as number}
                    {control.unit}
                  </span>
                </div>
                <Slider
                  id={id}
                  min={control.min}
                  max={control.max}
                  step={control.step}
                  value={[value as number]}
                  onValueChange={([v]) => onChange(control.name, v)}
                />
              </div>
            );

          case "select": {
            const isEasing = isEasingSelect(control);
            // A curve dragged in the editor matches no preset; list it as Custom.
            const custom = !control.options.some((o) => o.value === value);
            return (
              <div key={control.name} className="space-y-2">
                <Label htmlFor={id}>{control.label}</Label>
                <Select value={value as string} onValueChange={(v) => onChange(control.name, v)}>
                  <SelectTrigger id={id} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {control.options.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                    {custom && <SelectItem value={value as string}>Custom</SelectItem>}
                  </SelectContent>
                </Select>
                {isEasing && (
                  <BezierEditor
                    label={control.label}
                    value={value as string}
                    onChange={(v) => onChange(control.name, v)}
                  />
                )}
              </div>
            );
          }

          case "color":
            return (
              <div key={control.name} className="space-y-2">
                <Label htmlFor={id}>{control.label}</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    aria-label={`${control.label} picker`}
                    value={value as string}
                    onChange={(e) => onChange(control.name, e.target.value)}
                    className="size-9 shrink-0 cursor-pointer rounded-md border bg-transparent p-1"
                  />
                  <Input
                    id={id}
                    value={value as string}
                    onChange={(e) => onChange(control.name, e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>
              </div>
            );

          case "boolean":
            return (
              <div key={control.name} className="flex items-center justify-between">
                <Label htmlFor={id}>{control.label}</Label>
                <Switch
                  id={id}
                  checked={value as boolean}
                  onCheckedChange={(v) => onChange(control.name, v)}
                />
              </div>
            );

          case "points":
            return (
              <div key={control.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{control.label}</Label>
                  {value !== control.default && (
                    <button
                      type="button"
                      className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                      onClick={() => onChange(control.name, control.default)}
                    >
                      Reset
                    </button>
                  )}
                </div>
                {control.hint && <p className="text-xs text-muted-foreground">{control.hint}</p>}
              </div>
            );

          case "text":
            return (
              <div key={control.name} className="space-y-2">
                <Label htmlFor={id}>{control.label}</Label>
                <Input id={id} value={value as string} onChange={(e) => onChange(control.name, e.target.value)} />
              </div>
            );
        }
      })}
    </>
  );
}

"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Control, ControlValues } from "@/registry/types";

type Props = {
  controls: Control[];
  values: ControlValues;
  onChange: (name: string, value: string | number | boolean) => void;
};

export function ControlsPanel({ controls, values, onChange }: Props) {
  return (
    <div className="space-y-5">
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

          case "select":
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
                  </SelectContent>
                </Select>
              </div>
            );

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

          case "text":
            return (
              <div key={control.name} className="space-y-2">
                <Label htmlFor={id}>{control.label}</Label>
                <Input id={id} value={value as string} onChange={(e) => onChange(control.name, e.target.value)} />
              </div>
            );
        }
      })}
    </div>
  );
}

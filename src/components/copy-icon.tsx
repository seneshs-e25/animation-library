import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Copy → check swap. Both icons stay mounted and cross-fade with a slight
 * scale + blur, so rapid clicks retarget instead of restarting.
 */
export function CopyIcon({ copied }: { copied: boolean }) {
  const base =
    "transition-[opacity,transform,filter] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none";
  return (
    <span className="relative grid size-4 place-items-center" aria-hidden>
      <Copy
        className={cn(
          "absolute size-4",
          base,
          copied ? "scale-75 opacity-0 blur-[2px]" : "scale-100 opacity-100 blur-0"
        )}
      />
      <Check
        className={cn(
          "absolute size-4",
          base,
          copied ? "scale-100 opacity-100 blur-0" : "scale-75 opacity-0 blur-[2px]"
        )}
      />
    </span>
  );
}

import { cn } from "@/lib/cn";
import type { CardStatus } from "@/lib/progress";

export default function StatusChip({ status }: { status?: CardStatus }) {
  if (!status) return null;

  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]",
        status === "known"
          ? "bg-success-soft text-success"
          : "bg-accent-soft text-accent",
      )}
    >
      {status === "known" ? "Learned" : "Review"}
    </span>
  );
}

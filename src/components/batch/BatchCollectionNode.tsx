import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Boxes, Loader2, CheckCircle2, XCircle, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { summarize, type Collection } from "@/lib/batch/collection";

/**
 * BatchCollectionNode — a single React Flow node that represents an entire
 * Collection<T> of internal variations. The canvas stays clean (one card,
 * one edge) no matter how many variants live inside.
 *
 * Data contract: `data.collection` is the Collection<{ videoUrl: string }>
 * for a batch run. `data.onOpen` opens the BatchDrawer for the full grid.
 */
export type BatchCollectionNodeData = {
  collection: Collection<{ videoUrl?: string }>;
  label?: string;
  onOpen?: () => void;
};

export function BatchCollectionNode({ data, selected }: NodeProps) {
  const d = data as unknown as BatchCollectionNodeData;
  const c = d.collection;
  const s = summarize(c);
  const running = s.queued + s.processing > 0;

  return (
    <div
      className={`aurora-glass rounded-2xl border border-white/10 bg-black/40 p-4 min-w-[240px] transition-shadow ${
        selected ? "shadow-[0_0_0_2px_hsl(var(--primary))]" : ""
      }`}
    >
      <Handle type="target" position={Position.Left} className="!bg-primary/60" />
      <div className="flex items-center gap-2">
        <div className="rounded-lg bg-primary/15 p-2">
          <Boxes className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-foreground truncate">
            {d.label ?? "Batch Variations"}
          </div>
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Collection · {s.total} variants
          </div>
        </div>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full bg-primary transition-[width] duration-500"
          style={{ width: `${Math.round(s.progress * 100)}%` }}
        />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
        {running && (
          <Badge variant="secondary" className="gap-1">
            <Loader2 className="h-3 w-3 animate-spin" /> {s.processing + s.queued} running
          </Badge>
        )}
        {s.done > 0 && (
          <Badge variant="secondary" className="gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" /> {s.done} done
          </Badge>
        )}
        {s.failed > 0 && (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" /> {s.failed} failed
          </Badge>
        )}
      </div>

      <Button
        size="sm"
        variant="outline"
        className="mt-3 w-full"
        onClick={(e) => {
          e.stopPropagation();
          d.onOpen?.();
        }}
      >
        <Play className="mr-1.5 h-3 w-3" />
        View {s.total} variants
      </Button>

      <Handle type="source" position={Position.Right} className="!bg-primary/60" />
    </div>
  );
}

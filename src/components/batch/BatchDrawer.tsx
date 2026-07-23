import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, Download } from "lucide-react";
import { summarize, type Collection } from "@/lib/batch/collection";
import { findBlueprint } from "@/lib/batch/style-blueprints";

/**
 * BatchDrawer — expands a Collection<T> into a scrollable grid without
 * putting each variant on the canvas. Preview, download, and retry live here.
 */
export function BatchDrawer({
  open,
  onClose,
  collection,
  onRetry,
}: {
  open: boolean;
  onClose: () => void;
  collection: Collection<{ videoUrl?: string; blueprintKey?: string }>;
  onRetry?: (index: number) => void;
}) {
  const s = summarize(collection);
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Batch variations · {collection.variants.length}</DialogTitle>
        </DialogHeader>

        <div className="mb-3 flex flex-wrap gap-2 text-xs">
          <Badge variant="secondary">Total {s.total}</Badge>
          {s.done > 0 && (
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-400" /> {s.done} done
            </Badge>
          )}
          {(s.queued + s.processing) > 0 && (
            <Badge variant="secondary" className="gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> {s.queued + s.processing} running
            </Badge>
          )}
          {s.failed > 0 && (
            <Badge variant="destructive" className="gap-1">
              <XCircle className="h-3 w-3" /> {s.failed} failed
            </Badge>
          )}
        </div>

        <div className="grid max-h-[65vh] grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3 md:grid-cols-4">
          {collection.variants.map((v) => {
            const bp = v.data?.blueprintKey ? findBlueprint(v.data.blueprintKey) : undefined;
            const url = v.data?.videoUrl;
            return (
              <div
                key={v.index}
                className="aurora-glass rounded-xl border border-white/10 bg-black/40 p-2"
              >
                <div className="relative aspect-[9/16] overflow-hidden rounded-lg bg-black/60">
                  {url ? (
                    <video
                      src={url}
                      className="h-full w-full object-cover"
                      controls
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[11px] text-muted-foreground">
                      {v.status === "processing" || v.status === "queued" ? (
                        <span className="flex items-center gap-1.5">
                          <Loader2 className="h-3 w-3 animate-spin" /> {v.status}
                        </span>
                      ) : v.status === "failed" ? (
                        <span className="flex items-center gap-1.5 text-destructive">
                          <XCircle className="h-3 w-3" /> failed
                        </span>
                      ) : (
                        <span>pending</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="mt-1.5 truncate text-[11px] font-medium text-foreground">
                  {bp?.label ?? v.label}
                </div>
                <div className="mt-1 flex items-center justify-between gap-1">
                  {url ? (
                    <a href={url} download className="text-[11px] text-muted-foreground hover:text-foreground">
                      <Download className="inline h-3 w-3" /> save
                    </a>
                  ) : (
                    <span />
                  )}
                  {v.status === "failed" && onRetry && (
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px]" onClick={() => onRetry(v.index)}>
                      Retry
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

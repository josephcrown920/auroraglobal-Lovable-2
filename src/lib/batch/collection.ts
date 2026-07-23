// Collection<T> — the primitive that lets a single canvas node represent N
// internal variations. Downstream nodes (preview, gallery, export) treat a
// Collection<T> as one edge, even though the underlying array grows as jobs
// complete. This is what keeps a "generate 20 variants" workflow from
// exploding into 20 tangled nodes on the canvas.

export type VariantStatus = "queued" | "processing" | "done" | "failed";

export interface Variant<T> {
  index: number;
  status: VariantStatus;
  label: string;
  jobId?: string | null;
  generationId?: string | null;
  error?: string | null;
  data?: T | null;
}

export interface Collection<T> {
  id: string;
  kind: "batch_variations";
  createdAt: string;
  sourceVideoUrl: string;
  variants: Variant<T>[];
}

export interface CollectionSummary {
  total: number;
  queued: number;
  processing: number;
  done: number;
  failed: number;
  progress: number; // 0..1
}

export function summarize<T>(c: Collection<T>): CollectionSummary {
  const total = c.variants.length || 1;
  let queued = 0, processing = 0, done = 0, failed = 0;
  for (const v of c.variants) {
    if (v.status === "queued") queued++;
    else if (v.status === "processing") processing++;
    else if (v.status === "done") done++;
    else if (v.status === "failed") failed++;
  }
  return {
    total: c.variants.length,
    queued,
    processing,
    done,
    failed,
    progress: (done + failed) / total,
  };
}

/** Merge a status update for one variant without mutating the input. */
export function updateVariant<T>(
  c: Collection<T>,
  index: number,
  patch: Partial<Variant<T>>,
): Collection<T> {
  return {
    ...c,
    variants: c.variants.map((v, i) => (i === index ? { ...v, ...patch } : v)),
  };
}

/**
 * Downstream fan-out helper: apply the same transform function to every
 * `done` variant in the collection, ignoring pending / failed ones. Keeps
 * the collection shape so the canvas edge stays a single line.
 */
export function mapDone<T, U>(
  c: Collection<T>,
  fn: (data: T, v: Variant<T>) => U,
): Collection<U> {
  return {
    ...c,
    variants: c.variants.map((v) => ({
      ...v,
      data: v.status === "done" && v.data ? fn(v.data, v) : null,
    })) as unknown as Variant<U>[],
  };
}

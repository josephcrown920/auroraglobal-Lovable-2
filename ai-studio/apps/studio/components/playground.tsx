export function Playground() {
  return (
    <section className="space-y-4">
      <div className="glass rounded-xl p-4">
        <h2 className="text-lg font-semibold">Live Preview</h2>
        <div className="mt-3 flex h-56 items-center justify-center rounded-lg border border-white/10">
          Generated Image / Video
        </div>
      </div>
      <div className="glass rounded-xl p-4">
        <label className="mb-2 block text-sm">Prompt</label>
        <textarea
          className="w-full rounded-lg bg-black/30 p-3"
          rows={4}
          placeholder="Describe your generation"
        />
        <label className="mb-2 mt-3 block text-sm">Negative Prompt</label>
        <input className="w-full rounded-lg bg-black/30 p-3" placeholder="What to avoid" />
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <input type="file" className="rounded-lg border border-dashed border-white/20 p-2" />
          <input type="file" className="rounded-lg border border-dashed border-white/20 p-2" />
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          {[
            "Generate",
            "Regenerate",
            "Stop",
            "Download",
            "Copy Prompt",
            "Compare",
            "Fullscreen",
            "Split Screen",
            "History",
            "Timer",
            "Logs",
          ].map((action) => (
            <button key={action} className="rounded-lg bg-primary/80 px-3 py-2 hover:bg-primary">
              {action}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

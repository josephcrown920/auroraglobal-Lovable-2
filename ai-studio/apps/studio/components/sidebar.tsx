const items = [
  "Dashboard",
  "Images",
  "Videos",
  "Lip Sync",
  "Motion Control",
  "Prompt Library",
  "References",
  "AI Providers",
  "Settings",
];

export function Sidebar() {
  return (
    <aside className="glass w-full rounded-xl p-4 md:w-64">
      <ul className="space-y-2 text-sm">
        {items.map((item) => (
          <li key={item} className="rounded-lg px-3 py-2 hover:bg-white/10">
            {item}
          </li>
        ))}
      </ul>
    </aside>
  );
}

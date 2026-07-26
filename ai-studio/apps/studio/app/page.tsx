import { Sidebar } from "@/components/sidebar";
import { Playground } from "@/components/playground";

export default function HomePage() {
  return (
    <main className="mx-auto grid max-w-7xl gap-4 md:grid-cols-[260px_1fr]">
      <Sidebar />
      <Playground />
    </main>
  );
}

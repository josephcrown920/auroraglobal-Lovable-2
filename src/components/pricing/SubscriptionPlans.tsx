import { SUBSCRIPTION_PLANS, dollarsPerAura, type SubscriptionPlan } from "@/lib/subscription-plans";
import { Check, Sparkles } from "lucide-react";

export function SubscriptionPlans({ onSelect }: { onSelect?: (plan: SubscriptionPlan) => void }) {
  return (
    <section className="w-full py-12">
      <div className="text-center mb-10">
        <p className="text-xs uppercase tracking-[0.2em] text-primary/80 mb-2">Subscribe</p>
        <h2 className="text-3xl md:text-4xl font-serif italic">Pick your plan</h2>
        <p className="text-sm text-white/60 mt-2">
          Monthly Aura buckets. Every feature stacks — you only pay for what you generate.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto px-4">
        {SUBSCRIPTION_PLANS.map((plan) => {
          const dpa = dollarsPerAura(plan);
          return (
            <div
              key={plan.id}
              className={`aurora-glass rounded-2xl p-5 flex flex-col ${
                plan.featured ? "ring-2 ring-primary shadow-[0_0_40px_-10px] shadow-primary/40" : ""
              }`}
            >
              {plan.featured && (
                <div className="inline-flex items-center gap-1 text-xs uppercase tracking-widest text-primary mb-2">
                  <Sparkles className="size-3" /> Recommended
                </div>
              )}
              <h3 className="text-xl font-semibold">{plan.name}</h3>
              <p className="text-xs text-white/50 mt-0.5">{plan.tagline}</p>
              <div className="mt-4 mb-3">
                <span className="text-4xl font-bold">${plan.monthlyUsd}</span>
                <span className="text-white/50 text-sm">/mo</span>
              </div>
              <div className="text-sm text-white/80 mb-1">
                {plan.monthlyAura.toLocaleString()} Aura / month
              </div>
              {dpa > 0 && (
                <div className="text-[11px] text-white/40 mb-4">
                  ~${dpa.toFixed(4)} per Aura
                </div>
              )}
              <ul className="space-y-1.5 text-sm text-white/70 flex-1">
                {plan.perks.map((p) => (
                  <li key={p} className="flex gap-2">
                    <Check className="size-4 text-primary shrink-0 mt-0.5" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-[11px] uppercase tracking-widest text-white/40 mb-1.5">
                  Unlocks
                </p>
                <ul className="text-xs text-white/60 space-y-0.5">
                  {plan.unlocks.map((u) => (
                    <li key={u}>· {u}</li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => onSelect?.(plan)}
                className={`mt-5 w-full py-2.5 rounded-xl text-sm font-medium transition ${
                  plan.featured
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-white/10 hover:bg-white/20 text-white"
                }`}
              >
                {plan.id === "free" ? "Start free" : `Choose ${plan.name}`}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

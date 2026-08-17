import { AppShell } from "@/components/app-shell";

export default function ShopPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-4xl">
        <p className="eyebrow">Training equipment</p>

        <h1 className="page-title mt-1">
          Shop
        </h1>

        <p className="mt-3 text-sm text-white/60">
          Equipment and training essentials for your workouts.
        </p>

        <section className="card mt-7">
          <p className="font-[Space_Grotesk] text-xl font-bold">
            Coming soon
          </p>

          <p className="mt-2 text-sm text-white/60">
            Personalized equipment recommendations based on
            your workout plan and available equipment will appear
            here.
          </p>
        </section>
      </div>
    </AppShell>
  );
}

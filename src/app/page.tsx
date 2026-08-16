"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RootPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function route() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // No auth flow built yet in this scaffold — wire up
        // supabase.auth.signInWithOtp / signInWithPassword here.
        router.replace("/onboarding");
        return;
      }

      const { data: screening } = await supabase
        .from("readiness_screening")
        .select("cleared")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // The gate: no cleared screening on file → onboarding, not home.
      if (!screening || !screening.cleared) {
        router.replace("/onboarding");
      } else {
        router.replace("/home");
      }
      setChecking(false);
    }
    route();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen text-sm text-white/50">
      {checking ? "Loading…" : null}
    </div>
  );
}

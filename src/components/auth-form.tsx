"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "signup" | "reset";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [recoverySession, setRecoverySession] = useState(false);
  const next = params.get("next")?.startsWith("/") ? params.get("next")! : "/";

  useEffect(() => {
    if (mode === "reset") createClient().auth.getUser().then(({ data }) => setRecoverySession(Boolean(data.user)));
  }, [mode]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError(null); setMessage(null);
    const supabase = createClient();
    if (mode === "login") {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) setError(authError.message); else router.replace(next);
    } else if (mode === "signup") {
      if (name.trim().length < 1 || name.trim().length > 80) setError("Enter a name between 1 and 80 characters.");
      else {
        const { data, error: authError } = await supabase.auth.signUp({
          email, password, options: { data: { name: name.trim() }, emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (authError) setError(authError.message);
        else if (!data.session) setMessage("Check your email to confirm your account, then sign in.");
        else router.replace("/");
      }
    } else if (recoverySession) {
      const { error: authError } = await supabase.auth.updateUser({ password });
      if (authError) setError(authError.message); else { setMessage("Password updated. You can continue."); router.replace("/"); }
    } else {
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback?next=/reset-password` });
      if (authError) setError(authError.message); else setMessage("If an account exists, a password-reset email has been sent.");
    }
    setLoading(false);
  }

  const title = mode === "login" ? "Welcome back" : mode === "signup" ? "Create your account" : recoverySession ? "Choose a new password" : "Reset your password";
  return <main className="max-w-sm mx-auto px-6 pt-16 pb-10"><h1 className="text-2xl font-bold mb-2">{title}</h1>
    <p className="text-sm text-white/50 mb-6">{mode === "login" ? "Sign in to continue your training setup." : mode === "signup" ? "Start with a secure account." : recoverySession ? "Use at least eight characters." : "We’ll send a secure reset link if this email has an account."}</p>
    <form onSubmit={submit} className="space-y-4">
      {mode === "signup" && <label className="block text-sm">Name<input required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 p-3" /></label>}
      {!recoverySession && <label className="block text-sm">Email<input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 p-3" /></label>}
      {(mode !== "reset" || recoverySession) && <label className="block text-sm">Password<input required minLength={8} type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-xl bg-white/5 border border-white/10 p-3" /></label>}
      {error && <p role="alert" className="text-sm text-stop">{error}</p>}{message && <p role="status" className="text-sm text-safe">{message}</p>}
      <button disabled={loading} className="w-full py-3 rounded-xl bg-accent font-semibold disabled:bg-white/10">{loading ? "Please wait…" : mode === "login" ? "Sign in" : mode === "signup" ? "Create account" : recoverySession ? "Update password" : "Send reset link"}</button>
    </form>
    <p className="mt-5 text-sm text-white/60">{mode === "login" ? <>Need an account? <Link className="text-accent" href="/signup">Sign up</Link><br /><Link className="text-accent" href="/reset-password">Forgot password?</Link></> : <><Link className="text-accent" href="/login">Back to sign in</Link></>}</p>
  </main>;
}

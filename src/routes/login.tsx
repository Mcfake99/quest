import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient, authEnabled, GROK_PROVIDERS, signIn } from "@/lib/auth/client";
import { emailAndPasswordEnabled } from "@/lib/auth/email-password";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const { user, isPending } = useCurrentUserState();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (isPending) {
    return (
      <main className="flex min-h-dvh items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="h-3 w-24 animate-pulse rounded bg-raised" />
          <div className="mt-4 h-10 w-48 animate-pulse rounded bg-raised" />
          <div className="mt-4 h-16 w-full animate-pulse rounded bg-raised" />
        </div>
      </main>
    );
  }

  if (user) {
    return <Navigate to="/" />;
  }

  async function onProvider(providerId: string) {
    setError(null);
    setBusy(true);
    try {
      await signIn(providerId, { callbackURL: "/", errorCallbackURL: "/login" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
      setBusy(false);
    }
  }

  async function onEmail(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "up") {
        const { error: signUpError } = await authClient.signUp.email({
          email: email.trim(),
          password,
          name: name.trim().slice(0, 24) || email.trim().split("@")[0] || "Cadet",
        });
        if (signUpError) throw new Error(signUpError.message ?? "Could not create account.");
      } else {
        const { error: signInError } = await authClient.signIn.email({
          email: email.trim(),
          password,
        });
        if (signInError) throw new Error(signInError.message ?? "Could not sign in.");
      }
      await authClient.getSession();
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-6 py-12">
      <div className="stagger-in w-full max-w-sm">
        <p className="text-xs uppercase tracking-widest text-muted">Your hall</p>
        <h1 className="mt-3 font-display text-4xl tracking-tight">Sign in</h1>
        <p className="mt-3 text-sm text-muted">
          Marks, streaks, mastery and kits stay on your account, so you can pick up on any device.
        </p>

        {!authEnabled ? (
          <p className="mt-8 text-sm text-muted">Sign-in is disabled.</p>
        ) : (
          <>
            <div className="mt-8 flex flex-col gap-2">
              {GROK_PROVIDERS.map((provider) => (
                <Button
                  key={provider.providerId}
                  type="button"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => void onProvider(provider.providerId)}
                >
                  Continue with {provider.label}
                </Button>
              ))}
            </div>

            {emailAndPasswordEnabled ? (
              <>
                <p className="mt-8 text-center text-xs uppercase tracking-widest text-subtle">or email</p>
                <form onSubmit={(e) => void onEmail(e)} className="mt-4 flex flex-col gap-3">
                  {mode === "up" ? (
                    <>
                      <label className="text-sm text-muted" htmlFor="hall-name">
                        What should we call you?
                      </label>
                      <Input
                        id="hall-name"
                        autoComplete="nickname"
                        placeholder="Your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={24}
                      />
                    </>
                  ) : null}
                  <label className="text-sm text-muted" htmlFor="hall-email">
                    Email
                  </label>
                  <Input
                    id="hall-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <label className="text-sm text-muted" htmlFor="hall-password">
                    Password
                  </label>
                  <Input
                    id="hall-password"
                    type="password"
                    autoComplete={mode === "up" ? "new-password" : "current-password"}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  {error ? <p className="text-sm text-danger">{error}</p> : null}
                  <Button type="submit" disabled={busy}>
                    {busy ? "Please wait…" : mode === "up" ? "Create account" : "Sign in"}
                  </Button>
                </form>
                <button
                  type="button"
                  className="mt-4 text-sm text-muted underline-offset-4 hover:text-fg hover:underline"
                  onClick={() => {
                    setMode(mode === "in" ? "up" : "in");
                    setError(null);
                  }}
                >
                  {mode === "in" ? "Need an account? Create one" : "Already have an account? Sign in"}
                </button>
              </>
            ) : error ? (
              <p className="mt-4 text-sm text-danger">{error}</p>
            ) : null}
          </>
        )}

        <p className="mt-10 text-sm text-muted">
          <Link to="/" className="underline-offset-4 hover:text-fg hover:underline">
            Play without an account
          </Link>
          <span className="text-subtle"> — progress stays on this device only.</span>
        </p>
      </div>
    </main>
  );
}

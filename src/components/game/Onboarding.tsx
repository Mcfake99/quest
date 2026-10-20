import { Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { unlockAudio } from "@/lib/game/audio";
import { useGameStore } from "@/lib/game/store";

export function Onboarding() {
  const onboard = useGameStore((s) => s.onboard);
  const [name, setName] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    onboard(name);
    unlockAudio();
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-6 py-12">
      <div className="stagger-in w-full max-w-lg">
        <p className="text-xs uppercase tracking-widest text-muted">GCSE hall</p>
        <h1 className="mt-3 font-display text-4xl tracking-tight md:text-5xl">QuestForge</h1>
        <p className="mt-4 max-w-md text-muted">
          Daily quests, streaks and marks for Computer Science, Business, History, Spanish,
          English, triple science and Maths.
        </p>
        <form onSubmit={submit} className="mt-10 flex flex-col gap-4">
          <label className="text-sm text-muted" htmlFor="cadet-name">
            What should we call you?
          </label>
          <Input
            id="cadet-name"
            autoComplete="nickname"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={24}
          />
          <Button type="submit" size="lg" className="w-full sm:w-auto">
            Enter the hall
          </Button>
        </form>
        <p className="mt-8 text-sm text-muted">
          Already have an account?{" "}
          <Link to="/login" className="text-fg underline-offset-4 hover:underline">
            Sign in to restore your hall
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

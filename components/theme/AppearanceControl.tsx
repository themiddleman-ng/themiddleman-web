"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import { MoonIcon } from "@phosphor-icons/react/dist/csr/Moon";
import { SunIcon } from "@phosphor-icons/react/dist/csr/Sun";
import { applyAppearance, readAppearanceChoice, resolveTheme, type AppearanceChoice, type ResolvedTheme } from "@/lib/theme/appearance";

function useAppearance() {
  const [choice, setChoice] = useState<AppearanceChoice>("system");
  const [theme, setTheme] = useState<ResolvedTheme>("dark");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => {
      const next = readAppearanceChoice();
      setChoice(next);
      setTheme(resolveTheme(next));
    };
    sync();
    setReady(true);
    const media = window.matchMedia("(prefers-color-scheme: light)");
    window.addEventListener("mm-appearance", sync);
    media.addEventListener("change", sync);
    return () => {
      window.removeEventListener("mm-appearance", sync);
      media.removeEventListener("change", sync);
    };
  }, []);

  return { choice, theme, ready, setChoice: (next: AppearanceChoice) => { applyAppearance(next); setChoice(next); setTheme(resolveTheme(next)); } };
}

export function AppearanceToggle() {
  const { theme, ready, setChoice } = useAppearance();
  if (!ready) return <span className="inline-block h-11 w-11" aria-hidden="true" />;
  const next = theme === "dark" ? "light" : "dark";
  const Icon = theme === "dark" ? SunIcon : MoonIcon;
  return (
    <button
      type="button"
      onClick={() => setChoice(next)}
      aria-label={theme === "dark" ? "Switch to light appearance" : "Switch to dark appearance"}
      className="grid h-11 w-11 place-items-center rounded-full border border-line bg-paper text-bone hover:bg-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
    >
      <Icon size={18} aria-hidden="true" />
    </button>
  );
}

export function AppearanceChoices() {
  const { choice, ready, setChoice } = useAppearance();
  const options: Array<{ value: AppearanceChoice; label: string }> = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "system", label: "Match this device" },
  ];
  function move(event: KeyboardEvent<HTMLDivElement>, current: AppearanceChoice) {
    const order: AppearanceChoice[] = ["light", "dark", "system"];
    const index = order.indexOf(current);
    const nextIndex = event.key === "ArrowRight" || event.key === "ArrowDown"
      ? (index + 1) % order.length
      : event.key === "ArrowLeft" || event.key === "ArrowUp"
        ? (index - 1 + order.length) % order.length
        : -1;
    if (nextIndex < 0) return;
    event.preventDefault();
    const next = order[nextIndex];
    setChoice(next);
    event.currentTarget.querySelector<HTMLButtonElement>(`[data-appearance="${next}"]`)?.focus();
  }

  return (
    <div role="radiogroup" aria-label="Appearance" className="flex flex-wrap gap-2" onKeyDown={(event) => move(event, choice)}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          data-appearance={option.value}
          aria-checked={ready && choice === option.value}
          tabIndex={ready && choice === option.value ? 0 : -1}
          onClick={() => setChoice(option.value)}
          className={`inline-flex min-h-11 items-center rounded-xl border px-4 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${ready && choice === option.value ? "border-ember bg-ember-cta text-on-ember" : "border-line bg-paper text-bone"}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Stage = "hidden" | "choice" | "tour";
type ExperienceChoice = "new" | "veteran";
type TourStep = {
  target: string;
  title: string;
  text: string;
};
type PreferenceRow = {
  experience_choice: ExperienceChoice;
  walkthrough_status: "in_progress" | "completed" | "skipped";
  current_step: number;
};

const TOUR_STEPS: TourStep[] = [
  {
    target: "marketplace",
    title: "Browse the marketplace",
    text: "Search products, compare listing details, and find something useful for your next project.",
  },
  {
    target: "orders",
    title: "Keep an eye on your orders",
    text: "Your order page shows what you bought and the latest delivery or review step.",
  },
  {
    target: "messages",
    title: "Talk about the product here",
    text: "Use Middleman messages to ask the creator a question and keep the conversation with your order.",
  },
  {
    target: "profile",
    title: "Make this account yours",
    text: "Update your account here. You can buy and sell from the same account whenever you are ready.",
  },
];

function visibleTarget(name: string): HTMLElement | null {
  const candidates = Array.from(document.querySelectorAll<HTMLElement>('[data-onboarding-target="' + name + '"]'));
  return candidates.find((candidate) => {
    const rect = candidate.getBoundingClientRect();
    const style = window.getComputedStyle(candidate);
    return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
  }) ?? null;
}

function saveTargetStyle(element: HTMLElement) {
  return {
    position: element.style.position,
    zIndex: element.style.zIndex,
    boxShadow: element.style.boxShadow,
    borderRadius: element.style.borderRadius,
    outline: element.style.outline,
    outlineOffset: element.style.outlineOffset,
  };
}

export default function FirstRunExperience() {
  const [stage, setStage] = useState<Stage>("hidden");
  const [userId, setUserId] = useState<string | null>(null);
  const [tourIndex, setTourIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const targetRef = useRef<HTMLElement | null>(null);
  const styleRef = useRef<ReturnType<typeof saveTargetStyle> | null>(null);
  const restoreTarget = useCallback(() => {
    if (targetRef.current && styleRef.current) {
      const element = targetRef.current;
      const previous = styleRef.current;
      element.style.position = previous.position;
      element.style.zIndex = previous.zIndex;
      element.style.boxShadow = previous.boxShadow;
      element.style.borderRadius = previous.borderRadius;
      element.style.outline = previous.outline;
      element.style.outlineOffset = previous.outlineOffset;
    }
    targetRef.current = null;
    styleRef.current = null;
  }, []);

  const loadPreference = useCallback(async (id: string) => {
    const show = (row: PreferenceRow | null) => {
      if (!row) {
        setTourIndex(0);
        setStage("choice");
      } else if (row.walkthrough_status === "in_progress" && row.experience_choice === "new") {
        setTourIndex(Math.max(0, Math.min(TOUR_STEPS.length - 1, row.current_step || 0)));
        setStage("tour");
      } else {
        setStage("hidden");
      }
    };
    const { data, error } = await supabase
      .from("user_onboarding_preferences")
      .select("experience_choice,walkthrough_status,current_step")
      .eq("user_id", id)
      .maybeSingle();
    if (error) {
      try {
        const cached = localStorage.getItem("middleman-onboarding:" + id);
        show(cached ? JSON.parse(cached) as PreferenceRow : null);
      } catch {
        show(null);
      }
      return;
    }
    show(data as PreferenceRow | null);
  }, []);

  useEffect(() => {
    let active = true;
    const load = async (id?: string) => {
      const signedInId = id ?? (await supabase.auth.getUser()).data.user?.id ?? null;
      if (!active) return;
      setUserId(signedInId);
      if (!signedInId) {
        setStage("hidden");
        return;
      }
      await loadPreference(signedInId);
    };
    void load();
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setUserId(null);
        setStage("hidden");
      } else if (event === "SIGNED_IN" && session?.user.id) {
        void load(session.user.id);
      }
    });
    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, [loadPreference]);

  useEffect(() => {
    if (stage !== "tour") {
      restoreTarget();
      setTargetRect(null);
      return;
    }
    let frame = 0;
    const update = () => {
      const step = TOUR_STEPS[tourIndex];
      let target = visibleTarget(step.target);
      if (!target) target = visibleTarget("menu");
      if (target !== targetRef.current) {
        restoreTarget();
        if (target) {
          styleRef.current = saveTargetStyle(target);
          targetRef.current = target;
          if (window.getComputedStyle(target).position === "static") target.style.position = "relative";
          target.style.boxShadow = "0 0 0 4px rgba(242,100,25,.95), 0 0 0 7px rgba(255,252,246,.95)";
          target.style.borderRadius = target.style.borderRadius || "12px";
          target.style.outline = "2px solid #fffaf2";
          target.style.outlineOffset = "2px";
        }
      }
      if (target) setTargetRect(target.getBoundingClientRect());
      else setTargetRect(null);
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    schedule();
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);
    const timer = window.setInterval(schedule, 600);
    return () => {
      cancelAnimationFrame(frame);
      window.clearInterval(timer);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
      restoreTarget();
    };
  }, [stage, tourIndex, restoreTarget]);

  const persist = useCallback(async (choice: ExperienceChoice, status: "in_progress" | "completed" | "skipped", step = 0) => {
    if (!userId) return false;
    setSaving(true);
    setSaveError("");
    const preference = {
      user_id: userId,
      experience_choice: choice,
      walkthrough_status: status,
      current_step: step,
      completed_at: status === "in_progress" ? null : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("user_onboarding_preferences").upsert(preference, { onConflict: "user_id" });
    let cached = false;
    try {
      localStorage.setItem("middleman-onboarding:" + userId, JSON.stringify(preference));
      cached = true;
    } catch { /* The database remains the primary store. */ }
    setSaving(false);
    if (error && !cached) {
      setSaveError("We couldn’t save that just now. Please try once more.");
      return false;
    }
    return true;
  }, [userId]);

  async function choose(choice: ExperienceChoice) {
    if (choice === "veteran") {
      if (await persist("veteran", "skipped")) setStage("hidden");
      return;
    }
    if (await persist("new", "in_progress", 0)) {
      setTourIndex(0);
      setStage("tour");
    }
  }

  async function skipTour() {
    if (await persist("new", "skipped", tourIndex)) setStage("hidden");
  }

  async function advanceTour() {
    const nextStep = tourIndex + 1;
    if (nextStep >= TOUR_STEPS.length) {
      if (await persist("new", "completed", TOUR_STEPS.length)) setStage("hidden");
      return;
    }
    if (await persist("new", "in_progress", nextStep)) setTourIndex(nextStep);
  }

  useEffect(() => {
    const replay = async () => {
      if (!userId) return;
      if (await persist("new", "in_progress", 0)) {
        setTourIndex(0);
        setStage("tour");
      }
    };
    window.addEventListener("middleman:onboarding-replay", replay);
    return () => window.removeEventListener("middleman:onboarding-replay", replay);
  }, [userId, persist]);

  if (stage === "hidden") return null;

  if (stage === "choice") {
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#17233a]/45 p-4" role="presentation">
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="middleman-welcome-title"
          className="w-full max-w-lg rounded-[28px] border border-[#eadfd0] bg-[#fffdf8] p-6 text-[#1d2d46] shadow-[0_28px_90px_rgba(12,23,39,.28)] sm:p-8"
        >
          <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-[#fff0dc] text-2xl" aria-hidden="true">👋</div>
          <p className="text-sm font-semibold text-[#d75b17]">A quick hello</p>
          <h2 id="middleman-welcome-title" className="mt-2 text-2xl font-semibold tracking-[-.025em] sm:text-3xl">
            Glad you’re here. How well do you know The Middleman?
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#586578]">
            Pick your path and we’ll make the next bit fit you. No quizzes, promise. 🙂
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => void choose("new")}
              className="rounded-2xl bg-[#172b49] px-5 py-4 text-left text-sm font-semibold text-white transition hover:bg-[#203a60] disabled:opacity-60"
            >
              <span className="block text-lg">I’m new here 🌱</span>
              <span className="mt-1 block text-xs font-normal text-white/75">Show me the basics</span>
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void choose("veteran")}
              className="rounded-2xl border border-[#e8dece] bg-white px-5 py-4 text-left text-sm font-semibold text-[#24334a] transition hover:border-[#e7772f] disabled:opacity-60"
            >
              <span className="block text-lg">I know my way ✨</span>
              <span className="mt-1 block text-xs font-normal text-[#687386]">Skip the walkthrough</span>
            </button>
          </div>
          {saveError && <p role="alert" className="mt-4 text-sm text-red-700">{saveError}</p>}
        </section>
      </div>
    );
  }

  const step = TOUR_STEPS[tourIndex];
  const viewportWidth = typeof window === "undefined" ? 400 : window.innerWidth;
  const viewportHeight = typeof window === "undefined" ? 800 : window.innerHeight;
  const bubbleWidth = Math.min(360, viewportWidth - 32);
  const bubbleLeft = targetRect
    ? Math.max(16, Math.min(targetRect.left + targetRect.width / 2 - bubbleWidth / 2, viewportWidth - bubbleWidth - 16))
    : Math.max(16, (viewportWidth - bubbleWidth) / 2);
  const bubbleTop = targetRect
    ? Math.min(targetRect.bottom + 14, viewportHeight - 200)
    : Math.max(24, viewportHeight / 2 - 80);

  return (
    <>
      {targetRect ? (
        <>
          <div className="fixed z-[105] bg-[#14233b]/65" aria-hidden="true" style={{ top: 0, left: 0, right: 0, height: Math.max(0, targetRect.top - 9) }} />
          <div className="fixed z-[105] bg-[#14233b]/65" aria-hidden="true" style={{ top: targetRect.bottom + 9, left: 0, right: 0, bottom: 0 }} />
          <div className="fixed z-[105] bg-[#14233b]/65" aria-hidden="true" style={{ top: Math.max(0, targetRect.top - 9), left: 0, width: Math.max(0, targetRect.left - 9), height: targetRect.height + 18 }} />
          <div className="fixed z-[105] bg-[#14233b]/65" aria-hidden="true" style={{ top: Math.max(0, targetRect.top - 9), left: targetRect.right + 9, right: 0, height: targetRect.height + 18 }} />
        </>
      ) : (
        <div className="fixed inset-0 z-[105] bg-[#14233b]/65" aria-hidden="true" />
      )}
      {targetRect && (
        <section
          role="dialog"
          aria-modal="false"
          aria-live="polite"
          aria-labelledby="middleman-tour-title"
          className="fixed z-[121] w-[calc(100vw-2rem)] max-w-[22.5rem] rounded-2xl border border-[#e9dece] bg-[#fffdf8] p-5 text-[#1d2d46] shadow-[0_22px_70px_rgba(12,23,39,.3)]"
          style={{ left: bubbleLeft, top: bubbleTop }}
        >
          <p className="text-xs font-semibold text-[#d75b17]">A tiny tour · {tourIndex + 1} of {TOUR_STEPS.length}</p>
          <h2 id="middleman-tour-title" className="mt-1 text-lg font-semibold">{step.title}</h2>
          <p className="mt-2 text-sm leading-6 text-[#586578]">{step.text}</p>
          <div className="mt-4 flex items-center justify-between gap-3">
            <button type="button" onClick={() => void skipTour()} disabled={saving} className="text-sm font-medium text-[#687386] underline underline-offset-4 disabled:opacity-50">
              Skip tour
            </button>
            <button type="button" onClick={() => void advanceTour()} disabled={saving} className="rounded-full bg-[#e86b25] px-4 py-2 text-sm font-semibold text-[#1b2636] transition hover:bg-[#f07b34] disabled:opacity-60">
              {tourIndex === TOUR_STEPS.length - 1 ? "Finish" : "Next"}
            </button>
          </div>
          {saveError && <p role="alert" className="mt-3 text-xs text-red-700">{saveError}</p>}
        </section>
      )}
      {!targetRect && (
        <div role="dialog" aria-modal="false" className="fixed left-1/2 top-1/2 z-[121] w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-[#fffdf8] p-5 text-[#1d2d46] shadow-xl">
          <h2 className="font-semibold">{step.title}</h2>
          <p className="mt-2 text-sm leading-6 text-[#586578]">{step.text}</p>
          <div className="mt-4 flex justify-between">
            <button type="button" onClick={() => void skipTour()} className="text-sm underline">Skip tour</button>
            <button type="button" onClick={() => void advanceTour()} className="rounded-full bg-[#e86b25] px-4 py-2 text-sm font-semibold">Next</button>
          </div>
        </div>
      )}
    </>
  );
}

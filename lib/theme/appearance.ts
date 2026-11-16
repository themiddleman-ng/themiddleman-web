export const APPEARANCE_KEY = "mm-appearance";
export type AppearanceChoice = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const appearanceBootScript = `(function(){try{var stored=localStorage.getItem("${APPEARANCE_KEY}");var theme=stored==="light"||stored==="dark"?stored:(window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark");var root=document.documentElement;root.dataset.theme=theme;root.style.colorScheme=theme;}catch(e){}})();`;

export function readAppearanceChoice(): AppearanceChoice {
  try {
    const stored = localStorage.getItem(APPEARANCE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") return stored;
  } catch { /* Private browsing can block storage. */ }
  return "system";
}

export function resolveTheme(choice: AppearanceChoice): ResolvedTheme {
  if (choice === "light" || choice === "dark") return choice;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function applyAppearance(choice: AppearanceChoice) {
  try {
    localStorage.setItem(APPEARANCE_KEY, choice);
  } catch { /* The choice still applies for this view. */ }
  const theme = resolveTheme(choice);
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  window.dispatchEvent(new Event("mm-appearance"));
}

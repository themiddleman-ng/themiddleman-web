export type MarketplaceCategory = "development" | "design" | "marketing" | "writing" | "ai_assisted";

export type CategoryTheme = {
  key: MarketplaceCategory;
  label: string;
  accent: "ember" | "ember-soft" | "ember-deep" | "ember-cta" | "link";
};

export const MARKETPLACE_CATEGORIES: CategoryTheme[] = [
  { key: "development", label: "Web & Software", accent: "ember" },
  { key: "design", label: "Design", accent: "ember-soft" },
  { key: "marketing", label: "Marketing", accent: "ember-deep" },
  { key: "writing", label: "Writing", accent: "ember-cta" },
];

export const CATEGORY_THEMES: Record<string, CategoryTheme> = {
  development: MARKETPLACE_CATEGORIES[0],
  design: MARKETPLACE_CATEGORIES[1],
  marketing: MARKETPLACE_CATEGORIES[2],
  writing: MARKETPLACE_CATEGORIES[3],
  ai_assisted: { key: "ai_assisted", label: "AI-assisted", accent: "link" },
};

export function categoryTheme(category: string): CategoryTheme {
  return CATEGORY_THEMES[category] ?? { key: "development", label: "Digital product", accent: "ember" };
}

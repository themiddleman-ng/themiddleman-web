import { categoryTheme } from "@/lib/marketplace/categories";
import { CodeIcon } from "@phosphor-icons/react/dist/csr/Code";
import { MegaphoneIcon } from "@phosphor-icons/react/dist/csr/Megaphone";
import { PaletteIcon } from "@phosphor-icons/react/dist/csr/Palette";
import { PencilLineIcon } from "@phosphor-icons/react/dist/csr/PencilLine";
import { SparkleIcon } from "@phosphor-icons/react/dist/csr/Sparkle";
import type { Icon } from "@phosphor-icons/react/dist/lib/types";

const CATEGORY_ICONS: Record<string, Icon> = {
  development: CodeIcon,
  design: PaletteIcon,
  marketing: MegaphoneIcon,
  writing: PencilLineIcon,
  ai_assisted: SparkleIcon,
};

export function CategoryIcon({ category, className }: { category: string; className?: string }) {
  const Icon = CATEGORY_ICONS[category] ?? CodeIcon;
  return <Icon className={className} weight="regular" aria-hidden="true" />;
}

export function categoryCover(category: string) {
  return categoryTheme(category);
}

export default function ProductCover({
  title,
  category,
  compact = false,
}: {
  title: string;
  category: string;
  compact?: boolean;
  label?: string;
}) {
  const theme = categoryTheme(category);
  return (
    <div
      className="product-cover relative flex h-full w-full items-center justify-center overflow-hidden"
      style={{ ["--tile-accent" as string]: `var(--accent-${theme.accent})` }}
      role="img"
      aria-label={`${title} cover`}
    >
      <CategoryIcon category={category} className={compact ? "relative z-[1] h-14 w-14" : "relative z-[1] h-16 w-16"} />
    </div>
  );
}

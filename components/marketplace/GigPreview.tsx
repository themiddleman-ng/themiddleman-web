import ProductCover from "./ProductCover";

export default function GigPreview({ category, title = "Digital product", compact = false }: { category: string; seed?: string; title?: string; compact?: boolean }) {
  return <ProductCover title={title} category={category} compact={compact} />;
}

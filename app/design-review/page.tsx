import { notFound } from "next/navigation";
import DesignPreviewScreen from "@/components/design/DesignPreviewScreen";

export const dynamic = "force-dynamic";

export default async function DesignReview({ searchParams }: { searchParams: Promise<{ screen?: string }> }) {
  const previewDeployment = process.env.NODE_ENV === "development" || process.env.VERCEL_ENV === "preview";
  if (!previewDeployment) notFound();
  const { screen } = await searchParams;
  return <DesignPreviewScreen initialScreen={screen} />;
}

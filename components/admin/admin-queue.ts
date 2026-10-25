export type AdminQueueKind = "product" | "seller" | "delivery";

export type AdminQueueRow = {
  id: string;
  kind: AdminQueueKind;
  title: string;
  detail: string;
  since: string;
  href: string;
  thumb?: { title: string; category: string; imageUrl?: string };
};

export type VerificationStatus = "draft" | "pending" | "approved" | "rejected";
export type GigCategory = "development" | "design" | "marketing" | "writing" | "ai_assisted";
export type OrderStatus = "pending_payment" | "in_escrow" | "delivered" | "approved" | "disputed" | "refunded";
export type PaymentStatus = "initiated" | "successful" | "failed" | "refunded";
export type DisputeStatus = "open" | "under_review" | "resolved_buyer" | "resolved_seller" | "closed";

export interface AppUser {
  id: string;
  full_name: string;
  phone: string | null;
  state: string | null;
  is_buyer: boolean;
  is_seller: boolean;
}

export interface SellerProfile {
  user_id: string;
  display_name: string;
  bio: string;
  skills: string[];
  portfolio_links: string[];
  linkedin_url: string | null;
  years_experience: string | null;
  gig_categories: string[];
  id_document_type: string | null;
  id_document_url: string | null;
  verification_status: VerificationStatus;
}

export interface Gig {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  category: GigCategory;
  price_ngn: number;
  is_ai_assisted: boolean;
  status: "draft" | "published" | "archived";
}

export interface Order {
  id: string;
  buyer_id: string;
  seller_id: string;
  gig_id: string;
  amount: number;
  status: OrderStatus;
}

export interface Payment {
  id: string;
  order_id: string;
  amount: number;
  provider: string;
  reference: string;
  status: PaymentStatus;
}

export interface Review {
  id: string;
  order_id: string;
  reviewer_id: string;
  rating: number;
  comment: string | null;
}

export interface Dispute {
  id: string;
  order_id: string;
  raised_by: string;
  reason: string;
  status: DisputeStatus;
}

export interface Conversation {
  id: string;
  buyer_id: string;
  seller_id: string;
  gig_id: string | null;
}

export interface ThreadMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

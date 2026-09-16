# The Middleman — Live Supabase Schema
# Source of truth as of audit on 2026-07-29
# Always code against THIS file, not the original schema.sql

---

## CRITICAL DIFFERENCES FROM ORIGINAL SCHEMA.SQL

### 1. seller_profiles PRIMARY KEY is `id` (uuid), NOT `user_id`
- The table has TWO uuid columns: `id` (PK) and `user_id` (FK → users, UNIQUE)
- `gigs.seller_id` → references `seller_profiles(id)` — NOT user_id
- `orders.seller_id` → references `seller_profiles(id)` — NOT user_id
- `conversations.seller_id` → references `seller_profiles(user_id)` (exception — this one uses user_id)
- IMPACT: Every gig insert must first fetch seller_profiles.id for the current user, then use that as seller_id

### 2. gigs.status values: 'active' | 'paused' | 'deleted'
- Original schema had: 'draft' | 'published' | 'archived' — WRONG, does not exist
- Default is 'active' — new gigs go live immediately on creation

### 3. orders.amount is numeric, NOT amount_ngn integer
- Column is called `amount`, not `amount_ngn`
- Type is numeric, not integer

### 4. payments table is completely different
- Column `paystack_reference` (not `reference`)
- Column `amount` (not `amount_ngn`)
- Column `platform_fee` numeric default 0
- Column `escrow_status`: 'held' | 'released' | 'refunded'
- Column `payout_status`: 'pending' | 'paid' | 'failed'
- NO `provider` or `status` columns

### 5. orders.status values: 'pending' | 'in_progress' | 'delivered' | 'completed' | 'disputed' | 'cancelled'
- Original had: 'pending_payment' | 'in_escrow' | 'approved' | 'refunded' — WRONG

### 6. disputes.status values: 'open' | 'investigating' | 'resolved'
- Original had more values — WRONG
- disputes has extra columns: `resolution_notes` (text, nullable), `resolved_at` (timestamptz, nullable)

### 7. seller_profiles.verification_status values: 'pending' | 'approved' | 'rejected'
- No 'draft' value — original schema had it, live DB does not

---

## TABLE: users
| column | type | nullable | default |
|---|---|---|---|
| id | uuid | NO | — |
| full_name | text | YES | — |
| email | text | NO | — |
| phone | text | YES | — |
| is_buyer | boolean | NO | true |
| is_seller | boolean | NO | false |
| created_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |
| state | text | YES | — |

---

## TABLE: seller_profiles
| column | type | nullable | default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() ← PRIMARY KEY |
| user_id | uuid | NO | — ← FK → users(id), UNIQUE |
| display_name | text | NO | — |
| bio | text | YES | — |
| skills | text[] | YES | '{}' |
| portfolio_links | text[] | YES | '{}' |
| gig_categories | text[] | NO | '{}' |
| linkedin_url | text | YES | — |
| years_experience | text | YES | — |
| id_document_type | text | YES | — |
| id_document_url | text | YES | — |
| verification_status | text | NO | 'pending' |
| rating_avg | numeric | YES | 0 |
| total_orders_completed | integer | YES | 0 |
| created_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |

verification_status CHECK: 'pending' | 'approved' | 'rejected'

---

## TABLE: gigs
| column | type | nullable | default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| seller_id | uuid | NO | — ← FK → seller_profiles(id) NOT user_id |
| title | text | NO | — |
| description | text | NO | — |
| category | gig_category enum | NO | — |
| price_ngn | integer | NO | — |
| delivery_days | integer | NO | 7 |
| experience_tier | text | NO | 'beginner' |
| is_ai_assisted | boolean | YES | false |
| status | text | NO | 'active' |
| created_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |

status CHECK: 'active' | 'paused' | 'deleted'
experience_tier CHECK: 'beginner' | 'intermediate' | 'expert'
price_ngn CHECK: > 0
gig_category enum: 'development' | 'design' | 'marketing' | 'writing' | 'ai_assisted'

---

## TABLE: orders
| column | type | nullable | default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| gig_id | uuid | NO | — |
| buyer_id | uuid | NO | — ← FK → users(id) |
| seller_id | uuid | NO | — ← FK → seller_profiles(id) |
| amount | numeric | NO | — |
| status | text | NO | 'pending' |
| created_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |

status CHECK: 'pending' | 'in_progress' | 'delivered' | 'completed' | 'disputed' | 'cancelled'

---

## TABLE: payments
| column | type | nullable | default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| order_id | uuid | NO | — ← FK → orders(id) CASCADE |
| paystack_reference | text | NO | — UNIQUE |
| amount | numeric | NO | — |
| platform_fee | numeric | NO | 0 |
| escrow_status | text | NO | 'held' |
| payout_status | text | NO | 'pending' |
| created_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |

escrow_status CHECK: 'held' | 'released' | 'refunded'
payout_status CHECK: 'pending' | 'paid' | 'failed'

---

## TABLE: reviews
| column | type | nullable | default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| order_id | uuid | NO | — UNIQUE |
| reviewer_id | uuid | NO | — ← FK → users(id) |
| rating | integer | NO | — CHECK 1–5 |
| comment | text | YES | — |
| created_at | timestamptz | NO | now() |

---

## TABLE: disputes
| column | type | nullable | default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| order_id | uuid | NO | — ← FK → orders(id) CASCADE |
| raised_by | uuid | NO | — ← FK → users(id) |
| reason | text | NO | — |
| status | text | NO | 'open' |
| resolution_notes | text | YES | — |
| created_at | timestamptz | NO | now() |
| resolved_at | timestamptz | YES | — |

status CHECK: 'open' | 'investigating' | 'resolved'

---

## TABLE: conversations
| column | type | nullable | default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| buyer_id | uuid | NO | — ← FK → users(id) |
| seller_id | uuid | NO | — ← FK → seller_profiles(user_id) ← exception, uses user_id |
| gig_id | uuid | YES | — |
| created_at | timestamptz | NO | now() |

UNIQUE (buyer_id, seller_id, gig_id)

---

## TABLE: messages
| column | type | nullable | default |
|---|---|---|---|
| id | uuid | NO | gen_random_uuid() |
| conversation_id | uuid | NO | — ← FK → conversations(id) CASCADE |
| sender_id | uuid | NO | — ← FK → users(id) |
| body | text | NO | — |
| created_at | timestamptz | NO | now() |

CHECK: body not empty, no URLs/emails/phone numbers

---

## LOOKUP PATTERN: Getting seller_profiles.id from auth user

Every time you need to insert into gigs or orders as a seller, use this pattern:

```js
const { data: { user } } = await supabase.auth.getUser();
const { data: profile } = await supabase
  .from('seller_profiles')
  .select('id')
  .eq('user_id', user.id)
  .single();
// then use profile.id as seller_id in gigs/orders inserts
```

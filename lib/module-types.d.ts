declare module "@/lib/design-preview/filters.mjs" {
  export type Listing = [string, string, string, string];
  export function listingPrice(value: unknown): number;
  export function matchesPrice(amount: number, range: string): boolean;
  export function filterListings(
    listings: Listing[],
    options?: { query?: string; category?: string; price?: string; sort?: string },
  ): Listing[];
  export function filterThreads<T extends { name: string; product: string; preview: string }>(
    threads: T[],
    query?: string,
  ): T[];
}

declare module "@/lib/auth/login-errors.mjs" {
  export type AuthField = "email" | "password" | "credentials" | "form";
  export type AuthAlert = {
    code: string;
    field: AuthField;
    title: string;
    message: string;
    actionHref?: string;
    actionLabel?: string;
  };
  export function validateLoginInput(input?: { email?: string; password?: string }): AuthAlert | null;
  export function classifyLoginError(error: {
    code?: string;
    message?: string;
    error_description?: string;
    status?: number;
  } | null | undefined): AuthAlert;
  export function applyLoginFailure(input: {
    email?: string;
    password?: string;
    alert?: AuthAlert | null;
  }): { email: string; password: string; focus: string };
  export function classifySignupError(error: {
    code?: string;
    message?: string;
    status?: number;
  } | null | undefined): AuthAlert;
}

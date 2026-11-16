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

declare module "@/lib/profile/avatar-file.mjs" {
  export function guessImageType(file: { type?: string; name?: string } | null | undefined): string;
  export function avatarExtension(type: string): string;
  export function classifyAvatarFile(
    file: { type?: string; name?: string; size?: number } | null | undefined,
    maxBytes?: number,
  ): { ok: boolean; code?: string; message?: string; type?: string; needsConvert?: boolean };
  export function avatarStoragePath(userId: string, type: string): string;
}

declare module "@/lib/profile/owner-avatar.mjs" {
  export const AVATAR_BUCKET: string;
  export const OWNER_AVATAR_EVENT: string;
  export const OWNER_AVATAR_CACHE_KEY: string;
  export function metadataAvatarPath(metadata: { profile_avatar_path?: unknown } | null | undefined): string | null;
  export function isAvatarObjectName(name: string | null | undefined): boolean;
  export function folderAvatarPath(userId: string, name: string): string | null;
  export function candidateAvatarPaths(userId: string, knownPath?: string | null): string[];
  export function readCachedOwnerAvatar(
    storage: { getItem(key: string): string | null } | null | undefined,
    userId: string,
  ): { userId: string; path: string | null; url: string } | null;
  export function writeCachedOwnerAvatar(
    storage: { setItem(key: string, value: string): void; removeItem(key: string): void } | null | undefined,
    record: { userId: string; path: string | null; url: string } | null,
  ): void;
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

"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  AVATAR_BUCKET,
  OWNER_AVATAR_EVENT,
  candidateAvatarPaths,
  folderAvatarPath,
  isAvatarObjectName,
  metadataAvatarPath,
  readCachedOwnerAvatar,
  writeCachedOwnerAvatar,
} from "@/lib/profile/owner-avatar.mjs";

export type OwnerAvatarRecord = {
  userId: string;
  path: string | null;
  url: string;
};

type AuthUser = {
  id: string;
  user_metadata?: Record<string, unknown>;
};

function browserCache(userId: string) {
  if (typeof window === "undefined") return null;
  return readCachedOwnerAvatar(window.sessionStorage, userId);
}

export function publishOwnerAvatar(record: OwnerAvatarRecord | null) {
  if (typeof window === "undefined") return;
  writeCachedOwnerAvatar(window.sessionStorage, record);
  window.dispatchEvent(new CustomEvent(OWNER_AVATAR_EVENT, { detail: record }));
}

async function signPath(path: string) {
  const { data, error } = await supabase.storage.from(AVATAR_BUCKET).createSignedUrl(path, 60 * 60);
  if (error || !data?.signedUrl) return "";
  return data.signedUrl;
}

async function listFolderPath(userId: string) {
  const { data } = await supabase.storage.from(AVATAR_BUCKET).list(userId, { limit: 20 });
  const file = (data || []).find((item) => isAvatarObjectName(item.name));
  return file ? folderAvatarPath(userId, file.name) : null;
}

export async function saveOwnerAvatarPath(path: string | null) {
  const { error } = await supabase.auth.updateUser({
    data: { profile_avatar_path: path },
  });
  if (!error) await supabase.auth.refreshSession();
  return error;
}

export async function resolveOwnerAvatar(
  user: AuthUser | null,
  options: { path?: string | null; previewUrl?: string } = {},
): Promise<OwnerAvatarRecord> {
  if (!user?.id) return { userId: "", path: null, url: "" };

  const cached = browserCache(user.id);
  const known = options.path ?? metadataAvatarPath(user.user_metadata) ?? cached?.path ?? null;

  if (options.previewUrl) {
    publishOwnerAvatar({ userId: user.id, path: known, url: options.previewUrl });
  }

  if (known) {
    const url = await signPath(known);
    if (url) {
      const record = { userId: user.id, path: known, url };
      publishOwnerAvatar(record);
      return record;
    }
  }

  const listed = await listFolderPath(user.id);
  if (listed) {
    const url = await signPath(listed);
    if (url) {
      const record = { userId: user.id, path: listed, url };
      publishOwnerAvatar(record);
      return record;
    }
  }

  if (known) {
    for (const path of candidateAvatarPaths(user.id, null)) {
      if (path === known || path === listed) continue;
      const url = await signPath(path);
      if (url) {
        const record = { userId: user.id, path, url };
        publishOwnerAvatar(record);
        return record;
      }
    }
  }

  const fallback = {
    userId: user.id,
    path: known,
    url: options.previewUrl || cached?.url || "",
  };
  publishOwnerAvatar(fallback);
  return fallback;
}

export function useOwnerAvatar(user: AuthUser | null) {
  const [record, setRecord] = useState<OwnerAvatarRecord>(() => {
    if (!user?.id) return { userId: "", path: null, url: "" };
    return browserCache(user.id) || { userId: user.id, path: null, url: "" };
  });

  useEffect(() => {
    if (!user?.id) {
      setRecord({ userId: "", path: null, url: "" });
      return;
    }

    const cached = browserCache(user.id);
    if (cached) setRecord(cached);

    let active = true;
    void resolveOwnerAvatar(user).then((next) => {
      if (active) setRecord(next);
    });

    const onUpdate = (event: Event) => {
      const detail = (event as CustomEvent<OwnerAvatarRecord | null>).detail;
      if (!detail) {
        setRecord({ userId: user.id, path: null, url: "" });
        return;
      }
      if (detail.userId === user.id) setRecord(detail);
    };

    window.addEventListener(OWNER_AVATAR_EVENT, onUpdate);
    return () => {
      active = false;
      window.removeEventListener(OWNER_AVATAR_EVENT, onUpdate);
    };
  }, [user?.id, user?.user_metadata?.profile_avatar_path]);

  return record;
}

"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useAdminAccount(userId?: string | null) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!userId) {
      setIsAdmin(false);
      return;
    }

    let active = true;
    void supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setIsAdmin(data?.role === "admin");
      });

    return () => {
      active = false;
    };
  }, [userId]);

  return isAdmin;
}

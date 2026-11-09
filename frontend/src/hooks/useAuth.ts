"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/store/auth";

/** Loads the session once per app and exposes it. */
export function useAuth() {
  const { user, status, fetchMe, setUser, logout } = useAuthStore();
  useEffect(() => {
    if (status === "idle") void fetchMe();
  }, [status, fetchMe]);
  return { user, ready: status === "ready", isAdmin: user?.role === "admin", setUser, logout, refresh: fetchMe };
}

/** Client-side guard: redirects to sign-in (or home for non-admins) once the session is known. */
export function useRequireAuth(role?: "admin") {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (!auth.ready) return;
    if (!auth.user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (role === "admin" && auth.user.role !== "admin") router.replace("/my-account");
  }, [auth.ready, auth.user, role, router, pathname]);
  const allowed = auth.ready && !!auth.user && (!role || auth.user.role === role);
  return { ...auth, allowed };
}

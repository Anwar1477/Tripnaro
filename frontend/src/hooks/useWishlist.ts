"use client";

import { usePathname, useRouter } from "next/navigation";
import { create } from "zustand";
import { errorMessage } from "@/lib/api";
import { accountService } from "@/services";
import { toast } from "@/store/toast";
import { useAuth } from "./useAuth";
import { useEffect } from "react";

interface WishlistState {
  ids: Set<string>;
  loadedFor: string | null;
  load: (userId: string) => Promise<void>;
  setSaved: (id: string, saved: boolean) => void;
}

const useWishlistStore = create<WishlistState>((set, get) => ({
  ids: new Set(),
  loadedFor: null,
  load: async (userId) => {
    if (get().loadedFor === userId) return;
    set({ loadedFor: userId });
    try {
      set({ ids: new Set(await accountService.wishlistIds()) });
    } catch {
      /* non-critical */
    }
  },
  setSaved: (id, saved) =>
    set((s) => {
      const ids = new Set(s.ids);
      if (saved) ids.add(id);
      else ids.delete(id);
      return { ids };
    }),
}));

export function useWishlist() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { ids, load, setSaved } = useWishlistStore();

  useEffect(() => {
    if (user) void load(user._id);
  }, [user, load]);

  async function toggle(itemType: "hotel" | "tour", itemId: string) {
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    const optimistic = !ids.has(itemId);
    setSaved(itemId, optimistic);
    try {
      const { data, message } = await accountService.toggleWishlist(itemType, itemId);
      setSaved(itemId, data.saved);
      toast.success(message);
    } catch (err) {
      setSaved(itemId, !optimistic);
      toast.error(errorMessage(err));
    }
  }

  return { isSaved: (id: string) => ids.has(id), toggle };
}

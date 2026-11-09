"use client";

import { Heart } from "lucide-react";
import { useWishlist } from "@/hooks/useWishlist";
import { cn } from "@/lib/utils";

export function WishlistButton({ itemType, itemId, className }: { itemType: "hotel" | "tour"; itemId: string; className?: string }) {
  const { isSaved, toggle } = useWishlist();
  const saved = isSaved(itemId);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void toggle(itemType, itemId);
      }}
      aria-pressed={saved}
      aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
      className={cn("grid size-9 place-items-center rounded-full bg-white/90 shadow-sm backdrop-blur transition hover:scale-105 hover:bg-white", className)}
    >
      <Heart className={cn("size-[18px] transition", saved ? "fill-coral-500 text-coral-500" : "text-ink-700")} />
    </button>
  );
}

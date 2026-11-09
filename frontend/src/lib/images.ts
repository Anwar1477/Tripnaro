/** Unsplash CDN URL for a photo id (e.g. "photo-1507525428034-b723cf961d3e"). */
export const img = (id: string, w = 900) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

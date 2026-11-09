/** Keyless OpenStreetMap embed for hotel / destination locations. */
export function MapEmbed({ lat, lng, title }: { lat: number; lng: number; title: string }) {
  const d = 0.02;
  const bbox = [lng - d, lat - d, lng + d, lat + d].join(",");
  return (
    <div className="overflow-hidden rounded-(--radius-card) border border-ink-100">
      <iframe
        title={`Map of ${title}`}
        src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`}
        className="h-64 w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
      <a href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`} target="_blank" rel="noopener noreferrer" className="block bg-white px-4 py-2 text-xs font-semibold text-brand-700 hover:underline">
        Open larger map ↗
      </a>
    </div>
  );
}

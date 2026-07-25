"use client";

export function Avatar({ src, name, size = 36 }: { src?: string | null; name?: string | null; size?: number }) {
  const dim = { width: size, height: size };
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" style={dim} className="rounded-full object-cover ring-1 ring-ink/10" />;
  }
  const initial = (name || "?").trim().charAt(0).toUpperCase() || "?";
  return (
    <span style={dim}
      className="grid place-items-center rounded-full bg-brand-600 font-semibold text-paper ring-1 ring-brand-700">
      {initial}
    </span>
  );
}

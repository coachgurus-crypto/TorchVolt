/** Cloudflare Image Resizing — src stays original so it still works if resizing is off. */
export function cmsImageSrc(
  src: string,
  width: number,
  origin = typeof window !== "undefined" ? window.location.origin : "",
): string {
  if (!src || src.startsWith("data:")) return src;
  if (!origin || src.includes("/cdn-cgi/image/")) return src;
  const absolute = src.startsWith("http")
    ? src
    : `${origin}${src.startsWith("/") ? "" : "/"}${src}`;
  return `${origin}/cdn-cgi/image/format=auto,fit=cover,width=${width},quality=75/${absolute}`;
}

export function cmsSrcSet(
  src: string,
  origin = typeof window !== "undefined" ? window.location.origin : "",
): string {
  return [640, 960, 1280]
    .map((width) => `${cmsImageSrc(src, width, origin)} ${width}w`)
    .join(", ");
}

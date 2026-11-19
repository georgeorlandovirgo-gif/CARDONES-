/** Public-image URL that supports the GitHub Pages /CARDONES-/ preview prefix. */
export function assetUrl(path: string): string {
  if (!path.startsWith("/")) return path;
  return `${process.env.NEXT_PUBLIC_BASE_PATH || ""}${path}`;
}

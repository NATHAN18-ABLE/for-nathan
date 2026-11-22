// Set when the site is exported for a sub-path host such as GitHub Pages (/for-nathan).
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
export const asset = (path: string) => `${BASE_PATH}${path}`;

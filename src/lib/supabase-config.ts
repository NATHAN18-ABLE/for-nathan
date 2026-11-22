// The site's Supabase project. Public by design: the publishable key opens Realtime channels,
// adds wish lanterns and test results, and reads totals; no table can be read row by row.
// A host may set its own (Netlify's Supabase extension, or the site's environment variables);
// without them the site uses the project below.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qfuzoymuzsnlbirnlsmb.supabase.co";
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable__9aJ0uP7nHMjCN19evf3Ow_iUOIkI6N";

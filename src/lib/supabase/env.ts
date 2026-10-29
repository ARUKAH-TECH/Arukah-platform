// Both values are public (the publishable key only works within Row Level
// Security), but failing loudly beats a confusing auth error when unset.
export function supabaseUrl() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!value) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set: see docs/ENVIRONMENT.md");
  return value;
}

export function supabaseKey() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!value) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set: see docs/ENVIRONMENT.md");
  return value;
}

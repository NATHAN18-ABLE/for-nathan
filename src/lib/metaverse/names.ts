// A friendly name from an id, the same on every screen. No personal data is asked for.
export function autoName(id: string): string {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return `Traveler ${((h >>> 0) % 99) + 1}`;
}

// Rooms whose 3D scene is built and live. Kept apart from the scenes so pages can
// link to a room without loading any 3D code. Add a slug when its scene ships.
export const OPEN_ROOMS = ["seodaemun", "yongsan", "jongno", "gangnam", "yeongdeungpo"];

/** The room to send a traveler to: their own if it is open, otherwise the first open one. */
// a district without a room of its own starts in Jongno, the main room
export const entryRoom = (slug: string) => (OPEN_ROOMS.includes(slug) ? slug : "jongno");

export const roomHref = (slug: string) => `/metaverse/${entryRoom(slug)}`;

// A traveler makes their character once, in the wardrobe, before their first room (phones and
// computers alike). After that every room opens straight away with the same character, kept on
// this device; the wardrobe stays open for changes.
export const DRESSED_KEY = "seoul.mv.dressed";
const AVATAR_KEY = "seoul.mv.avatar1"; // saved by the wardrobe
export const wardrobeHref = (slug: string) => `/metaverse/wardrobe/?from=${entryRoom(slug)}`;
export const isDressed = () => {
  try {
    return localStorage.getItem(DRESSED_KEY) === "1" || localStorage.getItem(AVATAR_KEY) !== null;
  } catch {
    return true; // storage blocked: never trap the visitor in the wardrobe
  }
};
export const markDressed = () => {
  try {
    localStorage.setItem(DRESSED_KEY, "1");
  } catch {}
};
/** Where a room link should go: the room itself once a character exists, else the wardrobe first. */
export const enterHref = (slug: string, dressed: boolean) => (dressed ? roomHref(slug) : wardrobeHref(slug));

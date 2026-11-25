// Rooms whose 3D scene is built and live. Kept apart from the scenes so pages can
// link to a room without loading any 3D code. Add a slug when its scene ships.
export const OPEN_ROOMS = ["seodaemun", "yongsan", "jongno", "gangnam", "yeongdeungpo"];

/** The room to send a traveler to: their own if it is open, otherwise the first open one. */
// a district without a room of its own starts in Jongno, the main room
export const entryRoom = (slug: string) => (OPEN_ROOMS.includes(slug) ? slug : "jongno");

export const roomHref = (slug: string) => `/metaverse/${entryRoom(slug)}`;

// Every visit starts in the wardrobe: a traveler picks and dresses their character before the
// first room (phones and computers alike). The flag lasts for the visit (this browser tab).
export const DRESSED_KEY = "seoul.mv.dressed";
export const wardrobeHref = (slug: string) => `/metaverse/wardrobe/?from=${entryRoom(slug)}`;
export const isDressed = () => {
  try {
    return sessionStorage.getItem(DRESSED_KEY) === "1";
  } catch {
    return true; // storage blocked: never trap the visitor in the wardrobe
  }
};
export const markDressed = () => {
  try {
    sessionStorage.setItem(DRESSED_KEY, "1");
  } catch {}
};

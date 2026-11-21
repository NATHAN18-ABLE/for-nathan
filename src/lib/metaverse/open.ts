// Rooms whose 3D scene is built and live. Kept apart from the scenes so pages can
// link to a room without loading any 3D code. Add a slug when its scene ships.
export const OPEN_ROOMS = ["seodaemun", "yongsan", "jongno", "gangnam"];

/** The room to send a traveler to: their own if it is open, otherwise the first open one. */
// a district without a room of its own starts in Jongno, the room the home page points to
export const entryRoom = (slug: string) => (OPEN_ROOMS.includes(slug) ? slug : "jongno");

export const roomHref = (slug: string) => `/metaverse/${entryRoom(slug)}`;

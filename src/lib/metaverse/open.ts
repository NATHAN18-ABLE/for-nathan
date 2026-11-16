// Rooms whose 3D scene is built and live. Kept apart from the scenes so pages can
// link to a room without loading any 3D code. Add a slug when its scene ships.
export const OPEN_ROOMS = ["jongno"];

/** The room to send a traveler to: their own if it is open, otherwise the first open one. */
export const entryRoom = (slug: string) => (OPEN_ROOMS.includes(slug) ? slug : OPEN_ROOMS[0]);

export const roomHref = (slug: string) => `/metaverse/${entryRoom(slug)}`;

// Rooms whose 3D scene is built and live. Kept apart from the scenes so pages can
// link to a room without loading any 3D code. Add a slug when its scene ships.
export const OPEN_ROOMS = ["jongno"];

export const roomHref = (slug: string) => (OPEN_ROOMS.includes(slug) ? `/metaverse/${slug}` : "/metaverse");

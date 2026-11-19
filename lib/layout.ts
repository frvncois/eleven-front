/**
 * Designed geometry: the Figma measurements the layouts are built from. These used to live in
 * Strapi, where they only ever confused the people editing the site — nobody places a tile on a
 * 4975 × 3598 field by typing numbers into a CMS. The content (which project, which picture, which
 * label) stays in Strapi; the geometry lives here, joined to it by slug or by order.
 *
 * Sizes that are simply a file's own pixel dimensions are NOT here: the pull script reads those off
 * the uploaded media (see scripts/pull-content.mjs), so replacing a picture keeps its proportions.
 */

/** The archive scatter field, in design px. Tiles are placed on it; the view scales it to fit. */
export const ARCHIVE_FIELD = { w: 4975, h: 3598 };

/**
 * Where each project's thumbnail sits on the field, by slug. The three widths (332 / 448 / 564)
 * are the S / M / L sizes lib/grid maps onto 2 / 3 / 4 columns.
 */
export const ARCHIVE_TILES: Record<string, { x: number; y: number; w: number; h: number }> = {
  "lucid-driven": { x: 2271, y: 1650, w: 332, h: 217 },
  "ge-day-one": { x: 2246, y: 1894, w: 448, h: 282 },
  "priceline-handoff": { x: 2263, y: 1271, w: 564, h: 347 },
  "lexus-wicked": { x: 1837, y: 1594, w: 332, h: 217 },
  "lexus-no-such-thing": { x: 2791, y: 1664, w: 448, h: 282 },
  "lucky-brand-addison": { x: 1616, y: 1970, w: 564, h: 347 },
  "hp-wake-up": { x: 2907, y: 1339, w: 332, h: 217 },
  "uber-eats-cox-goes-to-college": { x: 2828, y: 2055, w: 448, h: 282 },
  "mazda-you-know-who-you-are": { x: 1553, y: 1181, w: 564, h: 347 },
  "topo-chico-the-source-of-legends": { x: 2347, y: 1005, w: 332, h: 217 },
  "lexus-rz-miles-and-miles": { x: 2279, y: 2206, w: 448, h: 282 },
  "lexus-believe": { x: 1196, y: 1576, w: 564, h: 347 },
  "comfortable-sb-social-web-mix-16x9-titled": { x: 3422, y: 1649, w: 332, h: 217 },
  "hbo-mcmillions-trailer": { x: 2893, y: 971, w: 448, h: 282 },
  "coinbase-money-is-updating": { x: 3379, y: 1980, w: 564, h: 347 },
  "experian-derby-buddies": { x: 3350, y: 1343, w: 332, h: 217 },
  "doordash-world-cup": { x: 1819, y: 798, w: 448, h: 282 },
  "lexus-over-the-years": { x: 1551, y: 2351, w: 564, h: 347 },
  "lexus-es-the-attention-economy": { x: 2341, y: 2515, w: 332, h: 217 },
  "hbo-curb-your-enthusiasm-season-11-trailer": { x: 2856, y: 2456, w: 448, h: 282 },
  "where-to-canada-culinary": { x: 941, y: 1971, w: 564, h: 347 },
  "fox-sports-it-all-goes-down-at-noon": { x: 2366, y: 741, w: 332, h: 217 },
  "c4-spring": { x: 1000, y: 1162, w: 448, h: 282 },
  "nike-from-anywhere": { x: 2779, y: 578, w: 564, h: 347 },
  "expedia-stop-motion-start-exploring": { x: 3430, y: 1016, w: 332, h: 217 },
  "mcdonalds-proper-way": { x: 1294, y: 797, w: 448, h: 282 },
  "plentum-bella": { x: 559, y: 1562, w: 564, h: 347 },
  "vice-a-to-z-aaliyah": { x: 3751, y: 1306, w: 332, h: 217 },
  "expedia-trip-yips": { x: 3859, y: 1644, w: 448, h: 282 },
  "verizon-better-deal": { x: 2100, y: 2779, w: 564, h: 347 },
  "spotify-trust-in-your-sound": { x: 3425, y: 2389, w: 332, h: 217 },
  "lexus-mse-letter": { x: 2146, y: 431, w: 448, h: 282 },
  "lexus-session": { x: 786, y: 2393, w: 564, h: 347 },
  "walmart-jimmy-kimmel": { x: 2968, y: 2764, w: 332, h: 217 },
  "lime-carlos": { x: 1498, y: 2829, w: 448, h: 282 },
  "adidas-reflections": { x: 3413, y: 631, w: 564, h: 347 },
  "morgan-morgan-waterfight": { x: 3999, y: 2121, w: 332, h: 217 },
  "levis-the-denim-cowboy": { x: 1569, y: 477, w: 448, h: 282 },
  "ring-tossing-dough-with-cat-cora": { x: 3440, y: 2632, w: 564, h: 347 },
  "lexus-houses-united": { x: 3846, y: 1012, w: 332, h: 217 },
  "rothy-s-her-words": { x: 755, y: 833, w: 448, h: 282 },
  "the-wolf-ep-1": { x: 2676, y: 176, w: 564, h: 347 },
  "indy-car-garbage-truck": { x: 589, y: 1175, w: 332, h: 217 },
  "gm-dr-evil": { x: 2908, y: 3008, w: 448, h: 282 },
  "lume-down-there-honey": { x: 4188, y: 1269, w: 564, h: 347 },
  "golem-it-s-just-a-matter-of-time": { x: 552, y: 1949, w: 332, h: 217 },
  "espn-30-for-30-first-pitch": { x: 886, y: 2774, w: 448, h: 282 },
  "hersheys-the-real-gold": { x: 886, y: 328, w: 564, h: 347 },
  "nike-dream-crazier": { x: 3893, y: 2375, w: 332, h: 217 },
  "visa-typewriter": { x: 3463, y: 272, w: 448, h: 282 },
  "g-fore-dance-skate": { x: 3555, y: 3054, w: 564, h: 347 },
  "really-good-rejects-alice-gu": { x: 306, y: 2234, w: 332, h: 217 },
  "09-vice-az-aaliyah": { x: 4269, y: 934, w: 448, h: 282 },
  "p-g-best-job": { x: 4101, y: 508, w: 564, h: 347 },
  "c4-winter": { x: 4404, y: 2078, w: 332, h: 217 },
  "cue-the-bird-dancer": { x: 2342, y: 3156, w: 448, h: 282 },
  "don-t-forget-about-me-bryan-allen-lamb": { x: 4063, y: 2674, w: 564, h: 347 },
  "anonymous-content-shenita": { x: 4408, y: 1765, w: 332, h: 217 },
  "anonymous-content-tanguy": { x: 1575, y: 3152, w: 448, h: 282 },
  "wolf-the-hunt-continues-trailer": { x: 160, y: 2647, w: 564, h: 347 },
  "hp-who-is-the-wolf": { x: 2135, y: 160, w: 332, h: 217 },
  "the-wolf-ep-3": { x: 287, y: 517, w: 448, h: 282 },
  "the-wolf-ep-2": { x: 585, y: 3090, w: 564, h: 347 },
  "where-to-canada-outdoor": { x: 1686, y: 217, w: 332, h: 217 },
  "where-to-canada-wellness": { x: 197, y: 833, w: 448, h: 282 },
  "where-to-canada-where-to-ski": { x: 4251, y: 3091, w: 564, h: 347 },
};

/**
 * The room carousel's card heights, in order, measured at the 622 px card width (RoomCarousel
 * scales them). They are designed crops, not the photos' own proportions.
 */
export const ROOM_HEIGHTS = [397, 814, 397, 605, 500];

/**
 * Party-mode pictures: which corner each one opens in and how wide it runs, in order. The y of
 * 0.1878 is a share of the frame height, the one picture that hangs below the top margin.
 * The height comes from the picture itself, so only the designed width is here.
 */
export const PARTY_PLACEMENT: { x: "left" | "center" | "right"; y: "top" | "center" | "bottom" | number; width: number }[] = [
  { x: "left", y: "top", width: 459 },
  { x: "center", y: "center", width: 375 },
  { x: "right", y: "center", width: 542 },
  { x: "left", y: "bottom", width: 435 },
  { x: "left", y: 0.1878, width: 601 },
  { x: "center", y: "center", width: 626 },
];

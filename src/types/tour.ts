/**
 * 360° virtual tour model. A tour is a set of panorama "scenes" (equirectangular
 * images) connected by hotspots the visitor taps to move between them — the same
 * shape Pannellum consumes under the hood.
 */

export type TourHotspot = {
  /** Vertical angle in degrees (look up/down) where the hotspot sits. */
  pitch: number;
  /** Horizontal angle in degrees (compass) where the hotspot sits. */
  yaw: number;
  /** Scene this hotspot navigates to. */
  targetSceneId: string;
  /** Label shown on the hotspot, e.g. "Memorial Hall". */
  label: string;
};

export type TourScene = {
  id: string;
  /** Human title shown in the native overlay. */
  title: string;
  /** Equirectangular (2:1) panorama image URL. */
  panorama: string;
  /** Initial horizontal view angle in degrees. */
  initialYaw?: number;
  hotspots?: TourHotspot[];
};

export type VirtualTour = {
  id: string;
  name: string;
  /** Short description of the memorial site. */
  description: string;
  /** Cover image for the tour list (can reuse the first panorama). */
  cover: string;
  location: string;
  firstSceneId: string;
  scenes: TourScene[];
};

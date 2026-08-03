/**
 * Mirrors the API's virtual-tour contract (see StoryBook-Backend, and the web
 * client's src/types/tour.d.ts). A tour is a SINGLE media asset plus hotspots —
 * not the multi-scene graph the old hardcoded sample data modelled.
 */

export type TourType = '360_image' | '360_video' | '3d_model' | 'embed';
export type TourStatus = 'draft' | 'published' | 'archived';

export type HotspotType = 'info' | 'link' | 'audio' | 'video' | 'image' | 'effect';

export type VirtualTourHotspot = {
  id: number;
  virtualTourId: number;
  /** Vertical angle in degrees (look up/down). */
  pitch: number | null;
  /** Horizontal angle in degrees (compass heading). */
  yaw: number | null;
  type: HotspotType;
  title: string | null;
  description: string | null;
  icon: string | null;
  actionUrl: string | null;
  actionImageUrl: string | null;
  color: string | null;
  size: number | null;
  order: number;
};

export type VirtualTour = {
  id: number;
  title: string;
  description: string;
  location: string;
  tourType: TourType;
  embedUrl: string | null;
  image360Url: string | null;
  video360Url: string | null;
  model3dUrl: string | null;
  status: TourStatus;
  isPublished: boolean;
  isArchived: boolean;
  impressions: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
  user?: { id: number; fullName: string; email: string };
  hotspots: VirtualTourHotspot[];
  _count?: { hotspots: number; audioRegions: number; effects: number };
};

export type VirtualToursResponse = {
  data: VirtualTour[];
  meta: { total: number; skip: number; limit: number; hasMore: boolean };
};

export type VirtualTourFilters = {
  skip?: number;
  limit?: number;
  search?: string;
  tourType?: TourType;
  isPublished?: boolean;
};

/** The media URL a tour should render, whichever type it is. */
export function tourMediaUrl(tour: VirtualTour): string | null {
  switch (tour.tourType) {
    case '360_image':
      return tour.image360Url;
    case '360_video':
      return tour.video360Url;
    case '3d_model':
      return tour.model3dUrl;
    case 'embed':
      return tour.embedUrl;
    default:
      return null;
  }
}

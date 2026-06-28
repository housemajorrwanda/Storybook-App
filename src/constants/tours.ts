import type { VirtualTour } from '@/types/tour';

/**
 * Memorial virtual tours.
 *
 * The `panorama`/`cover` URLs below are working SAMPLE equirectangular images so
 * the feature runs out of the box. REPLACE them with real 360° photos of the
 * memorial sites (host them on Cloudinary like the rest of the app's media).
 * A panorama must be an equirectangular image with a 2:1 width:height ratio.
 *
 * Hotspot pitch/yaw are in degrees: yaw = compass heading (0 = forward),
 * pitch = up/down (0 = horizon). Tweak per image so hotspots land on doorways.
 */
export const VIRTUAL_TOURS: VirtualTour[] = [
  {
    id: 'kigali',
    name: 'Kigali Genocide Memorial',
    description:
      'The resting place of more than 250,000 victims. Walk through the memorial gardens and halls of remembrance.',
    location: 'Gisozi, Kigali',
    cover: 'https://pannellum.org/images/cerro-toco-0.jpg',
    firstSceneId: 'gardens',
    scenes: [
      {
        id: 'gardens',
        title: 'Memorial Gardens',
        panorama: 'https://pannellum.org/images/cerro-toco-0.jpg',
        initialYaw: 0,
        hotspots: [
          { pitch: -5, yaw: 90, targetSceneId: 'hall', label: 'Enter Hall of Remembrance' },
        ],
      },
      {
        id: 'hall',
        title: 'Hall of Remembrance',
        panorama: 'https://pannellum.org/images/alma.jpg',
        initialYaw: 0,
        hotspots: [
          { pitch: -5, yaw: -90, targetSceneId: 'gardens', label: 'Back to Gardens' },
        ],
      },
    ],
  },
  {
    id: 'nyamata',
    name: 'Nyamata Church Memorial',
    description:
      'A former church where thousands sought refuge. Preserved as a site of memory and testimony.',
    location: 'Nyamata, Bugesera',
    cover: 'https://pannellum.org/images/from-tree.jpg',
    firstSceneId: 'grounds',
    scenes: [
      {
        id: 'grounds',
        title: 'Church Grounds',
        panorama: 'https://pannellum.org/images/from-tree.jpg',
        initialYaw: 0,
      },
    ],
  },
];

export function getTourById(id: string): VirtualTour | undefined {
  return VIRTUAL_TOURS.find(t => t.id === id);
}

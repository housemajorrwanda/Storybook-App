import { useWindowDimensions } from 'react-native';

import { MaxContentWidth } from '@/constants/theme';

/**
 * Reference width (iPhone 13/14 logical width). Moderate scaling is keyed off this
 * so layouts grow on tablets and shrink gracefully on small phones — without the
 * runaway sizing that pure linear scaling produces.
 */
const GUIDELINE_BASE_WIDTH = 390;

export type Breakpoint = 'sm' | 'md' | 'lg';

export type Responsive = {
  /** Live window width in dp. */
  width: number;
  /** Live window height in dp. */
  height: number;
  /** true when the device is in landscape. */
  isLandscape: boolean;
  /** true for tablets / large screens (>= 600dp). */
  isTablet: boolean;
  /** true for small phones (< 360dp), e.g. older/compact Androids. */
  isSmall: boolean;
  /** Coarse breakpoint bucket. */
  breakpoint: Breakpoint;
  /** Width content should be capped to, centered on big screens. */
  contentWidth: number;
  /** Horizontal margin needed to center capped content. */
  sideGutter: number;
  /**
   * Moderately scale a size relative to the reference width. `factor` (0–1)
   * controls how strongly it tracks the screen; 0.5 is a good default.
   */
  scale: (size: number, factor?: number) => number;
  /** Scale a font size with a tighter factor and rounding for crisp text. */
  font: (size: number) => number;
};

export function useResponsive(): Responsive {
  const { width, height } = useWindowDimensions();

  const isLandscape = width > height;
  const shortest = Math.min(width, height);
  const isTablet = shortest >= 600;
  const isSmall = shortest < 360;

  const breakpoint: Breakpoint = isTablet ? 'lg' : shortest >= 390 ? 'md' : 'sm';

  const contentWidth = Math.min(width, MaxContentWidth);
  const sideGutter = Math.max(0, (width - contentWidth) / 2);

  const scale = (size: number, factor = 0.5) => {
    const linear = (shortest / GUIDELINE_BASE_WIDTH) * size;
    return size + (linear - size) * factor;
  };

  const font = (size: number) => Math.round(scale(size, 0.35));

  return {
    width,
    height,
    isLandscape,
    isTablet,
    isSmall,
    breakpoint,
    contentWidth,
    sideGutter,
    scale,
    font,
  };
}

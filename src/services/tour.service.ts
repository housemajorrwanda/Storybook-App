import api from './api';
import type { VirtualTour, VirtualTourFilters, VirtualToursResponse } from '@/types/tour';

export const tourService = {
  /** Published tours for the public listing. */
  getTours: async (filters: VirtualTourFilters = {}): Promise<VirtualToursResponse> => {
    const { data } = await api.get<VirtualToursResponse>('/virtual-tours', {
      params: { isPublished: true, limit: 20, ...filters },
    });
    return data;
  },

  getTourById: async (id: number): Promise<VirtualTour> => {
    const { data } = await api.get<VirtualTour>(`/virtual-tours/${id}`);
    return data;
  },

  /**
   * Records a view. Deliberately swallows failures — a analytics ping must never
   * stop someone from seeing the tour they opened.
   */
  incrementViewCount: async (id: number): Promise<void> => {
    try {
      await api.post(`/virtual-tours/${id}/view`);
    } catch {
      // ignored on purpose
    }
  },
};

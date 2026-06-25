import api from './api';
import type {
  Testimony,
  TestimoniesResponse,
  TestimonyFilters,
  TrendingTestimony,
} from '@/types/testimony';

const FEED_LIMIT = 10;

export const testimonyService = {
  getTestimonies: async (filters: TestimonyFilters = {}): Promise<TestimoniesResponse> => {
    const { data } = await api.get<TestimoniesResponse>('/testimonies', {
      params: {
        status: 'approved',
        isPublished: true,
        limit: FEED_LIMIT,
        sort: 'createdAt',
        order: 'desc',
        ...filters,
      },
    });
    return data;
  },

  getTrending: async (limit = 5): Promise<TrendingTestimony[]> => {
    const { data } = await api.get<TrendingTestimony[]>('/testimonies/trending', {
      params: { limit },
    });
    return data;
  },

  getById: async (id: number): Promise<Testimony> => {
    const { data } = await api.get<Testimony>(`/testimonies/${id}`);
    return data;
  },

  search: async (query: string, skip = 0): Promise<TestimoniesResponse> => {
    const { data } = await api.get<TestimoniesResponse>('/testimonies', {
      params: {
        status: 'approved',
        isPublished: true,
        search: query,
        limit: FEED_LIMIT,
        skip,
      },
    });
    return data;
  },

  getMyTestimonies: async (): Promise<Testimony[]> => {
    const { data } = await api.get<Testimony[]>('/testimonies/my-testimonies');
    return data;
  },

  getBookmarks: async (): Promise<Testimony[]> => {
    const { data } = await api.get<Testimony[]>('/testimonies/bookmarks');
    return data;
  },

  addBookmark: async (id: number): Promise<void> => {
    await api.post(`/testimonies/${id}/bookmark`);
  },

  removeBookmark: async (id: number): Promise<void> => {
    await api.delete(`/testimonies/${id}/bookmark`);
  },
};

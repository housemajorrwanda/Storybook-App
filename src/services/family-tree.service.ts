import api, { toArray } from './api';
import type { FamilyTree, FamilyTreesResponse } from '@/types/family-tree';

export const familyTreeService = {
  /** Public trees anyone can browse. */
  getPublicTrees: async (
    params: { skip?: number; limit?: number; search?: string } = {},
  ): Promise<FamilyTreesResponse> => {
    const { data } = await api.get<FamilyTreesResponse>('/family-trees/public', {
      params: { limit: 20, ...params },
    });
    return data;
  },

  getPublicTreeById: async (id: number): Promise<FamilyTree> => {
    const { data } = await api.get<FamilyTree>(`/family-trees/public/${id}`);
    return data;
  },

  /** Trees belonging to the signed-in user. Returns a bare array, not a page. */
  getMyTrees: async (): Promise<FamilyTree[]> => {
    const { data } = await api.get<FamilyTree[] | { data: FamilyTree[] }>('/family-trees/my');
    return toArray(data);
  },

  getTreeById: async (id: number): Promise<FamilyTree> => {
    const { data } = await api.get<FamilyTree>(`/family-trees/${id}`);
    return data;
  },
};

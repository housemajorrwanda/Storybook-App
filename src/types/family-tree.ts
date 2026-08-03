/**
 * Mirrors the API's family-tree contract (see the web client's
 * src/types/family-tree.ts). Note the endpoint is `/family-trees` — plural.
 */

export type RelationType = 'parent' | 'spouse' | 'sibling' | 'child';
export type Gender = 'male' | 'female' | 'other' | 'unknown';

export type FamilyMemberTestimony = {
  id: number;
  eventTitle: string;
  fullName: string | null;
};

export type FamilyMember = {
  id: number;
  name: string;
  photoUrl: string | null;
  photoUrls: string[];
  birthDate: string | null;
  deathDate: string | null;
  bio: string | null;
  gender: Gender | null;
  isAlive: boolean;
  district: string | null;
  sector: string | null;
  cell: string | null;
  village: string | null;
  testimonyId: number | null;
  testimony: FamilyMemberTestimony | null;
  createdAt: string;
  updatedAt: string;
};

export type FamilyRelation = {
  id: number;
  fromMemberId: number;
  toMemberId: number;
  relationType: RelationType;
  createdAt: string;
};

export type FamilyTreeOwner = {
  id: number;
  fullName: string | null;
  avatar: string | null;
};

export type FamilyTree = {
  id: number;
  title: string;
  description: string | null;
  isPublic: boolean;
  userId: number;
  user: FamilyTreeOwner;
  members: FamilyMember[];
  relations: FamilyRelation[];
  createdAt: string;
  updatedAt: string;
  _count?: { members: number; relations: number };
};

export type FamilyTreesResponse = {
  data: FamilyTree[];
  meta: { total: number; skip: number; limit: number };
};

/** Where a member lived, collapsed to a single readable line. */
export function memberPlace(member: FamilyMember): string | null {
  const parts = [member.village, member.cell, member.sector, member.district].filter(Boolean);
  return parts.length ? parts.join(', ') : null;
}

/** "1961 – 1994", "b. 1961", or null when no dates are recorded. */
export function memberLifespan(member: FamilyMember): string | null {
  const year = (value: string | null) => (value ? new Date(value).getFullYear() : null);
  const born = year(member.birthDate);
  const died = year(member.deathDate);

  if (born && died) return `${born} – ${died}`;
  if (born) return member.isAlive ? `b. ${born}` : `b. ${born}`;
  if (died) return `d. ${died}`;
  return null;
}

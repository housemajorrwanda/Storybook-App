export type SubmissionType = 'written' | 'audio' | 'video';
export type IdentityPreference = 'public' | 'anonymous';
export type TestimonyStatus = 'pending' | 'approved' | 'rejected';

export type TestimonyImage = {
  id?: number;
  imageUrl: string;
  imageFileName: string;
  description?: string;
  order: number;
};

export type RelativeType = {
  id: number;
  slug: string;
  displayName: string;
};

export type Relative = {
  id: number;
  personName: string;
  notes?: string;
  order: number;
  relativeType: RelativeType;
};

export type TestimonyAuthor = {
  id: string;
  fullName: string;
  email: string;
  residentPlace?: string | null;
};

export type TestimonyConnection = {
  id: number;
  eventTitle: string;
  eventDescription?: string;
  summary?: string;
  location?: string;
  submissionType: SubmissionType;
  createdAt: string;
  images: TestimonyImage[];
};

export type Testimony = {
  id: number;
  submissionType: SubmissionType;
  identityPreference: IdentityPreference;
  fullName: string;
  relationToEvent?: string;
  location?: string;
  eventTitle: string;
  eventDescription?: string;
  dateOfEventFrom?: string;
  dateOfEventTo?: string;
  fullTestimony?: string;
  audioUrl?: string;
  audioFileName?: string;
  audioDuration?: number;
  videoUrl?: string;
  videoFileName?: string;
  videoDuration?: number;
  images: TestimonyImage[];
  relatives?: Relative[];
  transcript?: string;
  summary?: string;
  keyPhrases?: string[];
  status: TestimonyStatus;
  isPublished: boolean;
  impressions: number;
  isDraft?: boolean;
  userId?: string;
  user?: TestimonyAuthor | null;
  adminFeedback?: string;
  connections?: TestimonyConnection[];
  createdAt: string;
  updatedAt: string;
};

export type TestimoniesResponse = {
  data: Testimony[];
  meta: {
    skip: number;
    limit: number;
    total: number;
    sort?: string;
    order?: string;
  };
};

export type TrendingTestimony = {
  id: number;
  eventTitle: string;
  eventDescription?: string;
  summary?: string;
  location?: string;
  submissionType: SubmissionType;
  impressions: number;
  connectionsCount: number;
  createdAt: string;
  images: { imageUrl: string; description?: string }[];
  user: { fullName: string } | null;
};

export type TestimonyFilters = {
  skip?: number;
  limit?: number;
  search?: string;
  submissionType?: SubmissionType;
  sort?: string;
  order?: 'asc' | 'desc';
};

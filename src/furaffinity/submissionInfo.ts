export type ContentType = 'image/jpeg' | 'image/png' | 'image/gif' | 'video/mp4';

export type SubmissionInfo = {
  url: string;
  title: string;
  description: string;
  viewCount: number;
  commentCount: number;
  faveCount: number;
  imageUrl: string;
  contentType: ContentType;
  sizeBytes: number;
  thumbnailUrl: string;
};

export type SubmissionResult =
  | { type: 'image'; info: SubmissionInfo }
  | { type: 'flash' }
  | { type: 'notFound' }
  | { type: 'serverError' }
  | { type: 'unauthenticated' }
  | { type: 'blocked' };

export type ContentType = 'image/jpeg' | 'image/png' | 'image/gif' | 'video/mp4';

export type AudioContentType = 'audio/mpeg' | 'audio/ogg' | 'audio/wav' | 'audio/flac' | 'audio/mp4';

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
  artistName: string;
  artistUrl: string;
};

export type StoryInfo = {
  url: string;
  title: string;
  description: string;
  viewCount: number;
  commentCount: number;
  faveCount: number;
  thumbnailUrl: string;
  artistName: string;
  artistUrl: string;
  excerpt: string | null;
};

export type MusicInfo = {
  url: string;
  title: string;
  description: string;
  viewCount: number;
  commentCount: number;
  faveCount: number;
  thumbnailUrl: string;
  artistName: string;
  artistUrl: string;
  audioUrl: string;
  audioContentType: AudioContentType;
  audioSizeBytes: number;
};

export type SubmissionResult =
  | { type: 'image'; info: SubmissionInfo }
  | { type: 'story'; info: StoryInfo }
  | { type: 'music'; info: MusicInfo }
  | { type: 'flash' }
  | { type: 'notFound' }
  | { type: 'serverError' }
  | { type: 'unauthenticated' }
  | { type: 'blocked' };

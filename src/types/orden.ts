export type WorshipSlideType = 'slide' | 'hymn' | 'bible-reading' | 'user-song';
export type Posture = 'standing' | 'sitting';
export type ReadingFlow = 'pulpit' | 'congregation' | 'together' | 'antiphonal';
export interface WorshipSlide {
  id: string;
  type: WorshipSlideType;
  title?: string;
  subtitle?: string;
  posture?: Posture;
  hymnNumber?: number;
  userSongId?: string;
  bookId?: string;
  chapter?: number;
  startVerse?: number;
  endVerse?: number;
  readingFlow?: ReadingFlow;
}

export interface WorshipOrder {
  id: string;
  title: string;
  slides: WorshipSlide[];
  createdAt: number;
  updatedAt: number;
  isPublic?: boolean;
  churchId?: string;
  authorId?: string;
  authorName?: string;
  cloudId?: string;
  isReadOnly?: boolean;
  date?: string;
  startTime?: string;
  endTime?: string;
  description?: string;
}

export interface Church {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  adminIds: string[];
  memberIds: string[];
  createdAt: number;
}

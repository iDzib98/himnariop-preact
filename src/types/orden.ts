export type WorshipSlideType = 'slide' | 'hymn' | 'bible-reading';
export type Posture = 'standing' | 'sitting';
export type ReadingFlow = 'pulpit' | 'congregation' | 'together' | 'antiphonal';

export interface WorshipSlide {
  id: string;
  type: WorshipSlideType;
  title?: string;
  subtitle?: string;
  posture?: Posture;
  hymnNumber?: number;
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
}

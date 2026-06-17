export interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  notes?: string;
  attended: boolean;
  arrivalTime?: string;
  experienceNote?: string;
}

export type MeetingDraft = Omit<Meeting, 'id' | 'attended'> & {
  attended?: boolean;
};

import { Meeting } from './meeting.model';
import { Reflection } from './reflection.model';

export type ThemePreference = 'light' | 'dark';

export interface AppData {
  meetings: Meeting[];
  reflections: Reflection[];
  theme: ThemePreference;
}

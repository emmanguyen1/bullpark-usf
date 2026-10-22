import { PermitType } from '../campus/campus.types';
import { ClassSession, UserCommutePreferences } from '../schedule/schedule.types';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  studentId?: string;
  major?: string;
  permitType: PermitType;
  commutePreferences: UserCommutePreferences;
  schedule: ClassSession[];
  pinnedCarLotId: string | null;
  pinnedCarTimestamp: string | null;
  favoriteBuildingCodes: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserRegistrationInput {
  email: string;
  password?: string;
  name: string;
  studentId?: string;
  major?: string;
  permitType?: PermitType;
  commutePreferences?: Partial<UserCommutePreferences>;
}

export interface UserLoginInput {
  email: string;
  password?: string;
}

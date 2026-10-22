import fs from 'fs';
import path from 'path';
import { UserProfile, UserRegistrationInput, UserLoginInput } from './user.types';
import { PermitType } from '../campus/campus.types';
import { ClassSession, UserCommutePreferences } from '../schedule/schedule.types';
import { SCHEDULE_PRESETS } from '../schedule/schedule.service';

const DATA_DIR = path.resolve(__dirname, '../../../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

const DEFAULT_PREFERENCES: UserCommutePreferences = {
  targetArrivalBufferMinutes: 10,
  walkingPace: 'normal',
  commuteDriveMinutes: 15,
  departureOriginName: 'Off-Campus Residence (Fowler Ave)',
  prioritizeCoveredIfRain: true
};

const INITIAL_DEMO_USERS: Record<string, UserProfile & { passwordHash?: string }> = {
  'user-rocky': {
    id: 'user-rocky',
    email: 'rocky@usf.edu',
    name: 'Rocky the Bull',
    studentId: 'U12345678',
    major: 'Finance (Muma College of Business)',
    permitType: 'S',
    commutePreferences: {
      targetArrivalBufferMinutes: 12,
      walkingPace: 'normal',
      commuteDriveMinutes: 15,
      departureOriginName: 'The Ivy Apartments (42nd St)',
      prioritizeCoveredIfRain: true
    },
    schedule: [...SCHEDULE_PRESETS.business_finance.courses],
    pinnedCarLotId: 'lot-beard-garage',
    pinnedCarTimestamp: new Date().toISOString(),
    favoriteBuildingCodes: ['BSN', 'LIB', 'MSC'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    passwordHash: 'gobulls2026'
  },
  'user-stem': {
    id: 'user-stem',
    email: 'engineer@usf.edu',
    name: 'Alex Rivera',
    studentId: 'U87654321',
    major: 'Computer Science (College of Engineering)',
    permitType: 'S',
    commutePreferences: {
      targetArrivalBufferMinutes: 10,
      walkingPace: 'brisk',
      commuteDriveMinutes: 20,
      departureOriginName: 'Avalon Heights (Fowler Ave)',
      prioritizeCoveredIfRain: true
    },
    schedule: [...SCHEDULE_PRESETS.cs_engineering.courses],
    pinnedCarLotId: 'lot-collins-garage',
    pinnedCarTimestamp: new Date().toISOString(),
    favoriteBuildingCodes: ['ENG', 'ENB', 'CIS', 'LIB'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    passwordHash: 'gobulls2026'
  }
};

export class UserService {
  private users: Map<string, UserProfile & { passwordHash?: string }> = new Map();

  constructor() {
    this.loadUsers();
  }

  private loadUsers() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(USERS_FILE)) {
        const raw = fs.readFileSync(USERS_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        for (const [id, u] of Object.entries(parsed)) {
          this.users.set(id, u as any);
        }
      } else {
        for (const [id, u] of Object.entries(INITIAL_DEMO_USERS)) {
          this.users.set(id, u);
        }
        this.saveUsers();
      }
    } catch (err) {
      console.warn('Could not load users from disk, using in-memory store:', err);
      for (const [id, u] of Object.entries(INITIAL_DEMO_USERS)) {
        this.users.set(id, u);
      }
    }
  }

  private saveUsers() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const data: Record<string, any> = {};
      for (const [id, user] of this.users.entries()) {
        data[id] = user;
      }
      fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.warn('Could not persist users to disk:', err);
    }
  }

  private sanitizeUser(user: UserProfile & { passwordHash?: string }): UserProfile {
    const { passwordHash, ...safe } = user;
    return safe;
  }

  register(input: UserRegistrationInput): UserProfile {
    const existing = Array.from(this.users.values()).find(
      (u) => u.email.toLowerCase() === input.email.toLowerCase()
    );
    if (existing) {
      throw new Error(`An account with email ${input.email} already exists. Please sign in.`);
    }

    const id = `user-${Date.now()}`;
    const now = new Date().toISOString();

    const newUser: UserProfile & { passwordHash?: string } = {
      id,
      email: input.email.toLowerCase(),
      name: input.name,
      studentId: input.studentId || `U${Math.floor(10000000 + Math.random() * 90000000)}`,
      major: input.major || 'Undergraduate Student',
      permitType: input.permitType || 'S',
      commutePreferences: {
        ...DEFAULT_PREFERENCES,
        ...(input.commutePreferences || {})
      },
      schedule: [...SCHEDULE_PRESETS.business_finance.courses],
      pinnedCarLotId: null,
      pinnedCarTimestamp: null,
      favoriteBuildingCodes: ['BSN', 'LIB'],
      createdAt: now,
      updatedAt: now,
      passwordHash: input.password || 'gobulls2026'
    };

    this.users.set(id, newUser);
    this.saveUsers();
    return this.sanitizeUser(newUser);
  }

  login(input: UserLoginInput): UserProfile {
    const emailNorm = input.email.toLowerCase().trim();
    const user = Array.from(this.users.values()).find(
      (u) => u.email.toLowerCase() === emailNorm
    );

    if (!user) {
      throw new Error('Account not found. Please check your email or create a new account.');
    }

    if (input.password && user.passwordHash && user.passwordHash !== input.password) {
      throw new Error('Incorrect password. For demo accounts, use password "gobulls2026".');
    }

    return this.sanitizeUser(user);
  }

  getUserById(id: string): UserProfile | null {
    const user = this.users.get(id);
    return user ? this.sanitizeUser(user) : null;
  }

  updateProfile(id: string, updates: Partial<UserProfile>): UserProfile {
    const user = this.users.get(id);
    if (!user) throw new Error('User not found');

    const updated: UserProfile & { passwordHash?: string } = {
      ...user,
      ...updates,
      id: user.id, // prevent overwriting ID
      updatedAt: new Date().toISOString()
    };

    this.users.set(id, updated);
    this.saveUsers();
    return this.sanitizeUser(updated);
  }

  saveSchedule(id: string, schedule: ClassSession[]): UserProfile {
    const user = this.users.get(id);
    if (!user) throw new Error('User not found');

    user.schedule = schedule;
    user.updatedAt = new Date().toISOString();
    this.users.set(id, user);
    this.saveUsers();
    return this.sanitizeUser(user);
  }

  savePermit(id: string, permitType: PermitType): UserProfile {
    const user = this.users.get(id);
    if (!user) throw new Error('User not found');

    user.permitType = permitType;
    user.updatedAt = new Date().toISOString();
    this.users.set(id, user);
    this.saveUsers();
    return this.sanitizeUser(user);
  }

  savePinnedCar(id: string, lotId: string | null): UserProfile {
    const user = this.users.get(id);
    if (!user) throw new Error('User not found');

    user.pinnedCarLotId = lotId;
    user.pinnedCarTimestamp = lotId ? new Date().toISOString() : null;
    user.updatedAt = new Date().toISOString();
    this.users.set(id, user);
    this.saveUsers();
    return this.sanitizeUser(user);
  }

  savePreferences(id: string, preferences: Partial<UserCommutePreferences>): UserProfile {
    const user = this.users.get(id);
    if (!user) throw new Error('User not found');

    user.commutePreferences = {
      ...user.commutePreferences,
      ...preferences
    };
    user.updatedAt = new Date().toISOString();
    this.users.set(id, user);
    this.saveUsers();
    return this.sanitizeUser(user);
  }

  getAllDemoUsers(): UserProfile[] {
    return Array.from(this.users.values()).map((u) => this.sanitizeUser(u));
  }
}

export const userService = new UserService();

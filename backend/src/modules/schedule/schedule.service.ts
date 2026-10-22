import { campusService } from '../campus/campus.service';
import { routingService } from '../routing/routing.service';
import { occupancyService } from '../occupancy/occupancy.service';
import { weatherService } from '../weather-sweat/weather.service';
import { PermitType } from '../campus/campus.types';
import {
  ClassSession,
  SmartDeparturePlan,
  UserCommutePreferences,
  ClassTransition,
  DayItineraryClass
} from './schedule.types';
import {
  estimateCampusWalkingDistanceMeters,
  calculateWalkingTimeMinutes
} from '../routing/distance.util';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const XLSX = require('xlsx');
let PDFParse: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pdfModule = require('pdf-parse');
  PDFParse = pdfModule.PDFParse || pdfModule.default || pdfModule;
} catch {
  // safe fallback
}

export const SCHEDULE_PRESETS: Record<string, { label: string; courses: ClassSession[] }> = {
  cs_engineering: {
    label: 'Computer Science & Engineering',
    courses: [
      {
        id: 'cs-1',
        courseCode: 'COP 4530',
        courseName: 'Data Structures & Algorithms',
        buildingCode: 'ENG',
        room: '104',
        daysOfWeek: [1, 3], // Mon / Wed
        startTime: '11:00',
        endTime: '12:15'
      },
      {
        id: 'cs-2',
        courseCode: 'CDA 3103',
        courseName: 'Computer Organization',
        buildingCode: 'CIS',
        room: '202',
        daysOfWeek: [1, 3],
        startTime: '14:00',
        endTime: '15:15'
      },
      {
        id: 'cs-3',
        courseCode: 'PHY 2049',
        courseName: 'General Physics II',
        buildingCode: 'PHY',
        room: '118',
        daysOfWeek: [2, 4], // Tue / Thu
        startTime: '09:30',
        endTime: '10:45'
      },
      {
        id: 'cs-4',
        courseCode: 'ENC 1102',
        courseName: 'Composition & Technical Writing',
        buildingCode: 'CPR',
        room: '202',
        daysOfWeek: [2, 4],
        startTime: '17:45', // Evening class testing After-5:30 PM rule
        endTime: '19:00'
      }
    ]
  },
  business_finance: {
    label: 'Muma College of Business',
    courses: [
      {
        id: 'bus-1',
        courseCode: 'FIN 3403',
        courseName: 'Principles of Finance',
        buildingCode: 'BSN',
        room: '1201',
        daysOfWeek: [1, 2, 3, 4],
        startTime: '11:00',
        endTime: '12:15'
      },
      {
        id: 'bus-2',
        courseCode: 'ACG 2021',
        courseName: 'Financial Accounting',
        buildingCode: 'BSN',
        room: '1402',
        daysOfWeek: [1, 3],
        startTime: '14:00',
        endTime: '15:15'
      },
      {
        id: 'bus-3',
        courseCode: 'MAR 3023',
        courseName: 'Basic Marketing',
        buildingCode: 'BSN',
        room: '2100',
        daysOfWeek: [2, 4],
        startTime: '12:30',
        endTime: '13:45'
      }
    ]
  },
  pre_med_stem: {
    label: 'Pre-Med & Biomedical Sciences',
    courses: [
      {
        id: 'med-1',
        courseCode: 'CHM 2045',
        courseName: 'General Chemistry I',
        buildingCode: 'CHE',
        room: '100',
        daysOfWeek: [1, 3, 5],
        startTime: '09:00',
        endTime: '09:50'
      },
      {
        id: 'med-2',
        courseCode: 'BSC 2010',
        courseName: 'Cellular Processes Biology',
        buildingCode: 'ISA',
        room: '1051',
        daysOfWeek: [2, 4],
        startTime: '11:00',
        endTime: '12:15'
      },
      {
        id: 'med-3',
        courseCode: 'BEH 2000',
        courseName: 'Behavioral Healthcare',
        buildingCode: 'BEH',
        room: '102',
        daysOfWeek: [2, 4],
        startTime: '14:00',
        endTime: '15:15'
      }
    ]
  },
  honors_liberal: {
    label: 'Honors & Liberal Arts',
    courses: [
      {
        id: 'hon-1',
        courseCode: 'IDH 2000',
        courseName: 'Acquisition of Knowledge',
        buildingCode: 'JPN',
        room: 'Honors Forum',
        daysOfWeek: [1, 3],
        startTime: '10:00',
        endTime: '11:15'
      },
      {
        id: 'hon-2',
        courseCode: 'AMH 2020',
        courseName: 'American History II',
        buildingCode: 'SOC',
        room: '150',
        daysOfWeek: [2, 4],
        startTime: '12:30',
        endTime: '13:45'
      },
      {
        id: 'hon-3',
        courseCode: 'PHI 2010',
        courseName: 'Introduction to Philosophy',
        buildingCode: 'CPR',
        room: '304',
        daysOfWeek: [1, 3],
        startTime: '15:30',
        endTime: '16:45'
      }
    ]
  }
};

export class ScheduleService {
  private studentClasses: ClassSession[] = [...SCHEDULE_PRESETS.business_finance.courses];

  private userPreferences: UserCommutePreferences = {
    targetArrivalBufferMinutes: 10,
    walkingPace: 'normal',
    commuteDriveMinutes: 15,
    departureOriginName: 'Off-Campus Residence (Fowler Ave)',
    prioritizeCoveredIfRain: true
  };

  getSchedule(): ClassSession[] {
    return this.studentClasses;
  }

  setSchedule(classes: ClassSession[]): ClassSession[] {
    this.studentClasses = classes;
    return this.studentClasses;
  }

  getPreferences(): UserCommutePreferences {
    return { ...this.userPreferences };
  }

  setPreferences(pref: Partial<UserCommutePreferences>): UserCommutePreferences {
    this.userPreferences = {
      ...this.userPreferences,
      ...pref
    };
    return this.getPreferences();
  }

  addClass(course: Omit<ClassSession, 'id'> & { id?: string }): ClassSession {
    const id = course.id || `course-${Date.now()}`;
    const newCourse: ClassSession = { ...course, id };
    this.studentClasses.push(newCourse);
    return newCourse;
  }

  removeClass(id: string): boolean {
    const initialLen = this.studentClasses.length;
    this.studentClasses = this.studentClasses.filter((c) => c.id !== id);
    return this.studentClasses.length < initialLen;
  }

  resetSchedule(presetKey: string = 'business_finance'): ClassSession[] {
    const preset = SCHEDULE_PRESETS[presetKey] || SCHEDULE_PRESETS.business_finance;
    this.studentClasses = [...preset.courses];
    return this.studentClasses;
  }

  getPresets(): Record<string, { label: string; courses: ClassSession[] }> {
    return SCHEDULE_PRESETS;
  }

  /**
   * Universal multi-format upload parser supporting:
   * - Spreadsheets (.xlsx, .xls, .csv, .tsv, .ods)
   * - Documents (.pdf, .txt, .docx, .rtf, .md)
   * - Calendars (.ics, .ical)
   * - Web pages (.html, .htm)
   * - Structured data (.json)
   * - Freeform text / Syllabi / OCR screenshots
   */
  async parseUpload(payload: {
    fileContent?: string;
    fileBase64?: string;
    fileName?: string;
    fileType?: string;
  }): Promise<{ courses: ClassSession[]; format: string }> {
    const fileName = (payload.fileName || '').toLowerCase();

    // 1. Handle Binary files passed as base64 (Excel .xlsx/.xls, PDF)
    if (payload.fileBase64) {
      try {
        const cleanBase64 = payload.fileBase64.replace(/^data:[^;]+;base64,/, '');
        const buffer = Buffer.from(cleanBase64, 'base64');

        // Case A: Excel spreadsheets (.xlsx, .xls, .ods)
        if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.ods')) {
          const wb = XLSX.read(buffer, { type: 'buffer' });
          if (wb.SheetNames.length > 0) {
            const sheet = wb.Sheets[wb.SheetNames[0]];
            const csv = XLSX.utils.sheet_to_csv(sheet);
            const courses = this.parseCSV(csv);
            if (courses.length > 0) {
              return { courses, format: 'excel' };
            }
          }
        }

        // Case B: PDF files (.pdf)
        if (fileName.endsWith('.pdf') || buffer.slice(0, 4).toString() === '%PDF') {
          if (PDFParse) {
            const parser = new PDFParse({ data: buffer });
            const result = await parser.getText();
            const pdfText = result?.text || '';
            const courses = this.extractCoursesFromText(pdfText);
            if (courses.length > 0) {
              return { courses, format: 'pdf' };
            }
          }
        }
      } catch (err: any) {
        console.warn('Binary file parse warning:', err.message);
      }
    }

    // 2. Handle Text-based content
    const raw = payload.fileContent || '';
    const trimmed = raw.trim();

    // Case C: JSON array or object
    if (trimmed.startsWith('[') || trimmed.startsWith('{') || fileName.endsWith('.json')) {
      try {
        const parsedJson = JSON.parse(trimmed);
        const list = Array.isArray(parsedJson) ? parsedJson : parsedJson.schedule || parsedJson.courses;
        if (Array.isArray(list) && list.length > 0) {
          this.studentClasses = list.map((item: any, idx: number) => ({
            id: item.id || `json-${Date.now()}-${idx}`,
            courseCode: item.courseCode || item.code || 'CLS 100',
            courseName: item.courseName || item.name || item.title || item.courseCode || 'Class',
            buildingCode: item.buildingCode || item.building || item.location || 'BSN',
            room: item.room || '101',
            daysOfWeek: Array.isArray(item.daysOfWeek) ? item.daysOfWeek : [1, 3],
            startTime: item.startTime || item.start || '11:00',
            endTime: item.endTime || item.end || '12:15'
          }));
          return { courses: this.studentClasses, format: 'json' };
        }
      } catch {
        // fallback
      }
    }

    // Case D: iCalendar / Canvas export (.ics, .ical)
    if (
      fileName.endsWith('.ics') ||
      fileName.endsWith('.ical') ||
      trimmed.includes('BEGIN:VCALENDAR') ||
      trimmed.includes('BEGIN:VEVENT')
    ) {
      const courses = this.parseICS(trimmed);
      return { courses, format: 'ics' };
    }

    // Case E: Web Page / HTML table (.html, .htm)
    if (fileName.endsWith('.html') || fileName.endsWith('.htm') || trimmed.includes('<html') || trimmed.includes('<table')) {
      const stripped = trimmed
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<\/tr>/gi, '\n')
        .replace(/<\/td>|<\/th>/gi, '\t')
        .replace(/<[^>]+>/g, ' ');
      const courses = this.extractCoursesFromText(stripped);
      if (courses.length > 0) {
        return { courses, format: 'html' };
      }
    }

    // Case F: Delimited CSV or TSV
    if (fileName.endsWith('.csv') || fileName.endsWith('.tsv') || (trimmed.includes(',') && trimmed.includes('\n'))) {
      const courses = this.parseCSV(trimmed);
      if (courses.length > 0) {
        return { courses, format: fileName.endsWith('.tsv') ? 'tsv' : 'csv' };
      }
    }

    // Case G: Freeform Text / Syllabi / OCR Screenshot Text / Plain text (.txt, .md, .rtf)
    const courses = this.extractCoursesFromText(trimmed);
    return { courses, format: payload.fileType === 'image_ocr' ? 'image_ocr' : 'text' };
  }

  /**
   * High-accuracy multi-line and block-aware extractor:
   * Accurately parses complex USF OASIS PDF exports (Student Detail Schedule & Concise Schedule),
   * Degree Works, Canvas exports, and unformatted syllabi.
   * Links course titles, course codes, buildings, rooms, meeting days, and times even when
   * split across multiple lines in PDF text streams.
   */
  extractCoursesFromText(text: string): ClassSession[] {
    const parsed: ClassSession[] = [];
    const allBuildings = campusService.getAllBuildings();

    const parseDays = (s: string): number[] => {
      const upper = s.trim().toUpperCase();
      const days = new Set<number>();
      if (/MON|MONDAY|\bM\b|M[TWRF]|MWF|M,W|MW/.test(upper)) days.add(1);
      if (/TUE|TUESDAY|\bT\b|TR\b|TTH\b|T,TH/.test(upper)) days.add(2);
      if (/WED|WEDNESDAY|\bW\b|MWF|M,W|W,F|MW/.test(upper)) days.add(3);
      if (/THU|THURSDAY|\bTH\b|\bR\b|TR\b|TTH\b|T,TH/.test(upper)) days.add(4);
      if (/FRI|FRIDAY|\bF\b|MWF|W,F/.test(upper)) days.add(5);
      if (/SAT|SATURDAY|\bSAT\b/.test(upper)) days.add(6);
      if (/SUN|SUNDAY|\bSUN\b|\bU\b/.test(upper)) days.add(0);
      if (days.size === 0) {
        if (upper.includes('M')) days.add(1);
        if (upper.includes('T')) days.add(2);
        if (upper.includes('W')) days.add(3);
        if (upper.includes('R') || upper.includes('TH')) days.add(4);
        if (upper.includes('F')) days.add(5);
      }
      return Array.from(days).sort();
    };

    const parseTime = (timeStr: string, defaultVal: string): string => {
      const match = timeStr.trim().toUpperCase().match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/);
      if (!match) return defaultVal;
      let h = parseInt(match[1], 10);
      const m = match[2] || '00';
      const ampm = match[3];
      if (ampm === 'PM' && h < 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;
      return `${String(h).padStart(2, '0')}:${m}`;
    };

    // Strict time range regex: requires colon or am/pm so it never falsely matches semester date ranges like "Aug 24, 2026 - Dec 04, 2026"
    const strictTimeRegex = /\b([0-1]?[0-9]:[0-5][0-9]\s*(?:am|pm)?|[0-1]?[0-9]\s*(?:am|pm))\s*(?:-|to|–)\s*([0-1]?[0-9]:[0-5][0-9]\s*(?:am|pm)?|[0-1]?[0-9]\s*(?:am|pm))\b/i;

    // STRATEGY 1: Contextual Block / Section Parsing (for OASIS Detail Schedule & multi-line PDFs)
    const lines = text.split(/\r\n|\n|\r/);
    const knownUSFPrefixes = new Set([
      'COP', 'CDA', 'CEN', 'CIS', 'COT', 'CAP', 'EGN', 'EEL', 'EIN', 'EMA', 'ECH', 'EML',
      'MAC', 'MAP', 'MAD', 'MAS', 'MGF', 'STA', 'CHM', 'CHS', 'PHY', 'PHZ', 'AST', 'BSC',
      'BOT', 'MCB', 'PCB', 'ZOO', 'BCH', 'BEH', 'FIN', 'ACG', 'TAX', 'BUL', 'GEB', 'MAN',
      'MAR', 'QMB', 'ISM', 'ECO', 'ECP', 'ENC', 'LIT', 'AML', 'CRW', 'LIN', 'SPN', 'FRE',
      'GER', 'ITA', 'JPN', 'CHI', 'RUS', 'LAT', 'GRE', 'AMH', 'WOH', 'EUH', 'ASH', 'LAH',
      'POS', 'POT', 'INR', 'CPO', 'PSY', 'CLP', 'DEP', 'EXP', 'INP', 'SOP', 'SYG', 'SYA',
      'SYO', 'SYP', 'ANT', 'CCJ', 'CJC', 'CJE', 'CJJ', 'CJL', 'EDF', 'EDG', 'EME', 'TSL',
      'MUE', 'MUT', 'MVB', 'MVJ', 'MVK', 'MVO', 'MVP', 'MVS', 'MVV', 'MVW', 'ART', 'ARH',
      'GRA', 'PGY', 'THE', 'TPA', 'TPP', 'NUR', 'HSC', 'PHC', 'SPA', 'PHT'
    ]);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Look for course prefix + 4-digit number e.g. "COP 4530" or "FIN 3403"
      const match = line.match(/\b([A-Z]{3})\s*[-–]?\s*([0-9]{4}[A-Z]?)\b/i);
      if (!match) continue;

      const prefix = match[1].toUpperCase();
      const num = match[2].toUpperCase();
      const courseCode = `${prefix} ${num}`;

      // Check whether this match is likely a building + room rather than course code (e.g. "BSN 1201")
      const isKnownPrefix = knownUSFPrefixes.has(prefix);
      const isBuildingCode = allBuildings.some((b) => b.code === prefix);
      if (isBuildingCode && !isKnownPrefix) {
        continue; // Skip building/room matches falsely shaped like course codes
      }

      // Extract window of lines around this course (from 1 line before until next course or 12 lines after)
      const windowStart = Math.max(0, i - 1);
      let windowEnd = Math.min(lines.length, i + 12);
      for (let j = i + 1; j < windowEnd; j++) {
        const nextCourseMatch = lines[j].match(/\b([A-Z]{3})\s*[-–]?\s*([0-9]{4}[A-Z]?)\b/i);
        if (nextCourseMatch && knownUSFPrefixes.has(nextCourseMatch[1].toUpperCase())) {
          windowEnd = j;
          break;
        }
      }
      const windowLines = lines.slice(windowStart, windowEnd);
      const windowText = windowLines.join('\n');

      // Check for valid class time in this window
      const timeMatch = windowText.match(strictTimeRegex);
      if (!timeMatch) continue;

      const startTime = parseTime(timeMatch[1], '11:00');
      const endTime = parseTime(timeMatch[2], '12:15');

      // Find meeting days within the block
      const daysMatch = windowText.match(/\b(MWF|TR|TTH|M,W|W,F|Mon,?\s*Wed|Tue,?\s*Thu|Monday|Tuesday|Wednesday|Thursday|Friday|MW)\b/i);
      const days = daysMatch ? parseDays(daysMatch[1]) : [1, 3];

      // Robust Building & Room extraction with USF aliases
      const buildingSearchList: Array<{ searchCode: string; canonicalCode: string }> = [];
      allBuildings.forEach((b) => buildingSearchList.push({ searchCode: b.code, canonicalCode: b.code }));
      buildingSearchList.push(
        { searchCode: 'JPN', canonicalCode: 'HON' },
        { searchCode: 'ENA', canonicalCode: 'ENG' },
        { searchCode: 'KMI', canonicalCode: 'ENG' },
        { searchCode: 'CMC', canonicalCode: 'CIS' },
        { searchCode: 'SCN', canonicalCode: 'SCA' },
        { searchCode: 'BSN2', canonicalCode: 'BSN' },
        { searchCode: 'EDC', canonicalCode: 'EDU' },
        { searchCode: 'TAT', canonicalCode: 'TAR' },
        { searchCode: 'THE', canonicalCode: 'TAR' }
      );

      let buildingCode = 'BSN';
      let room = '101';
      let foundLocation = false;

      // 1. Prioritize lines explicitly designating location (e.g. "Where: ENB 109")
      const whereLine = windowLines.find((l) => /(?:where|location|bldg|building):/i.test(l));
      if (whereLine) {
        for (const item of buildingSearchList) {
          const locMatch = whereLine.match(new RegExp(`\\b${item.searchCode}\\b(?:\\s*(?:room|rm|#)?\\s*([0-9]{3,4}[A-Z]?))?`, 'i'));
          if (locMatch) {
            buildingCode = item.canonicalCode;
            if (locMatch[1]) room = locMatch[1];
            foundLocation = true;
            break;
          }
        }
      }

      // 2. Look for building code immediately paired with room number (e.g. "ENB 109")
      if (!foundLocation) {
        for (const item of buildingSearchList) {
          const bldgRoomMatch = windowText.match(new RegExp(`\\b${item.searchCode}\\s+([0-9]{3,4}[A-Z]?)\\b`, 'i'));
          if (bldgRoomMatch) {
            buildingCode = item.canonicalCode;
            room = bldgRoomMatch[1];
            foundLocation = true;
            break;
          }
        }
      }

      // 3. Fallback: match standalone building code and search for room token
      if (!foundLocation) {
        for (const item of buildingSearchList) {
          if (new RegExp(`\\b${item.searchCode}\\b`, 'i').test(windowText)) {
            buildingCode = item.canonicalCode;
            break;
          }
        }
        const roomCandidate = windowText.match(/(?:room|rm|#)\s*([0-9]{3,4}[A-Z]?)\b/i);
        if (roomCandidate && roomCandidate[1] !== num) {
          room = roomCandidate[1];
        }
      }

      // Course title extraction: look at current line or preceding line
      let courseName = courseCode;
      const titleCandidate = line.replace(match[0], '').replace(/[-–|]/g, ' ').replace(/\s+/g, ' ').trim();
      if (titleCandidate.length > 3) {
        courseName = titleCandidate;
      } else if (i > 0 && lines[i - 1].trim().length > 3 && !lines[i - 1].includes('Scheduled')) {
        courseName = lines[i - 1].trim();
      }

      // Clean title artifacts
      courseName = courseName
        .replace(/\b(Section|Sec|CRN|Campus|Status|Credits|Grade|Tampa|Scheduled|Meeting|Times|Type|Class|Lecture)\b/gi, '')
        .replace(/\b[0-9]{5}\b/g, '') // CRN numbers
        .trim();
      if (courseName.length < 3) courseName = courseCode;

      // Prevent duplicate additions if already found
      const alreadyAdded = parsed.some(
        (c) => c.courseCode === courseCode && c.startTime === startTime
      );

      if (!alreadyAdded) {
        parsed.push({
          id: `extracted-${Date.now()}-${parsed.length}`,
          courseCode,
          courseName,
          buildingCode,
          room,
          daysOfWeek: days.length > 0 ? days : [1, 3],
          startTime,
          endTime
        });
      }
    }

    if (parsed.length > 0) {
      this.studentClasses = parsed;
    }
    return this.studentClasses;
  }

  /**
   * Robust CSV parser supporting USF OASIS exports, Canvas schedule tables, and custom CSVs.
   */
  parseCSV(csvContent: string): ClassSession[] {
    const rawLines = csvContent.split(/\r\n|\n|\r/).filter((l) => l.trim().length > 0);
    if (rawLines.length === 0) return this.studentClasses;

    const parsed: ClassSession[] = [];
    const allBuildings = campusService.getAllBuildings();

    // Split row respecting quotes
    const splitRow = (row: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"' && (i === 0 || row[i - 1] !== '\\')) {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim().replace(/^"|"$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim().replace(/^"|"$/g, ''));
      return result;
    };

    // Helper to parse days of week (1 = Monday ... 6 = Saturday, 0 = Sunday)
    const parseDays = (dayStr: string): number[] => {
      const s = dayStr.trim().toUpperCase();
      const days = new Set<number>();
      if (/\bMON|\bM\b|M[TWRF]|MWF|M,W/.test(s)) days.add(1);
      if (/\bTUE|\bT\b|TR\b|TTH\b|T,TH/.test(s)) days.add(2);
      if (/\bWED|\bW\b|MWF|M,W|W,F/.test(s)) days.add(3);
      if (/\bTHU|\bTH\b|\bR\b|TR\b|TTH\b|T,TH/.test(s)) days.add(4);
      if (/\bFRI|\bF\b|MWF|W,F/.test(s)) days.add(5);
      if (/\bSAT\b/.test(s)) days.add(6);
      if (/\bSUN\b|\bU\b/.test(s)) days.add(0);

      if (days.size === 0) {
        if (s.includes('M')) days.add(1);
        if (s.includes('T')) days.add(2);
        if (s.includes('W')) days.add(3);
        if (s.includes('R') || s.includes('TH')) days.add(4);
        if (s.includes('F')) days.add(5);
      }
      return Array.from(days).sort();
    };

    // Helper to normalize time to 24h format HH:mm
    const parseTime = (timeStr: string, defaultVal: string): string => {
      const match = timeStr.trim().toUpperCase().match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/);
      if (!match) return defaultVal;
      let h = parseInt(match[1], 10);
      const m = match[2];
      const ampm = match[3];
      if (ampm === 'PM' && h < 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;
      return `${String(h).padStart(2, '0')}:${m}`;
    };

    // Detect header indexes
    const firstRowTokens = splitRow(rawLines[0]).map((t) => t.toLowerCase());
    let hasHeader = false;
    let codeIdx = -1;
    let nameIdx = -1;
    let bldgIdx = -1;
    let roomIdx = -1;
    let daysIdx = -1;
    let startIdx = -1;
    let endIdx = -1;

    firstRowTokens.forEach((tok, idx) => {
      if (/code|course|class|num/.test(tok) && codeIdx === -1) codeIdx = idx;
      else if (/name|title|desc/.test(tok) && nameIdx === -1) nameIdx = idx;
      else if (/bldg|building|loc|place/.test(tok) && bldgIdx === -1) bldgIdx = idx;
      else if (/room|hall/.test(tok) && roomIdx === -1) roomIdx = idx;
      else if (/day|days|schedule/.test(tok) && daysIdx === -1) daysIdx = idx;
      else if (/start|begin|time/.test(tok) && startIdx === -1) startIdx = idx;
      else if (/end|finish/.test(tok) && endIdx === -1) endIdx = idx;
    });

    if (codeIdx !== -1 || bldgIdx !== -1 || daysIdx !== -1) {
      hasHeader = true;
    } else {
      // Positional defaults: Code, Name, Building, Room, Days, Start, End
      codeIdx = 0;
      nameIdx = 1;
      bldgIdx = 2;
      roomIdx = 3;
      daysIdx = 4;
      startIdx = 5;
      endIdx = 6;
    }

    const dataLines = hasHeader ? rawLines.slice(1) : rawLines;

    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i].trim();
      if (!line) continue;
      const cols = splitRow(line);
      if (cols.length < 3) continue;

      const rawCode = cols[codeIdx] || `CLS ${100 + i}`;
      const rawName = cols[nameIdx] || rawCode;
      const rawBldg = (cols[bldgIdx] || 'BSN').toUpperCase();
      const rawRoom = cols[roomIdx] || '101';
      const rawDays = cols[daysIdx] || 'MW';
      const rawStart = cols[startIdx] || '11:00 AM';
      const rawEnd = cols[endIdx] || '12:15 PM';

      // Match building code to official USF buildings
      let buildingCode = 'BSN';
      for (const b of allBuildings) {
        if (rawBldg.includes(b.code) || b.name.toUpperCase().includes(rawBldg)) {
          buildingCode = b.code;
          break;
        }
      }

      const daysOfWeek = parseDays(rawDays);
      const startTime = parseTime(rawStart, '11:00');
      const endTime = parseTime(rawEnd, '12:15');

      parsed.push({
        id: `csv-${Date.now()}-${i}`,
        courseCode: rawCode.toUpperCase(),
        courseName: rawName,
        buildingCode,
        room: rawRoom,
        daysOfWeek: daysOfWeek.length > 0 ? daysOfWeek : [1, 3],
        startTime,
        endTime
      });
    }

    if (parsed.length > 0) {
      this.studentClasses = parsed;
    }
    return this.studentClasses;
  }

  /**
   * Parses ICS / iCal calendar text (such as Canvas or OASIS calendar export).
   */
  parseICS(icsContent: string): ClassSession[] {
    const lines = icsContent.split(/\r\n|\n|\r/);
    const parsed: ClassSession[] = [];
    let currentEvent: any = null;

    for (const rawLine of lines) {
      const line = rawLine.trim();

      if (line === 'BEGIN:VEVENT') {
        currentEvent = {};
      } else if (line === 'END:VEVENT' && currentEvent) {
        if (currentEvent.summary && currentEvent.dtstart) {
          const summaryParts = currentEvent.summary.split(/[-–:]/);
          const courseCode = summaryParts[0]?.trim() || currentEvent.summary.slice(0, 8);
          const courseName = summaryParts.slice(1).join(' ').trim() || currentEvent.summary;

          let buildingCode = 'BSN';
          let room = 'TBD';

          if (currentEvent.location) {
            const loc = currentEvent.location.toUpperCase();
            const allBuildings = campusService.getAllBuildings();
            for (const b of allBuildings) {
              if (loc.includes(b.code)) {
                buildingCode = b.code;
                break;
              }
            }
            const roomMatch = currentEvent.location.match(/\b\d{3,4}[A-Z]?\b/);
            if (roomMatch) room = roomMatch[0];
          }

          let startTime = '11:00';
          let endTime = '12:15';
          if (currentEvent.dtstart) {
            const timePart = currentEvent.dtstart.includes('T')
              ? currentEvent.dtstart.split('T')[1].slice(0, 4)
              : currentEvent.dtstart.slice(0, 4);
            if (timePart.length >= 4) {
              startTime = `${timePart.slice(0, 2)}:${timePart.slice(2, 4)}`;
            }
          }

          if (currentEvent.dtend) {
            const timePart = currentEvent.dtend.includes('T')
              ? currentEvent.dtend.split('T')[1].slice(0, 4)
              : currentEvent.dtend.slice(0, 4);
            if (timePart.length >= 4) {
              endTime = `${timePart.slice(0, 2)}:${timePart.slice(2, 4)}`;
            }
          }

          let daysOfWeek = [1, 3];
          if (currentEvent.rrule) {
            const bydayMatch = currentEvent.rrule.match(/BYDAY=([A-Z,]+)/);
            if (bydayMatch) {
              const dayMap: Record<string, number> = { MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6, SU: 0 };
              daysOfWeek = bydayMatch[1].split(',').map((d: string) => dayMap[d] ?? 1);
            }
          }

          parsed.push({
            id: `course-${Date.now()}-${parsed.length}`,
            courseCode,
            courseName,
            buildingCode,
            room,
            daysOfWeek,
            startTime,
            endTime
          });
        }
        currentEvent = null;
      } else if (currentEvent) {
        if (line.startsWith('SUMMARY:')) currentEvent.summary = line.substring(8).trim();
        else if (line.startsWith('LOCATION:')) currentEvent.location = line.substring(9).trim();
        else if (line.startsWith('DTSTART:')) currentEvent.dtstart = line.substring(8).trim();
        else if (line.startsWith('DTEND:')) currentEvent.dtend = line.substring(6).trim();
        else if (line.startsWith('RRULE:')) currentEvent.rrule = line.substring(6).trim();
      }
    }

    if (parsed.length > 0) {
      this.studentClasses = parsed;
    }

    return this.studentClasses;
  }

  /**
   * Personalized, high-accuracy departure planner to ensure students are never late to class.
   * Calculates realistic drive time, dynamic parking search duration, walking duration,
   * in-seat buffer, and provides exact floor guidance.
   */
  getNextDeparturePlan(
    userPermit: PermitType = 'S',
    preferencesOrRefTime?: Partial<UserCommutePreferences> | Date,
    referenceTime?: Date
  ): SmartDeparturePlan | null {
    let preferencesOverride: Partial<UserCommutePreferences> | undefined;
    let effectiveRefTime: Date | undefined = referenceTime;

    if (preferencesOrRefTime instanceof Date) {
      effectiveRefTime = preferencesOrRefTime;
    } else if (preferencesOrRefTime) {
      preferencesOverride = preferencesOrRefTime;
    }

    const preferences: UserCommutePreferences = { ...this.userPreferences };
    if (preferencesOverride) {
      if (preferencesOverride.targetArrivalBufferMinutes !== undefined) {
        preferences.targetArrivalBufferMinutes = preferencesOverride.targetArrivalBufferMinutes;
      }
      if (preferencesOverride.walkingPace !== undefined) {
        preferences.walkingPace = preferencesOverride.walkingPace;
      }
      if (preferencesOverride.commuteDriveMinutes !== undefined) {
        preferences.commuteDriveMinutes = preferencesOverride.commuteDriveMinutes;
      }
      if (preferencesOverride.departureOriginName !== undefined) {
        preferences.departureOriginName = preferencesOverride.departureOriginName;
      }
      if (preferencesOverride.prioritizeCoveredIfRain !== undefined) {
        preferences.prioritizeCoveredIfRain = preferencesOverride.prioritizeCoveredIfRain;
      }
    }

    const now = effectiveRefTime || occupancyService.getEffectiveTime();
    const currentDay = now.getDay();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentMinsFromMidnight = currentHour * 60 + currentMinute;

    // Filter classes occurring today and sort chronologically
    const todayClasses = this.studentClasses.filter((c) => c.daysOfWeek.includes(currentDay));
    todayClasses.sort((a, b) => a.startTime.localeCompare(b.startTime));

    // Find next upcoming class
    let targetClass: ClassSession | null = null;
    let targetIndex = -1;
    for (let i = 0; i < todayClasses.length; i++) {
      const c = todayClasses[i];
      const [startH, startM] = c.startTime.split(':').map(Number);
      const classStartMins = startH * 60 + startM;
      if (classStartMins > currentMinsFromMidnight) {
        targetClass = c;
        targetIndex = i;
        break;
      }
    }

    // Fallback: If no remaining classes today, choose earliest scheduled class
    if (!targetClass && this.studentClasses.length > 0) {
      targetClass = this.studentClasses[0];
      targetIndex = todayClasses.findIndex((c) => c.id === targetClass!.id);
    }
    if (!targetClass) return null;

    const building = campusService.getBuildingById(targetClass.buildingCode);
    const [h, m] = targetClass.startTime.split(':').map(Number);
    const classStartMins = h * 60 + m;

    // Multi-Class Sequence: Identify previous class today and following classes today
    const previousClassToday: ClassSession | null =
      targetIndex > 0 ? todayClasses[targetIndex - 1] : null;
    const followingClassesToday: ClassSession[] =
      targetIndex >= 0 ? todayClasses.slice(targetIndex + 1) : [];

    // Parse previous class start and end times if available
    let prevStartMins = 0;
    let prevEndMins = 0;
    if (previousClassToday) {
      const [psH, psM] = previousClassToday.startTime.split(':').map(Number);
      const [peH, peM] = previousClassToday.endTime.split(':').map(Number);
      prevStartMins = psH * 60 + psM;
      prevEndMins = peH * 60 + peM;
    }

    // Student is considered already on campus if they had an earlier class today and haven't departed
    const isAlreadyOnCampus =
      !!previousClassToday &&
      currentMinsFromMidnight >= prevStartMins - 15 &&
      currentMinsFromMidnight <= classStartMins &&
      classStartMins - prevEndMins <= 240;

    // 1. Find Best Parking Route with weather & permit factors
    const routeResult = routingService.findBestParkingOptions({
      destinationBuildingId: targetClass.buildingCode,
      userPermit,
      currentTime: now
    });
    const bestOption = routeResult.recommendedOption;

    // 2. Accurate Walking Calculation with walking pace & rain adjustment
    const walkingDistanceMeters = bestOption?.estimatedWalkingDistanceMeters || 450;
    let walkingSpeedMps = 1.35; // normal: ~3.0 mph
    if (preferences.walkingPace === 'casual') walkingSpeedMps = 1.10; // ~2.5 mph
    else if (preferences.walkingPace === 'brisk') walkingSpeedMps = 1.65; // ~3.7 mph

    let walkingMinutes = Math.ceil(walkingDistanceMeters / walkingSpeedMps / 60);

    const currentWeather = weatherService.getCurrentWeather();
    if (currentWeather.isRaining && (!bestOption?.facility.features.hasCoveredWalkwayNearby)) {
      // Umbrella walking & puddle avoidance slows walking pace by ~15%
      walkingMinutes = Math.ceil(walkingMinutes * 1.15);
    }

    // Inter-building campus walking transfer calculation
    let campusTransferWalkMinutes: number | undefined;
    let campusTransferFromBuilding: string | undefined;
    let tightTransferWarning: string | undefined;

    if (previousClassToday) {
      const prevBldg = campusService.getBuildingById(previousClassToday.buildingCode);
      const targetBldg = building;
      campusTransferFromBuilding = prevBldg ? prevBldg.name : previousClassToday.buildingCode;

      if (prevBldg && targetBldg) {
        if (prevBldg.code.toUpperCase() === targetBldg.code.toUpperCase()) {
          campusTransferWalkMinutes = 2; // Same-building room transition
        } else {
          const interBldgDist = estimateCampusWalkingDistanceMeters(
            prevBldg.coordinates,
            targetBldg.coordinates
          );
          let interWalk = Math.ceil(interBldgDist / walkingSpeedMps / 60);
          if (currentWeather.isRaining) interWalk = Math.ceil(interWalk * 1.15);
          campusTransferWalkMinutes = interWalk;
        }
      } else {
        campusTransferWalkMinutes = 5;
      }

      const timeGapMinutes = classStartMins - prevEndMins;
      if (timeGapMinutes <= 20) {
        if (timeGapMinutes < (campusTransferWalkMinutes || 5) + 3) {
          tightTransferWarning = `Critical Transfer: Only ${timeGapMinutes}m break between classes! Walk takes ~${campusTransferWalkMinutes}m from ${previousClassToday.buildingCode} to ${targetClass.buildingCode}. Pack up promptly.`;
        } else {
          tightTransferWarning = `Tight Transfer: ${timeGapMinutes}m window (${campusTransferWalkMinutes}m walk from ${previousClassToday.buildingCode} to ${targetClass.buildingCode}). Head directly to Room ${targetClass.room}.`;
        }
      }
    }

    // Build the complete Day Itinerary Chain
    const dayScheduleChain: DayItineraryClass[] = todayClasses.map((cls, idx) => {
      const clsBldg = campusService.getBuildingById(cls.buildingCode);
      let status: DayItineraryClass['status'] = 'upcoming';
      if (cls.id === targetClass!.id) {
        status = 'current_or_next';
      } else if (idx < targetIndex) {
        status = 'completed';
      }

      let transitionFromPrevious: ClassTransition | undefined;
      if (idx > 0) {
        const prev = todayClasses[idx - 1];
        const prevBldg = campusService.getBuildingById(prev.buildingCode);
        const [pEndH, pEndM] = prev.endTime.split(':').map(Number);
        const [cStartH, cStartM] = cls.startTime.split(':').map(Number);
        const gap = cStartH * 60 + cStartM - (pEndH * 60 + pEndM);

        let walkDist = 350;
        let walkMins = 4;
        if (prevBldg && clsBldg) {
          if (prevBldg.code.toUpperCase() === clsBldg.code.toUpperCase()) {
            walkDist = 40;
            walkMins = 2;
          } else {
            walkDist = estimateCampusWalkingDistanceMeters(prevBldg.coordinates, clsBldg.coordinates);
            walkMins = Math.ceil(walkDist / walkingSpeedMps / 60);
          }
        }

        const isTight = gap <= 20;
        const alertMsg = isTight
          ? `Tight ${gap}m window (${walkMins}m walk)`
          : `${gap}m gap (${walkMins}m walk)`;

        transitionFromPrevious = {
          fromClass: prev,
          toClass: cls,
          timeGapMinutes: gap,
          walkingDistanceMeters: walkDist,
          walkingMinutes: walkMins,
          isTightTransfer: isTight,
          transferAlert: alertMsg
        };
      }

      let transitionToNext: ClassTransition | undefined;
      if (idx < todayClasses.length - 1) {
        const next = todayClasses[idx + 1];
        const nextBldg = campusService.getBuildingById(next.buildingCode);
        const [cEndH, cEndM] = cls.endTime.split(':').map(Number);
        const [nStartH, nStartM] = next.startTime.split(':').map(Number);
        const gap = nStartH * 60 + nStartM - (cEndH * 60 + cEndM);

        let walkDist = 350;
        let walkMins = 4;
        if (clsBldg && nextBldg) {
          if (clsBldg.code.toUpperCase() === nextBldg.code.toUpperCase()) {
            walkDist = 40;
            walkMins = 2;
          } else {
            walkDist = estimateCampusWalkingDistanceMeters(clsBldg.coordinates, nextBldg.coordinates);
            walkMins = Math.ceil(walkDist / walkingSpeedMps / 60);
          }
        }

        const isTight = gap <= 20;
        const alertMsg = isTight
          ? `Tight ${gap}m window (${walkMins}m walk)`
          : `${gap}m gap (${walkMins}m walk)`;

        transitionToNext = {
          fromClass: cls,
          toClass: next,
          timeGapMinutes: gap,
          walkingDistanceMeters: walkDist,
          walkingMinutes: walkMins,
          isTightTransfer: isTight,
          transferAlert: alertMsg
        };
      }

      return {
        classSession: cls,
        status,
        buildingName: clsBldg ? clsBldg.name : cls.buildingCode,
        isFirstClassOfDay: idx === 0,
        isLastClassOfDay: idx === todayClasses.length - 1,
        transitionFromPrevious,
        transitionToNext
      };
    });

    // 3. Dynamic Parking Search Duration & Floor Guidance
    let estimatedParkingSearchMinutes = 4; // default
    let recommendedFloorGuidance = 'Open parking available across facility';

    if (bestOption) {
      const occPct = bestOption.currentOccupancyPercentage;
      const isGarage = bestOption.facility.type === 'garage';

      if (isGarage) {
        const levels = bestOption.levels || [];
        const openLevel = levels.find((lvl) => lvl.availableSpots > 15 && lvl.status !== 'full');

        if (openLevel) {
          recommendedFloorGuidance = `Park on ${openLevel.levelName} (${openLevel.availableSpots} open spots)`;
          estimatedParkingSearchMinutes = 3 + (openLevel.levelNumber - 1) * 1.5;
        } else if (occPct >= 90) {
          recommendedFloorGuidance = 'Garage near capacity! Head directly to Rooftop or Level 5.';
          estimatedParkingSearchMinutes = 11;
        } else {
          recommendedFloorGuidance = 'Levels 2–4 have spaces open';
          estimatedParkingSearchMinutes = 6;
        }

        if (occPct >= 85) {
          estimatedParkingSearchMinutes += 3; // Ramp congestion delay
        }
      } else {
        if (occPct >= 90) {
          recommendedFloorGuidance = 'Surface lot crowded — look for departing cars in outer rows';
          estimatedParkingSearchMinutes = 8;
        } else if (occPct >= 75) {
          recommendedFloorGuidance = 'Moderate spaces — park in mid/back stalls for quickest entry';
          estimatedParkingSearchMinutes = 5;
        } else {
          recommendedFloorGuidance = 'Plenty of front-row stalls available';
          estimatedParkingSearchMinutes = 3;
        }
      }
    }

    estimatedParkingSearchMinutes = Math.round(estimatedParkingSearchMinutes);

    // 4. Personalized Timeline Computation
    const bufferMinutes = preferences.targetArrivalBufferMinutes; // early in-seat buffer
    const commuteDriveMinutes = preferences.commuteDriveMinutes; // drive time to USF campus

    const formatMins = (mins: number): string => {
      let positiveMins = mins;
      while (positiveMins < 0) positiveMins += 24 * 60;
      positiveMins = positiveMins % (24 * 60);
      const hour = Math.floor(positiveMins / 60);
      const minute = positiveMins % 60;
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const h12 = hour % 12 || 12;
      return `${h12}:${String(minute).padStart(2, '0')} ${ampm}`;
    };

    // Target to be inside classroom door:
    const classroomArrivalMins = classStartMins - bufferMinutes;
    // Target to have parked car and exit garage:
    const parkCompleteMins = classroomArrivalMins - walkingMinutes;
    // Target to pull into parking garage entrance:
    const garageArrivalMins = parkCompleteMins - estimatedParkingSearchMinutes;
    // Target to depart from home / origin:
    const originDepartureMins = garageArrivalMins - commuteDriveMinutes;

    let recommendedDepartureTime = formatMins(garageArrivalMins);
    let departureFromOriginTime = formatMins(originDepartureMins);
    let minutesUntilDeparture = originDepartureMins - currentMinsFromMidnight;
    let urgencyLevel: SmartDeparturePlan['urgencyLevel'] = 'on_track';
    let alertBanner = '';
    let timeline: SmartDeparturePlan['timeline'] = [];

    if (isAlreadyOnCampus) {
      // Student is already on campus from an earlier lecture today
      const transferWalkMins = campusTransferWalkMinutes || 5;
      const idealWalkStartMins = classroomArrivalMins - transferWalkMins;
      // Cannot depart before previous class concludes
      const walkStartMins = previousClassToday ? Math.max(idealWalkStartMins, prevEndMins) : idealWalkStartMins;
      const actualArrivalMins = Math.min(classStartMins, walkStartMins + transferWalkMins);
      const remainingBufferAtDesk = Math.max(0, classStartMins - actualArrivalMins);

      minutesUntilDeparture = walkStartMins - currentMinsFromMidnight;
      recommendedDepartureTime = formatMins(walkStartMins);
      departureFromOriginTime = formatMins(walkStartMins);

      if (minutesUntilDeparture < 0) {
        urgencyLevel = 'hurry_late';
        alertBanner =
          tightTransferWarning ||
          `Behind schedule by ${Math.abs(minutesUntilDeparture)}m! Walk quickly to ${targetClass.buildingCode} Room ${targetClass.room}. Class starts at ${targetClass.startTime}.`;
      } else if (minutesUntilDeparture <= 10) {
        urgencyLevel = 'leave_now';
        alertBanner =
          tightTransferWarning ||
          `Leave ${previousClassToday?.buildingCode || 'current building'} now (${formatMins(walkStartMins)}) to walk to ${targetClass.buildingCode} Room ${targetClass.room}.`;
      } else if (minutesUntilDeparture <= 25) {
        urgencyLevel = 'prepare_to_leave';
        alertBanner =
          tightTransferWarning ||
          `Already on campus. Begin walking from ${previousClassToday?.buildingCode || 'building'} to ${targetClass.buildingCode} in ${minutesUntilDeparture}m (${formatMins(walkStartMins)}).`;
      } else {
        urgencyLevel = 'on_track';
        alertBanner =
          tightTransferWarning ||
          `Already on campus. Campus walk (~${transferWalkMins}m) to ${targetClass.buildingCode} starts at ${formatMins(walkStartMins)}.`;
      }

      timeline = [
        {
          time: previousClassToday ? formatMins(prevEndMins) : formatMins(currentMinsFromMidnight),
          event: previousClassToday ? `${previousClassToday.courseCode} Concludes` : 'On Campus',
          icon: 'BookOpen',
          description: previousClassToday
            ? `Finish ${previousClassToday.courseName} in ${campusTransferFromBuilding || previousClassToday.buildingCode}.`
            : `Currently on campus.`
        },
        {
          time: formatMins(walkStartMins),
          event: 'Campus Walk Transfer',
          icon: 'Footprints',
          description: `Walk across campus to ${building?.name || targetClass.buildingCode} (~${transferWalkMins} min walk at ${preferences.walkingPace} pace).`
        },
        {
          time: formatMins(actualArrivalMins),
          event: 'Arrive at Desk',
          icon: 'CheckCircle2',
          description: `Arrive inside Room ${targetClass.room} with ${remainingBufferAtDesk} min buffer before lecture begins.`
        },
        {
          time: formatMins(classStartMins),
          event: 'Class Starts',
          icon: 'BookOpen',
          description: `${targetClass.courseCode}: ${targetClass.courseName} begins.`
        }
      ];
    } else {
      // Off-campus commute drive + garage parking timeline
      if (minutesUntilDeparture < 0) {
        urgencyLevel = 'hurry_late';
        const overdue = Math.abs(minutesUntilDeparture);
        alertBanner = `Behind schedule by ${overdue}m! Class begins at ${targetClass.startTime}. Drive directly to ${bestOption?.facility.name || 'nearest lot'}.`;
      } else if (minutesUntilDeparture <= 10) {
        urgencyLevel = 'leave_now';
        alertBanner = `Leave now (${departureFromOriginTime}) from ${preferences.departureOriginName} to arrive at ${targetClass.buildingCode} with ${bufferMinutes}m buffer.`;
      } else if (minutesUntilDeparture <= 25) {
        urgencyLevel = 'prepare_to_leave';
        alertBanner = `Prepare to depart in ${minutesUntilDeparture} mins (${departureFromOriginTime}) for ${targetClass.courseCode} at ${targetClass.buildingCode}.`;
      } else {
        urgencyLevel = 'on_track';
        alertBanner = `On track. Leave at ${departureFromOriginTime} to arrive at classroom ${bufferMinutes} mins early.`;
      }

      // If there's an upcoming tight transfer later today, prepend note to alert banner if on track
      if (tightTransferWarning && urgencyLevel === 'on_track') {
        alertBanner = `${alertBanner} Notice: ${tightTransferWarning}`;
      }

      timeline = [
        {
          time: departureFromOriginTime,
          event: 'Depart Origin',
          icon: 'Car',
          description: `Leave ${preferences.departureOriginName} (${commuteDriveMinutes} min drive to campus).`
        },
        {
          time: recommendedDepartureTime,
          event: 'Enter Parking Facility',
          icon: 'MapPin',
          description: `Arrive at ${bestOption?.facility.name || 'USF Garage'}. ${recommendedFloorGuidance}. (~${estimatedParkingSearchMinutes}m to park)`
        },
        {
          time: formatMins(parkCompleteMins),
          event: 'Walk to Classroom',
          icon: 'Footprints',
          description: `Walk ${walkingDistanceMeters}m to ${building?.name || targetClass.buildingCode} (${walkingMinutes} min at ${preferences.walkingPace} pace).`
        },
        {
          time: formatMins(classroomArrivalMins),
          event: 'Arrive at Desk',
          icon: 'CheckCircle2',
          description: `Arrive inside Room ${targetClass.room} with ${bufferMinutes} min buffer before lecture begins.`
        },
        {
          time: formatMins(classStartMins),
          event: 'Class Starts',
          icon: 'BookOpen',
          description: `${targetClass.courseCode}: ${targetClass.courseName} begins.`
        }
      ];
    }

    const totalLeadTimeMinutes = isAlreadyOnCampus
      ? (campusTransferWalkMinutes || 5) + bufferMinutes
      : commuteDriveMinutes + estimatedParkingSearchMinutes + walkingMinutes + bufferMinutes;

    return {
      classSession: targetClass,
      destinationBuildingName: building ? building.name : targetClass.buildingCode,
      classStartTime: targetClass.startTime,
      recommendedDepartureTime,
      departureFromOriginTime,
      minutesUntilDeparture,
      bufferMinutes,
      estimatedParkingSearchMinutes: isAlreadyOnCampus ? 0 : estimatedParkingSearchMinutes,
      estimatedDriveMinutes: isAlreadyOnCampus ? 0 : commuteDriveMinutes,
      walkingTimeMinutes: isAlreadyOnCampus ? (campusTransferWalkMinutes || 5) : walkingMinutes,
      totalLeadTimeMinutes,
      recommendedFloorGuidance: isAlreadyOnCampus ? 'Already on campus — no parking needed' : recommendedFloorGuidance,
      recommendedLot: isAlreadyOnCampus ? null : bestOption,
      alertBanner,
      urgencyLevel,
      timeline,
      previousClassToday,
      followingClassesToday,
      isAlreadyOnCampus,
      campusTransferWalkMinutes,
      campusTransferFromBuilding,
      tightTransferWarning,
      dayScheduleChain
    };
  }
}

export const scheduleService = new ScheduleService();

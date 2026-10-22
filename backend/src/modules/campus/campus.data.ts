import { Building, ParkingFacility } from './campus.types';

export const USF_BUILDINGS: Building[] = [
  {
    id: 'bldg-bsn',
    code: 'BSN',
    name: 'Muma College of Business',
    category: 'academic',
    coordinates: { latitude: 28.0573, longitude: -82.4093 },
    description: 'Home to Business Administration, Finance, Marketing, and Accounting departments.',
    popularDepartments: ['Business Administration', 'Finance', 'Marketing', 'Accounting']
  },
  {
    id: 'bldg-cpr',
    code: 'CPR',
    name: 'Cooper Hall',
    category: 'academic',
    coordinates: { latitude: 28.0598, longitude: -82.4140 },
    description: 'Core humanities and liberal arts hub with high student lecture traffic.',
    popularDepartments: ['English', 'World Languages', 'History', 'Philosophy']
  },
  {
    id: 'bldg-isa',
    code: 'ISA',
    name: 'Interdisciplinary Sciences Building',
    category: 'academic',
    coordinates: { latitude: 28.0622, longitude: -82.4105 },
    description: 'Premier science lecture halls and STEM lab facilities.',
    popularDepartments: ['Biology', 'Pre-Med', 'Interdisciplinary Sciences']
  },
  {
    id: 'bldg-che',
    code: 'CHE',
    name: 'Chemistry Building',
    category: 'academic',
    coordinates: { latitude: 28.0617, longitude: -82.4116 },
    description: 'Chemistry lecture halls and research laboratories.',
    popularDepartments: ['Chemistry', 'Biochemistry']
  },
  {
    id: 'bldg-phy',
    code: 'PHY',
    name: 'Physics Building',
    category: 'academic',
    coordinates: { latitude: 28.0615, longitude: -82.4128 },
    description: 'Physics classrooms and student research labs.',
    popularDepartments: ['Physics', 'Applied Physics']
  },
  {
    id: 'bldg-eng',
    code: 'ENG',
    name: 'Hall of Engineering (Engineering I)',
    category: 'academic',
    coordinates: { latitude: 28.0597, longitude: -82.4169 },
    description: 'College of Engineering complex including civil and environmental engineering.',
    popularDepartments: ['Civil Engineering', 'Mechanical Engineering', 'Electrical Engineering']
  },
  {
    id: 'bldg-enb',
    code: 'ENB',
    name: 'Engineering Building II',
    category: 'academic',
    coordinates: { latitude: 28.0587, longitude: -82.4163 },
    description: 'Computer Science & Engineering lecture halls and research laboratories.',
    popularDepartments: ['Computer Science', 'Computer Engineering', 'Cybersecurity']
  },
  {
    id: 'bldg-enc',
    code: 'ENC',
    name: 'Engineering Building III (Kopp)',
    category: 'academic',
    coordinates: { latitude: 28.0601, longitude: -82.4158 },
    description: 'Chemical & biomedical engineering, advanced maker spaces, and student design labs.',
    popularDepartments: ['Chemical Engineering', 'Biomedical Engineering', 'Industrial Engineering']
  },
  {
    id: 'bldg-sca',
    code: 'SCA',
    name: 'Science Center',
    category: 'academic',
    coordinates: { latitude: 28.0612, longitude: -82.4121 },
    description: 'Central campus STEM lecture halls, large auditorium (SCA 110), and sciences advising.',
    popularDepartments: ['Chemistry', 'Biology', 'Natural Sciences']
  },
  {
    id: 'bldg-cis',
    code: 'CIS',
    name: 'Computing, Mathematics & CIS',
    category: 'academic',
    coordinates: { latitude: 28.0588, longitude: -82.4157 },
    description: 'Mathematics and computer information systems center.',
    popularDepartments: ['Mathematics', 'Information Technology', 'Data Science']
  },
  {
    id: 'bldg-lib',
    code: 'LIB',
    name: 'USF Tampa Library',
    category: 'academic',
    coordinates: { latitude: 28.0594, longitude: -82.4124 },
    description: 'Central campus library, digital study commons, and research support.',
    popularDepartments: ['All Majors', 'Research & Study Commons']
  },
  {
    id: 'bldg-msc',
    code: 'MSC',
    name: 'Marshall Student Center',
    category: 'student-life',
    coordinates: { latitude: 28.0641, longitude: -82.4137 },
    description: 'Heart of campus life with dining, ballrooms, and student organization offices.',
    popularDepartments: ['Student Government', 'Dining', 'Campus Events']
  },
  {
    id: 'bldg-rec',
    code: 'REC',
    name: 'Campus Recreation Center',
    category: 'student-life',
    coordinates: { latitude: 28.0612, longitude: -82.4068 },
    description: 'Main gym, indoor track, basketball courts, and outdoor pool.',
    popularDepartments: ['Fitness', 'Intramural Sports']
  },
  {
    id: 'bldg-sun',
    code: 'SUN',
    name: 'Yuengling Center (Sun Dome)',
    category: 'athletics',
    coordinates: { latitude: 28.0560, longitude: -82.4050 },
    description: 'Arena for USF basketball, concerts, and major graduation ceremonies.',
    popularDepartments: ['Athletics', 'Special Events']
  },
  {
    id: 'bldg-hon',
    code: 'HON',
    name: 'Judy Genshaft Honors College',
    category: 'academic',
    coordinates: { latitude: 28.0629, longitude: -82.4129 },
    description: 'Modern honors college building featuring collaborative study spaces and event halls.',
    popularDepartments: ['Honors Studies', 'Interdisciplinary Seminars']
  },
  {
    id: 'bldg-edu',
    code: 'EDU',
    name: 'College of Education',
    category: 'academic',
    coordinates: { latitude: 28.0579, longitude: -82.4148 },
    description: 'Teacher education programs, research centers, and counseling psychology.',
    popularDepartments: ['Education', 'Educational Psychology', 'Curriculum & Instruction']
  },
  {
    id: 'bldg-fao',
    code: 'FAO',
    name: 'Fine Arts Building',
    category: 'academic',
    coordinates: { latitude: 28.0607, longitude: -82.4146 },
    description: 'Fine arts classrooms, graphic design labs, and art history lectures.',
    popularDepartments: ['Studio Art', 'Graphic Arts', 'Art History']
  },
  {
    id: 'bldg-mus',
    code: 'MUS',
    name: 'School of Music',
    category: 'academic',
    coordinates: { latitude: 28.0612, longitude: -82.4154 },
    description: 'Performance concert hall, music practice suites, and ensemble studios.',
    popularDepartments: ['Music Performance', 'Music Education', 'Jazz Studies']
  },
  {
    id: 'bldg-cgs',
    code: 'CGS',
    name: 'Patel Center for Global Solutions',
    category: 'academic',
    coordinates: { latitude: 28.0580, longitude: -82.4120 },
    description: 'Global sustainability research, international affairs, and auditorium.',
    popularDepartments: ['Global Sustainability', 'International Affairs']
  },
  {
    id: 'bldg-bsf',
    code: 'BSF',
    name: 'Biological Sciences Facility',
    category: 'academic',
    coordinates: { latitude: 28.0628, longitude: -82.4111 },
    description: 'Advanced cellular and molecular biology research facilities.',
    popularDepartments: ['Cellular Biology', 'Genetics', 'Microbiology']
  },
  {
    id: 'bldg-nes',
    code: 'NES',
    name: 'Natural & Environmental Sciences',
    category: 'academic',
    coordinates: { latitude: 28.0625, longitude: -82.4120 },
    description: 'Geology, environmental science, and marine biology studies.',
    popularDepartments: ['Geology', 'Environmental Policy', 'Marine Science']
  },
  {
    id: 'bldg-mdc',
    code: 'MDC',
    name: 'Morsani College of Medicine Complex',
    category: 'academic',
    coordinates: { latitude: 28.0664, longitude: -82.4215 },
    description: 'Medical lecture halls, anatomy laboratories, and biomedical sciences.',
    popularDepartments: ['Medicine', 'Biomedical Sciences', 'Physical Therapy']
  },
  {
    id: 'bldg-cph',
    code: 'CPH',
    name: 'College of Public Health',
    category: 'academic',
    coordinates: { latitude: 28.0678, longitude: -82.4208 },
    description: 'Public health policy, epidemiology, and biostatistics research.',
    popularDepartments: ['Public Health', 'Epidemiology', 'Health Policy']
  },
  {
    id: 'bldg-con',
    code: 'CON',
    name: 'College of Nursing',
    category: 'academic',
    coordinates: { latitude: 28.0668, longitude: -82.4202 },
    description: 'Nursing simulation hospital suites and clinical skills labs.',
    popularDepartments: ['Nursing', 'Healthcare Practice']
  },
  {
    id: 'bldg-beh',
    code: 'BEH',
    name: 'Behavioral Sciences Building',
    category: 'academic',
    coordinates: { latitude: 28.0585, longitude: -82.4142 },
    description: 'Psychology lecture halls, cognitive science research, and counseling clinics.',
    popularDepartments: ['Psychology', 'Behavioral Health', 'Criminology']
  },
  {
    id: 'bldg-soc',
    code: 'SOC',
    name: 'Social Sciences Building',
    category: 'academic',
    coordinates: { latitude: 28.0589, longitude: -82.4135 },
    description: 'Sociology, anthropology, and political science department center.',
    popularDepartments: ['Sociology', 'Anthropology', 'Political Science']
  },
  {
    id: 'bldg-aln',
    code: 'ALN',
    name: 'Allen Hall',
    category: 'administration',
    coordinates: { latitude: 28.0580, longitude: -82.4138 },
    description: 'Historic original USF administration building and university offices.',
    popularDepartments: ['Administration', 'University Archives']
  },
  {
    id: 'bldg-svc',
    code: 'SVC',
    name: 'Student Services Center',
    category: 'administration',
    coordinates: { latitude: 28.0591, longitude: -82.4115 },
    description: 'Admissions, Financial Aid, Registrar, and Cashier offices.',
    popularDepartments: ['Admissions', 'Financial Aid', 'Registrar']
  },
  {
    id: 'bldg-hub',
    code: 'HUB',
    name: 'The Hub Dining & Student Complex',
    category: 'student-life',
    coordinates: { latitude: 28.0655, longitude: -82.4102 },
    description: 'All-you-care-to-eat residential dining hall and student social lounges.',
    popularDepartments: ['Dining Services', 'Residential Life']
  },
  {
    id: 'bldg-cwy',
    code: 'CWY',
    name: 'C.W. Bill Young Hall (ROTC)',
    category: 'academic',
    coordinates: { latitude: 28.0618, longitude: -82.4085 },
    description: 'Joint Military Leadership Center and academic classrooms.',
    popularDepartments: ['ROTC', 'Military Science', 'Leadership Studies']
  },
  {
    id: 'bldg-tar',
    code: 'TAR',
    name: 'Theatre Arts Building',
    category: 'academic',
    coordinates: { latitude: 28.0604, longitude: -82.4148 },
    description: 'Mainstage theatre, rehearsal halls, and performance studios.',
    popularDepartments: ['Theatre Performance', 'Design & Technology', 'Dance']
  },
  {
    id: 'bldg-mdn',
    code: 'MDN',
    name: 'Morsani Health Center',
    category: 'academic',
    coordinates: { latitude: 28.0650, longitude: -82.4230 },
    description: 'Advanced ambulatory healthcare center and clinical medical education.',
    popularDepartments: ['Clinical Medicine', 'Physical Therapy', 'Health Informatics']
  }
];

export const USF_PARKING_FACILITIES: ParkingFacility[] = [
  {
    id: 'lot-beard-garage',
    name: 'Richard A. Beard Garage (Garage 1)',
    type: 'garage',
    isCovered: true,
    totalCapacity: 1850,
    basePermitsAllowed: ['S', 'E', 'D'],
    afterHoursPermitsAllowed: ['S', 'E', 'D', 'R'],
    coordinates: { latitude: 28.0608, longitude: -82.4182 },
    levels: 6,
    features: {
      evCharging: true,
      hasCoveredWalkwayNearby: true,
      bullRunnerStopNearby: 'Route C - Beard Stop'
    }
  },
  {
    id: 'lot-crescent-garage',
    name: 'Crescent Hill Garage (Garage 4)',
    type: 'garage',
    isCovered: true,
    totalCapacity: 1420,
    basePermitsAllowed: ['S', 'E'],
    afterHoursPermitsAllowed: ['S', 'E', 'D', 'R'],
    coordinates: { latitude: 28.0615, longitude: -82.4085 },
    levels: 5,
    features: {
      evCharging: true,
      hasCoveredWalkwayNearby: false,
      bullRunnerStopNearby: 'Route A - Crescent Stop'
    }
  },
  {
    id: 'lot-collins-garage',
    name: 'Collins Blvd Garage (Garage 6)',
    type: 'garage',
    isCovered: true,
    totalCapacity: 1600,
    basePermitsAllowed: ['S', 'E'],
    afterHoursPermitsAllowed: ['S', 'E', 'D', 'R'],
    coordinates: { latitude: 28.0648, longitude: -82.4095 },
    levels: 5,
    features: {
      evCharging: true,
      hasCoveredWalkwayNearby: true,
      bullRunnerStopNearby: 'Route B - Collins Stop'
    }
  },
  {
    id: 'lot-laurel-garage',
    name: 'Laurel Garage (Garage 2)',
    type: 'garage',
    isCovered: true,
    totalCapacity: 1100,
    basePermitsAllowed: ['S', 'E'],
    afterHoursPermitsAllowed: ['S', 'E', 'D', 'R'],
    coordinates: { latitude: 28.0652, longitude: -82.4142 },
    levels: 4,
    features: {
      evCharging: false,
      hasCoveredWalkwayNearby: true,
      bullRunnerStopNearby: 'Route A - Laurel/MSC Stop'
    }
  },
  {
    id: 'lot-23b',
    name: 'Lot 23B (Science Complex Surface)',
    type: 'surface_lot',
    isCovered: false,
    totalCapacity: 340,
    basePermitsAllowed: ['S', 'E'],
    afterHoursPermitsAllowed: ['S', 'E', 'D'],
    coordinates: { latitude: 28.0631, longitude: -82.4118 },
    features: {
      evCharging: false,
      hasCoveredWalkwayNearby: false,
      bullRunnerStopNearby: null
    }
  },
  {
    id: 'lot-38a',
    name: 'Lot 38A (Engineering Annex)',
    type: 'surface_lot',
    isCovered: false,
    totalCapacity: 280,
    basePermitsAllowed: ['E'], // Faculty only during the day
    afterHoursPermitsAllowed: ['S', 'E', 'D'], // Unlocks for S after 5:30 PM
    coordinates: { latitude: 28.0592, longitude: -82.4180 },
    features: {
      evCharging: false,
      hasCoveredWalkwayNearby: true,
      bullRunnerStopNearby: 'Route C - Engineering'
    }
  },
  {
    id: 'lot-8a',
    name: 'Lot 8A (Library West Faculty)',
    type: 'surface_lot',
    isCovered: false,
    totalCapacity: 210,
    basePermitsAllowed: ['E'], // Faculty only during business hours
    afterHoursPermitsAllowed: ['S', 'E', 'D'], // Unlocks for S after 5:30 PM
    coordinates: { latitude: 28.0588, longitude: -82.4118 },
    features: {
      evCharging: false,
      hasCoveredWalkwayNearby: true,
      bullRunnerStopNearby: 'Route D - Library Loop'
    }
  },
  {
    id: 'lot-43',
    name: 'Lot 43 (Yuengling Center Park & Ride)',
    type: 'surface_lot',
    isCovered: false,
    totalCapacity: 2200,
    basePermitsAllowed: ['Y', 'S', 'D', 'R'],
    afterHoursPermitsAllowed: ['Y', 'S', 'D', 'R', 'E'],
    coordinates: { latitude: 28.0552, longitude: -82.4025 },
    features: {
      evCharging: false,
      hasCoveredWalkwayNearby: false,
      bullRunnerStopNearby: 'Route A & F - Yuengling Express Terminal'
    }
  },
  {
    id: 'lot-sycamore',
    name: 'Sycamore Lot (North Park & Ride)',
    type: 'surface_lot',
    isCovered: false,
    totalCapacity: 850,
    basePermitsAllowed: ['Y', 'S'],
    afterHoursPermitsAllowed: ['Y', 'S', 'D', 'E'],
    coordinates: { latitude: 28.0675, longitude: -82.4190 },
    features: {
      evCharging: false,
      hasCoveredWalkwayNearby: false,
      bullRunnerStopNearby: 'Route B - Sycamore North Terminal'
    }
  }
];

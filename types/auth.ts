export interface User {
  id: string;
  name: string;
  email: string;
  abcId: string;
  semester: string;
  year: string;
  programme: string;
  role: 'student';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  totalClasses: number;
  attendedClasses: number;
  percentage: number;
  schedule: string[];
  semesterId: string;
  teacherId?: string;
}

export interface Programme {
  id: string;
  name: string;
  code: string;
  duration: string;
  department: string;
  description: string;
  createdAt: string;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  credits: number;
  semester: string;
  programmeId: string;
  teacherId?: string;
  description: string;
  createdAt: string;
}

export interface AttendanceRecord {
  date: string;
  status: 'present' | 'absent';
  subjectId: string;
  studentId: string;
  markedBy?: string;
  markedAt?: string;
}

export interface Semester {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  year: string;
}

export interface QRSession {
  id: string;
  subjectId: string;
  teacherId: string;
  location: string;
  timestamp: string;
  expiresAt: string;
  isActive: boolean;
}
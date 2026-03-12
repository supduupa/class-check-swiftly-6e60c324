export interface Student {
  id: string;
  fullName: string;
  studentId: string; // unique identifier
  email?: string;
  phone?: string;
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Excused';

export interface Attendance {
  id: string;
  studentId: string;
  date: string; // ISO date string (YYYY-MM-DD)
  status: AttendanceStatus;
  note?: string;
}

export interface AttendanceRecord extends Attendance {
  student: Student;
}
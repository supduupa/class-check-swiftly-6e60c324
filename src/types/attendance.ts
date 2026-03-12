export interface Class {
  id: string;
  class_name: string;
  teacher_id: string;
  description?: string;
}

export interface Student {
  id: string;
  fullName: string;
  studentId: string; // unique identifier
  email?: string;
  phone?: string;
  classId?: string;
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Excused';

export interface Attendance {
  id: string;
  studentId: string;
  date: string; // ISO date string (YYYY-MM-DD)
  status: AttendanceStatus;
  note?: string;
  classId?: string;
}

export interface AttendanceRecord extends Attendance {
  student: Student;
}
export type AppRole = 'Teacher' | 'CourseRep' | 'Student';

export interface Profile {
  id: string;
  full_name: string;
  email: string | null;
  role: AppRole;
  created_at: string;
  updated_at: string;
}

export const isStaff = (role: AppRole): boolean => {
  return role === 'Teacher' || role === 'CourseRep';
};
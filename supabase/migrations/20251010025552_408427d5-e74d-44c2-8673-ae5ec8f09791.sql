-- Drop ALL existing policies for classes, students, and attendance tables

-- Classes policies
DROP POLICY IF EXISTS "Staff can view all classes" ON classes;
DROP POLICY IF EXISTS "Teachers can view their own classes" ON classes;
DROP POLICY IF EXISTS "Staff can insert classes" ON classes;
DROP POLICY IF EXISTS "Teachers can insert their own classes" ON classes;
DROP POLICY IF EXISTS "Teachers can update their own classes" ON classes;
DROP POLICY IF EXISTS "Staff can delete classes" ON classes;
DROP POLICY IF EXISTS "Teachers can delete their own classes" ON classes;

-- Students policies
DROP POLICY IF EXISTS "Staff can view all students" ON students;
DROP POLICY IF EXISTS "Teachers can view students in their classes" ON students;
DROP POLICY IF EXISTS "Students can view their own record by user_id" ON students;
DROP POLICY IF EXISTS "Students can view classmates" ON students;
DROP POLICY IF EXISTS "Staff can insert students" ON students;
DROP POLICY IF EXISTS "Teachers can insert students in their classes" ON students;
DROP POLICY IF EXISTS "Staff can update students" ON students;
DROP POLICY IF EXISTS "Teachers can update students in their classes" ON students;
DROP POLICY IF EXISTS "Staff can delete students" ON students;
DROP POLICY IF EXISTS "Teachers can delete students in their classes" ON students;

-- Attendance policies
DROP POLICY IF EXISTS "Staff can view all attendance" ON attendance;
DROP POLICY IF EXISTS "Teachers can view attendance in their classes" ON attendance;
DROP POLICY IF EXISTS "Students can view their own attendance by user_id" ON attendance;
DROP POLICY IF EXISTS "Students can view class attendance" ON attendance;
DROP POLICY IF EXISTS "Staff can insert/update attendance" ON attendance;
DROP POLICY IF EXISTS "Teachers can insert attendance in their classes" ON attendance;
DROP POLICY IF EXISTS "Staff can update attendance" ON attendance;
DROP POLICY IF EXISTS "Teachers can update attendance in their classes" ON attendance;
DROP POLICY IF EXISTS "Staff can delete attendance" ON attendance;
DROP POLICY IF EXISTS "Teachers can delete attendance in their classes" ON attendance;

-- CLASSES TABLE: New restricted policies
CREATE POLICY "Teachers view own classes, CourseReps view assigned class"
  ON classes FOR SELECT
  USING (
    auth.uid() = teacher_id 
    OR id = get_user_class_id()
  );

CREATE POLICY "Only Teachers can create classes"
  ON classes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'Teacher'
    )
    AND auth.uid() = teacher_id
  );

CREATE POLICY "Teachers update only own classes"
  ON classes FOR UPDATE
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers delete only own classes"
  ON classes FOR DELETE
  USING (auth.uid() = teacher_id);

-- STUDENTS TABLE: New restricted policies
CREATE POLICY "View students in own classes or classmates"
  ON students FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM classes 
      WHERE id = students.class_id 
      AND teacher_id = auth.uid()
    )
    OR auth.uid() = user_id
    OR class_id = get_user_class_id()
  );

CREATE POLICY "Teachers insert students in own classes"
  ON students FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM classes 
      WHERE id = class_id 
      AND teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers update students in own classes"
  ON students FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM classes 
      WHERE id = students.class_id 
      AND teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers delete students in own classes"
  ON students FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM classes 
      WHERE id = students.class_id 
      AND teacher_id = auth.uid()
    )
  );

-- ATTENDANCE TABLE: New restricted policies
CREATE POLICY "View attendance in own classes or own attendance"
  ON attendance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM classes 
      WHERE id = attendance.class_id 
      AND teacher_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM students 
      WHERE id = attendance.student_id 
      AND user_id = auth.uid()
    )
    OR class_id = get_user_class_id()
  );

CREATE POLICY "Teachers and CourseReps insert attendance"
  ON attendance FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM classes 
      WHERE id = class_id 
      AND teacher_id = auth.uid()
    )
    OR (
      class_id = get_user_class_id()
      AND EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'CourseRep'
      )
    )
  );

CREATE POLICY "Teachers and CourseReps update attendance"
  ON attendance FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM classes 
      WHERE id = attendance.class_id 
      AND teacher_id = auth.uid()
    )
    OR (
      class_id = get_user_class_id()
      AND EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'CourseRep'
      )
    )
  );

CREATE POLICY "Teachers and CourseReps delete attendance"
  ON attendance FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM classes 
      WHERE id = attendance.class_id 
      AND teacher_id = auth.uid()
    )
    OR (
      class_id = get_user_class_id()
      AND EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'CourseRep'
      )
    )
  );
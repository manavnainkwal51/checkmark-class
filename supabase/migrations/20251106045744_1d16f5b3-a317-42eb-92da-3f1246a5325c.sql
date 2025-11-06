-- Allow teachers to view profiles of students in their classes
CREATE POLICY "Teachers can view student profiles in their classes"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id 
  OR 
  id IN (
    SELECT cm.student_id
    FROM class_memberships cm
    JOIN classes c ON c.id = cm.class_id
    WHERE c.teacher_id = auth.uid()
  )
);
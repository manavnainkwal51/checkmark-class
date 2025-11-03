import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Student {
  id: string;
  name: string;
}

interface AttendanceSessionProps {
  classId: string;
  onBack: () => void;
}

const AttendanceSession = ({ classId, onBack }: AttendanceSessionProps) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [classInfo, setClassInfo] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchClassAndStudents();
  }, [classId]);

  const fetchClassAndStudents = async () => {
    const { data: classData } = await supabase
      .from("classes")
      .select("*")
      .eq("id", classId)
      .single();

    setClassInfo(classData);

    const { data: memberships } = await supabase
      .from("class_memberships")
      .select(`
        student_id,
        profiles (
          id,
          name
        )
      `)
      .eq("class_id", classId);

    if (memberships) {
      const studentList = memberships.map((m: any) => ({
        id: m.profiles.id,
        name: m.profiles.name
      }));
      setStudents(studentList);
      
      const initialAttendance: Record<string, boolean> = {};
      studentList.forEach((s: Student) => {
        initialAttendance[s.id] = false;
      });
      setAttendance(initialAttendance);
    }

    setLoading(false);
  };

  const toggleAttendance = (studentId: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  const saveAttendance = async () => {
    setSaving(true);

    const { data: userData } = await supabase.auth.getUser();

    const { data: session, error: sessionError } = await supabase
      .from("attendance_sessions")
      .insert({
        class_id: classId,
        created_by: userData?.user?.id
      })
      .select()
      .single();

    if (sessionError || !session) {
      toast({
        title: "Error",
        description: "Failed to create attendance session",
        variant: "destructive"
      });
      setSaving(false);
      return;
    }

    const records = Object.entries(attendance).map(([studentId, isPresent]) => ({
      session_id: session.id,
      student_id: studentId,
      status: isPresent ? "present" : "absent"
    }));

    const { error } = await supabase
      .from("attendance_records")
      .insert(records);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Attendance saved successfully!"
      });
      onBack();
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{classInfo?.name}</h1>
            <p className="text-muted-foreground">Mark attendance for today</p>
          </div>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Students ({students.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {students.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No students enrolled in this class yet
              </p>
            ) : (
              <div className="space-y-4">
                {students.map((student, index) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground w-8">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="font-medium">{student.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={attendance[student.id]}
                        onCheckedChange={() => toggleAttendance(student.id)}
                        className="h-5 w-5"
                      />
                      <span className="text-sm font-medium w-16">
                        {attendance[student.id] ? (
                          <span className="text-secondary">Present</span>
                        ) : (
                          <span className="text-muted-foreground">Absent</span>
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {students.length > 0 && (
              <Button
                onClick={saveAttendance}
                disabled={saving}
                className="w-full mt-6"
                size="lg"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save Attendance"}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AttendanceSession;
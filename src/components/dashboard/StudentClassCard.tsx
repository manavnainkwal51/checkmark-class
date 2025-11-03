import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AttendanceHistory from "./AttendanceHistory";

interface StudentClassCardProps {
  classData: {
    id: string;
    name: string;
    subject: string;
    code: string;
  };
}

const StudentClassCard = ({ classData }: StudentClassCardProps) => {
  const [showHistory, setShowHistory] = useState(false);
  const [stats, setStats] = useState({ total: 0, present: 0, percentage: 0 });

  useEffect(() => {
    fetchStats();
  }, [classData.id]);

  const fetchStats = async () => {
    const { data: userData } = await supabase.auth.getUser();
    
    const { data: sessions } = await supabase
      .from("attendance_sessions")
      .select("id")
      .eq("class_id", classData.id);

    if (!sessions) return;

    const { data: records } = await supabase
      .from("attendance_records")
      .select("status")
      .eq("student_id", userData?.user?.id)
      .in("session_id", sessions.map(s => s.id));

    if (records) {
      const total = records.length;
      const present = records.filter(r => r.status === "present").length;
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
      setStats({ total, present, percentage });
    }
  };

  if (showHistory) {
    return (
      <AttendanceHistory
        classData={classData}
        onBack={() => setShowHistory(false)}
      />
    );
  }

  return (
    <Card className="hover:shadow-[var(--shadow-medium)] transition-shadow">
      <CardHeader>
        <CardTitle>{classData.name}</CardTitle>
        <CardDescription>{classData.subject}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Attendance</span>
            <span className="font-semibold">{stats.percentage}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-secondary h-2 rounded-full transition-all"
              style={{ width: `${stats.percentage}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.present} present out of {stats.total} sessions
          </p>
        </div>
        <Button onClick={() => setShowHistory(true)} variant="outline" className="w-full">
          <BarChart3 className="w-4 h-4 mr-2" />
          View History
        </Button>
      </CardContent>
    </Card>
  );
};

export default StudentClassCard;
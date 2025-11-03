import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AttendanceHistoryProps {
  classData: {
    id: string;
    name: string;
    subject: string;
  };
  onBack: () => void;
}

interface AttendanceRecord {
  date: string;
  status: string;
}

const AttendanceHistory = ({ classData, onBack }: AttendanceHistoryProps) => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [classData.id]);

  const fetchHistory = async () => {
    const { data: userData } = await supabase.auth.getUser();

    const { data: sessions } = await supabase
      .from("attendance_sessions")
      .select(`
        id,
        date,
        attendance_records (
          status
        )
      `)
      .eq("class_id", classData.id)
      .eq("attendance_records.student_id", userData?.user?.id)
      .order("date", { ascending: false });

    if (sessions) {
      const formattedRecords = sessions.map((session: any) => ({
        date: new Date(session.date).toLocaleDateString(),
        status: session.attendance_records[0]?.status || "absent"
      }));
      setRecords(formattedRecords);
    }

    setLoading(false);
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <CardTitle>{classData.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{classData.subject}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No attendance records yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {records.map((record, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{record.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  {record.status === "present" ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-secondary" />
                      <span className="text-secondary font-medium">Present</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-destructive" />
                      <span className="text-destructive font-medium">Absent</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AttendanceHistory;
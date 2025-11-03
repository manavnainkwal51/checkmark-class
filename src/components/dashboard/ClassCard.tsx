import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, Users, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ClassCardProps {
  classData: {
    id: string;
    name: string;
    subject: string;
    code: string;
  };
  onTakeAttendance: () => void;
}

const ClassCard = ({ classData, onTakeAttendance }: ClassCardProps) => {
  const { toast } = useToast();
  const [studentCount, setStudentCount] = useState(0);

  useEffect(() => {
    fetchStudentCount();
  }, [classData.id]);

  const fetchStudentCount = async () => {
    const { count } = await supabase
      .from("class_memberships")
      .select("*", { count: "exact", head: true })
      .eq("class_id", classData.id);
    
    setStudentCount(count || 0);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(classData.code);
    toast({
      title: "Copied!",
      description: "Class code copied to clipboard"
    });
  };

  return (
    <Card className="hover:shadow-[var(--shadow-medium)] transition-shadow">
      <CardHeader>
        <CardTitle>{classData.name}</CardTitle>
        <CardDescription>{classData.subject}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{studentCount} students</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={copyCode}
            className="text-xs"
          >
            <Copy className="w-3 h-3 mr-1" />
            {classData.code}
          </Button>
        </div>
        <Button onClick={onTakeAttendance} className="w-full">
          <ClipboardCheck className="w-4 h-4 mr-2" />
          Take Attendance
        </Button>
      </CardContent>
    </Card>
  );
};

export default ClassCard;
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, LogOut, Users } from "lucide-react";
import CreateClassDialog from "./CreateClassDialog";
import ClassCard from "./ClassCard";
import AttendanceSession from "./AttendanceSession";
import { useToast } from "@/hooks/use-toast";

interface Class {
  id: string;
  name: string;
  subject: string;
  code: string;
  created_at: string;
}

const TeacherDashboard = () => {
  const { profile, signOut } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("classes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load classes",
        variant: "destructive"
      });
    } else {
      setClasses(data || []);
    }
    setLoading(false);
  };

  if (selectedClass) {
    return (
      <AttendanceSession
        classId={selectedClass}
        onBack={() => setSelectedClass(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {profile?.name}!</p>
          </div>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <div className="mb-8">
          <CreateClassDialog onClassCreated={fetchClasses} />
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : classes.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent className="pt-6">
              <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No classes yet</h3>
              <p className="text-muted-foreground mb-4">Create your first class to get started</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((classItem) => (
              <ClassCard
                key={classItem.id}
                classData={classItem}
                onTakeAttendance={() => setSelectedClass(classItem.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
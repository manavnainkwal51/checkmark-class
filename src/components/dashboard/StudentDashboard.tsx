import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, BookOpen } from "lucide-react";
import JoinClassDialog from "./JoinClassDialog";
import StudentClassCard from "./StudentClassCard";
import { useToast } from "@/hooks/use-toast";

interface ClassMembership {
  id: string;
  class_id: string;
  joined_at: string;
  classes: {
    id: string;
    name: string;
    subject: string;
    code: string;
  };
}

const StudentDashboard = () => {
  const { profile, signOut } = useAuth();
  const [memberships, setMemberships] = useState<ClassMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchMemberships();
  }, []);

  const fetchMemberships = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("class_memberships")
      .select(`
        *,
        classes (
          id,
          name,
          subject,
          code
        )
      `)
      .order("joined_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load classes",
        variant: "destructive"
      });
    } else {
      setMemberships(data || []);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Student Dashboard</h1>
            <p className="text-muted-foreground">Welcome, {profile?.name}!</p>
          </div>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <div className="mb-8">
          <JoinClassDialog onJoined={fetchMemberships} />
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : memberships.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent className="pt-6">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No classes yet</h3>
              <p className="text-muted-foreground mb-4">Join your first class using a class code</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {memberships.map((membership) => (
              <StudentClassCard
                key={membership.id}
                classData={membership.classes}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface JoinClassDialogProps {
  onJoined: () => void;
}

const JoinClassDialog = ({ onJoined }: JoinClassDialogProps) => {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (code.length < 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a valid class code",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    const { data: classData, error: classError } = await supabase
      .from("classes")
      .select("id")
      .eq("code", code.toUpperCase())
      .single();

    if (classError || !classData) {
      toast({
        title: "Error",
        description: "Class not found. Please check the code.",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    const { data: userData } = await supabase.auth.getUser();

    const { error } = await supabase.from("class_memberships").insert({
      class_id: classData.id,
      student_id: userData?.user?.id
    });

    if (error) {
      if (error.code === "23505") {
        toast({
          title: "Already Joined",
          description: "You are already a member of this class",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "Success",
        description: "Successfully joined the class!"
      });
      setCode("");
      setOpen(false);
      onJoined();
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Join Class
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join a Class</DialogTitle>
          <DialogDescription>
            Enter the class code provided by your teacher
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="class-code">Class Code</Label>
            <Input
              id="class-code"
              placeholder="e.g., ABC123XY"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
              maxLength={8}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Joining..." : "Join Class"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default JoinClassDialog;
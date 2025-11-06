import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const classSchema = z.object({
  name: z.string().min(2, "Class name must be at least 2 characters"),
  subject: z.string().min(2, "Subject must be at least 2 characters")
});

interface CreateClassDialogProps {
  onClassCreated: () => void;
}

const CreateClassDialog = ({ onClassCreated }: CreateClassDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      classSchema.parse({ name, subject });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive"
        });
      }
      return;
    }

    setLoading(true);

    const { data: userData } = await supabase.auth.getUser();
    
    // Try to generate code via backend function first, with client-side fallback for robustness
    let codeToUse: string | null = null;

    const { data: codeData, error: codeError } = await supabase.rpc("generate_class_code");

    if (!codeError && codeData) {
      codeToUse = codeData;
    } else {
      // Fallback: client-side unique code generation with collision check
      const gen = () =>
        Array.from(crypto.getRandomValues(new Uint8Array(8)))
          .map((n) => "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[n % 36])
          .join("");

      for (let i = 0; i < 6; i++) {
        const candidate = gen();
        const { data: existing, error: selectErr } = await supabase
          .from("classes")
          .select("id")
          .eq("code", candidate)
          .maybeSingle();
        if (!selectErr && !existing) {
          codeToUse = candidate;
          break;
        }
      }
      if (!codeToUse) {
        toast({
          title: "Error",
          description: "Failed to generate class code",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
    }

    const { error } = await supabase.from("classes").insert({
      name,
      subject,
      code: codeToUse,
      teacher_id: userData?.user?.id,
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: `Class created with code: ${codeToUse}`
      });
      setName("");
      setSubject("");
      setOpen(false);
      onClassCreated();
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Create Class
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Class</DialogTitle>
          <DialogDescription>
            Enter the details for your new class
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="class-name">Class Name</Label>
            <Input
              id="class-name"
              placeholder="e.g., Mathematics 101"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="e.g., Algebra"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating..." : "Create Class"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateClassDialog;
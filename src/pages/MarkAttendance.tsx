import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function MarkAttendance() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error" | "not-enrolled" | "awaiting-auth">("loading");
  const [message, setMessage] = useState("");
  const [className, setClassName] = useState("");

  const classId = searchParams.get("classId");
  const date = searchParams.get("date");

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setStatus("awaiting-auth");
      return;
    }

    if (!classId || !date) {
      setStatus("error");
      setMessage("Invalid QR code. Missing class or date information.");
      return;
    }

    markAttendance();
  }, [user, authLoading, classId, date]);

  const markAttendance = async () => {
    try {
      setStatus("loading");

      // Get class name
      const { data: classData } = await supabase
        .from("classes")
        .select("class_name")
        .eq("id", classId!)
        .single();

      if (classData) setClassName(classData.class_name);

      // Find student record linked to this user in this class
      const { data: student, error: studentError } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", user!.id)
        .eq("class_id", classId!)
        .single();

      if (studentError || !student) {
        setStatus("not-enrolled");
        setMessage("You are not enrolled in this class. Contact your teacher to be added.");
        return;
      }

      // Check if already marked
      const { data: existing } = await supabase
        .from("attendance")
        .select("id, status")
        .eq("student_id", student.id)
        .eq("date", date!)
        .eq("class_id", classId!)
        .single();

      if (existing) {
        setStatus("success");
        setMessage(`Your attendance is already recorded as "${existing.status}" for today.`);
        return;
      }

      // Mark as present
      const { error: insertError } = await supabase
        .from("attendance")
        .insert({
          student_id: student.id,
          date: date!,
          status: "Present",
          class_id: classId!,
        });

      if (insertError) {
        console.error("Error marking attendance:", insertError);
        setStatus("error");
        setMessage("Failed to mark attendance. Please try again.");
        return;
      }

      setStatus("success");
      setMessage("You have been marked as Present!");
    } catch (err) {
      console.error("Error:", err);
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-6 space-y-6 text-center">
        <div className="flex justify-center">
          <GraduationCap className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Class Attendance</h1>
        {className && (
          <p className="text-muted-foreground font-medium">{className} — {date}</p>
        )}

        {status === "loading" && (
          <div className="flex flex-col items-center gap-3 py-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Marking your attendance...</p>
          </div>
        )}

        {status === "awaiting-auth" && (
          <div className="space-y-4 py-4">
            <p className="text-muted-foreground">You need to sign in to mark your attendance.</p>
            <Button onClick={() => navigate(`/auth?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`)}>
              Sign In
            </Button>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center gap-3 py-4">
            <CheckCircle2 className="h-12 w-12 text-[hsl(var(--status-present))]" />
            <p className="text-foreground font-medium">{message}</p>
          </div>
        )}

        {(status === "error" || status === "not-enrolled") && (
          <div className="flex flex-col items-center gap-3 py-4">
            <XCircle className="h-12 w-12 text-destructive" />
            <p className="text-foreground font-medium">{message}</p>
          </div>
        )}

        <Button variant="outline" onClick={() => navigate("/")} className="w-full">
          Go to Dashboard
        </Button>
      </Card>
    </div>
  );
}

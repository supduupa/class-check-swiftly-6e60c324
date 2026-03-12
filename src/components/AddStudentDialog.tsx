import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Student } from "@/types/attendance";
import { useToast } from "@/hooks/use-toast";

interface AddStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddStudent: (student: Omit<Student, 'id'>) => void;
  existingStudentIds: string[];
}

export function AddStudentDialog({ 
  open, 
  onOpenChange, 
  onAddStudent, 
  existingStudentIds 
}: AddStudentDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    fullName: "",
    studentId: "",
    email: "",
    phone: ""
  });

  const resetForm = () => {
    setFormData({
      fullName: "",
      studentId: "",
      email: "",
      phone: ""
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName.trim()) {
      toast({
        title: "Error",
        description: "Full name is required.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.studentId.trim()) {
      toast({
        title: "Error",
        description: "Student ID is required.",
        variant: "destructive",
      });
      return;
    }

    if (existingStudentIds.includes(formData.studentId.trim())) {
      toast({
        title: "Error",
        description: "Student ID already exists.",
        variant: "destructive",
      });
      return;
    }

    onAddStudent({
      fullName: formData.fullName.trim(),
      studentId: formData.studentId.trim(),
      email: formData.email.trim() || undefined,
      phone: formData.phone.trim() || undefined
    });

    toast({
      title: "Success",
      description: "Student added successfully.",
    });

    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
          <DialogDescription>
            Add a new student to the class roster. Student ID must be unique.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                placeholder="Enter full name"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="studentId">Student ID *</Label>
              <Input
                id="studentId"
                value={formData.studentId}
                onChange={(e) => setFormData(prev => ({ ...prev, studentId: e.target.value }))}
                placeholder="Enter unique student ID"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email (optional)</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter phone number"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              Add Student
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
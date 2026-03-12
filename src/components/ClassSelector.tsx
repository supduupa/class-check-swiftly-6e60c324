import { useState } from "react";
import { Class } from "@/types/attendance";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { GraduationCap, Search, Trash2 } from "lucide-react";

interface ClassSelectorProps {
  classes: Class[];
  selectedClassId: string | null;
  onSelectClass: (classId: string | null) => void;
  onDeleteClass?: (classId: string) => void;
  loading?: boolean;
  showAllOption?: boolean;
}

export function ClassSelector({ 
  classes, 
  selectedClassId, 
  onSelectClass,
  onDeleteClass,
  loading = false,
  showAllOption = false
}: ClassSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState<Class | null>(null);

  const filteredClasses = classes.filter(cls =>
    cls.class_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedClass = classes.find(cls => cls.id === selectedClassId);

  const handleDeleteClick = (e: React.MouseEvent, cls: Class) => {
    e.stopPropagation();
    setClassToDelete(cls);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (classToDelete && onDeleteClass) {
      onDeleteClass(classToDelete.id);
      setDeleteDialogOpen(false);
      setClassToDelete(null);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-2 w-full">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-muted-foreground" />
          <Select 
            value={selectedClassId || "all"} 
            onValueChange={(value) => onSelectClass(value === "all" ? null : value)}
            disabled={loading}
          >
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select a class" />
            </SelectTrigger>
            <SelectContent>
              <div className="px-2 pb-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search classes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
              {showAllOption && <SelectItem value="all">All Classes</SelectItem>}
              {filteredClasses.length === 0 ? (
                <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                  No classes found
                </div>
              ) : (
                filteredClasses.map((cls) => (
                  <div key={cls.id} className="flex items-center group">
                    <SelectItem value={cls.id} className="flex-1">
                      {cls.class_name}
                    </SelectItem>
                    {onDeleteClass && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => handleDeleteClick(e, cls)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))
              )}
            </SelectContent>
          </Select>
          {onDeleteClass && selectedClass && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setClassToDelete(selectedClass);
                setDeleteDialogOpen(true);
              }}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Class</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{classToDelete?.class_name}"? This will also delete all students and attendance records associated with this class. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

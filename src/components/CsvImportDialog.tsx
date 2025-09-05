import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Student } from "@/types/attendance";
import { parseFile, validateAndParseStudents, CsvValidationError } from "@/utils/csv";
import { Upload, FileText, AlertCircle, CheckCircle, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (students: Omit<Student, 'id'>[], updateExisting: boolean) => void;
  existingStudents: Student[];
}

export function CsvImportDialog({ 
  open, 
  onOpenChange, 
  onImport,
  existingStudents 
}: CsvImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedStudents, setParsedStudents] = useState<Omit<Student, 'id'>[]>([]);
  const [errors, setErrors] = useState<CsvValidationError[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [updateExisting, setUpdateExisting] = useState(true);
  const { toast } = useToast();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    const fileName = selectedFile.name.toLowerCase();
    if (!fileName.endsWith('.csv') && !fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      toast({
        title: "Invalid File",
        description: "Please select a CSV or Excel file.",
        variant: "destructive"
      });
      return;
    }

    setFile(selectedFile);
    setIsProcessing(true);

    try {
      const fileRows = await parseFile(selectedFile);
      const result = validateAndParseStudents(fileRows, existingStudents);
      
      setParsedStudents(result.students);
      setErrors(result.errors);
    } catch (error) {
      toast({
        title: "Parse Error",
        description: "Failed to parse CSV file. Please check the file format.",
        variant: "destructive"
      });
      setErrors([{ row: 0, field: 'file', message: 'Failed to parse CSV file' }]);
      setParsedStudents([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = () => {
    if (parsedStudents.length === 0) return;
    
    onImport(parsedStudents, updateExisting);
    handleClose();
    
    toast({
      title: "Import Successful",
      description: `Imported ${parsedStudents.length} student${parsedStudents.length > 1 ? 's' : ''}.`,
    });
  };

  const handleClose = () => {
    setFile(null);
    setParsedStudents([]);
    setErrors([]);
    setIsProcessing(false);
    onOpenChange(false);
  };

  const existingStudentIds = new Set(existingStudents.map(s => s.studentId.toLowerCase()));
  const conflictingStudents = parsedStudents.filter(s => 
    existingStudentIds.has(s.studentId.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Students from File
          </DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file with student data. Expected headers: studentId, fullName, email, phone
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file-input">Select CSV or Excel File</Label>
            <Input
              id="file-input"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              disabled={isProcessing}
            />
          </div>

          {/* Sample Format */}
          <Card className="p-4 bg-muted/50">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Expected Format:
            </h4>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">CSV or Excel file with these columns:</p>
              <code className="text-sm block bg-background p-2 rounded border">
                studentId,fullName,email,phone<br/>
                S001,John Doe,john@example.com,555-0123<br/>
                S002,Jane Smith,jane@example.com,555-0456
              </code>
            </div>
          </Card>

          {/* Processing State */}
          {isProcessing && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Processing file...
              </AlertDescription>
            </Alert>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">Found {errors.length} error{errors.length > 1 ? 's' : ''}:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {errors.slice(0, 5).map((error, index) => (
                      <li key={index}>
                        Row {error.row}, {error.field}: {error.message}
                      </li>
                    ))}
                    {errors.length > 5 && (
                      <li>... and {errors.length - 5} more errors</li>
                    )}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Success Preview */}
          {parsedStudents.length > 0 && errors.length === 0 && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">
                    Ready to import {parsedStudents.length} student{parsedStudents.length > 1 ? 's' : ''}
                  </p>
                  
                  {conflictingStudents.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm">
                        <span className="font-medium">{conflictingStudents.length}</span> student{conflictingStudents.length > 1 ? 's' : ''} already exist:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {conflictingStudents.slice(0, 3).map(student => (
                          <Badge key={student.studentId} variant="outline">
                            {student.studentId}
                          </Badge>
                        ))}
                        {conflictingStudents.length > 3 && (
                          <Badge variant="outline">
                            +{conflictingStudents.length - 3} more
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="checkbox"
                          id="update-existing"
                          checked={updateExisting}
                          onChange={(e) => setUpdateExisting(e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor="update-existing" className="text-sm">
                          Update existing students with new data
                        </Label>
                      </div>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Preview */}
          {parsedStudents.length > 0 && (
            <Card className="p-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Preview ({parsedStudents.length} students)
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {parsedStudents.slice(0, 5).map((student, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-background rounded border">
                    <div>
                      <p className="font-medium">{student.fullName}</p>
                      <p className="text-sm text-muted-foreground">
                        ID: {student.studentId}
                        {student.email && ` • ${student.email}`}
                        {student.phone && ` • ${student.phone}`}
                      </p>
                    </div>
                    {existingStudentIds.has(student.studentId.toLowerCase()) && (
                      <Badge variant="secondary">Exists</Badge>
                    )}
                  </div>
                ))}
                {parsedStudents.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center">
                    ... and {parsedStudents.length - 5} more students
                  </p>
                )}
              </div>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleImport}
            disabled={parsedStudents.length === 0 || errors.length > 0 || isProcessing}
          >
            Import {parsedStudents.length > 0 && `${parsedStudents.length} `}Students
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
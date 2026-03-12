import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card } from "@/components/ui/card";
import { AttendanceRecord } from "@/types/attendance";
import { generateAttendanceCsv, downloadCsv } from "@/utils/csv";
import { Download, Calendar, FileText } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface CsvExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attendanceRecords: AttendanceRecord[];
  currentDate: string;
}

type ExportType = 'current' | 'range' | 'all';

export function CsvExportDialog({ 
  open, 
  onOpenChange, 
  attendanceRecords,
  currentDate 
}: CsvExportDialogProps) {
  const [exportType, setExportType] = useState<ExportType>('current');
  const [startDate, setStartDate] = useState(currentDate);
  const [endDate, setEndDate] = useState(currentDate);
  const { toast } = useToast();

  const handleExport = () => {
    let csvContent: string;
    let filename: string;
    
    switch (exportType) {
      case 'current':
        csvContent = generateAttendanceCsv(
          attendanceRecords.filter(record => record.date === currentDate)
        );
        filename = `attendance-${currentDate}.csv`;
        break;
      
      case 'range':
        csvContent = generateAttendanceCsv(attendanceRecords, startDate, endDate);
        filename = `attendance-${startDate}-to-${endDate}.csv`;
        break;
      
      case 'all':
        csvContent = generateAttendanceCsv(attendanceRecords);
        filename = 'attendance-all-records.csv';
        break;
    }

    if (!csvContent.includes('\n')) {
      toast({
        title: "No Data",
        description: "No attendance records found for the selected criteria.",
        variant: "destructive"
      });
      return;
    }

    downloadCsv(csvContent, filename);
    onOpenChange(false);
    
    toast({
      title: "Export Successful",
      description: `Attendance data exported to ${filename}`,
    });
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const getRecordCount = () => {
    switch (exportType) {
      case 'current':
        return attendanceRecords.filter(record => record.date === currentDate).length;
      case 'range':
        return attendanceRecords.filter(record => 
          record.date >= startDate && record.date <= endDate
        ).length;
      case 'all':
        return attendanceRecords.length;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Attendance to CSV
          </DialogTitle>
          <DialogDescription>
            Choose the date range for attendance data export
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <RadioGroup value={exportType} onValueChange={(value: ExportType) => setExportType(value)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="current" id="current" />
              <Label htmlFor="current" className="flex-1">
                Current date only ({format(new Date(currentDate), 'MMM d, yyyy')})
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="range" id="range" />
              <Label htmlFor="range" className="flex-1">
                Date range
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="all" />
              <Label htmlFor="all" className="flex-1">
                All records
              </Label>
            </div>
          </RadioGroup>

          {exportType === 'range' && (
            <Card className="p-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                />
              </div>
            </Card>
          )}

          <Card className="p-4 bg-muted/50">
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4" />
              <span>
                {getRecordCount()} record{getRecordCount() !== 1 ? 's' : ''} will be exported
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Includes: Date, Student ID, Full Name, Email, Phone, Status, Note
            </p>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleExport}
            disabled={getRecordCount() === 0 || (exportType === 'range' && startDate > endDate)}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
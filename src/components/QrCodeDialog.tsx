import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface QrCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string | null;
  className: string;
  date: string;
}

export function QrCodeDialog({ open, onOpenChange, classId, className, date }: QrCodeDialogProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  if (!classId) return null;

  const baseUrl = window.location.origin;
  const attendanceUrl = `${baseUrl}/mark-attendance?classId=${classId}&date=${date}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(attendanceUrl);
    setCopied(true);
    toast({ title: "Link Copied", description: "Attendance link copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Attendance QR Code</DialogTitle>
          <DialogDescription>
            Students scan this QR code to mark themselves as Present for <strong>{className}</strong> on <strong>{date}</strong>.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="bg-white p-4 rounded-lg border">
            <QRCodeSVG
              value={attendanceUrl}
              size={220}
              level="H"
              includeMargin
            />
          </div>
          <p className="text-xs text-muted-foreground text-center break-all max-w-[300px]">
            {attendanceUrl}
          </p>
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            {copied ? "Copied!" : "Copy Link"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

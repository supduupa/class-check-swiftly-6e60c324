import { GraduationCap, LogOut, Menu, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

interface MobileHeaderProps {
  selectedDate: Date;
  onSignOut: () => void;
  userName?: string;
}

export function MobileHeader({ selectedDate, onSignOut, userName }: MobileHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <h1 className="text-lg font-semibold text-foreground">ClassCheck</h1>
          </div>
        </div>

        <div className="flex-1 flex justify-center">
          <div className="flex items-center gap-2 bg-muted px-3 py-2 rounded-full">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {format(selectedDate, 'MMM dd, yyyy')}
            </span>
          </div>
        </div>

        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80">
            <div className="flex flex-col gap-6 pt-6">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">Account</h2>
                {userName && (
                  <p className="text-sm text-muted-foreground">
                    Signed in as {userName}
                  </p>
                )}
              </div>
              
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </h3>
                <Button
                  variant="outline"
                  onClick={() => {
                    onSignOut();
                    setIsOpen(false);
                  }}
                  className="w-full justify-start"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
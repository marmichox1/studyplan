import { useState, useEffect } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CreateSessionForm from "@/components/forms/CreateSessionForm";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Setup the localizer for the Calendar
const localizer = momentLocalizer(moment);

export default function CalendarPage() {
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [createSessionDialogOpen, setCreateSessionDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [eventDetailsOpen, setEventDetailsOpen] = useState(false);
  const { toast } = useToast();

  const { data: sessions = [] } = useQuery({
    queryKey: ["/api/sessions/all"],
  });

  const { data: exams = [] } = useQuery({
    queryKey: ["/api/exams"],
  });

  // Prepare events for the calendar
  const events = [
    ...sessions.map((session: any) => ({
      id: `session-${session.id}`,
      title: `${session.subject.name}: ${session.topic}`,
      start: new Date(session.startTime),
      end: new Date(session.endTime),
      allDay: false,
      type: "session",
      data: session,
      color: getSubjectColor(session.subject.name),
    })),
    ...exams.map((exam: any) => ({
      id: `exam-${exam.id}`,
      title: `EXAM: ${exam.title}`,
      start: new Date(exam.date),
      end: new Date(new Date(exam.date).getTime() + 2 * 60 * 60 * 1000), // Add 2 hours for display
      allDay: false,
      type: "exam",
      data: exam,
      color: "#EA4335", // Exam color (danger/red)
    })),
  ];

  function getSubjectColor(subject: string) {
    const colors: Record<string, string> = {
      Mathematics: "#4285F4", // primary
      "Computer Science": "#34A853", // secondary
      Physics: "#FBBC05", // accent
      Chemistry: "#EA4335", // danger
    };
    return colors[subject] || "#9AA0A6"; // default gray
  }

  const handleEventClick = (event: any) => {
    setSelectedEvent(event);
    setEventDetailsOpen(true);
  };

  const handleCreateSessionSuccess = () => {
    setCreateSessionDialogOpen(false);
    toast({
      title: "Success",
      description: "Study session created successfully",
    });
  };

  const eventStyleGetter = (event: any) => {
    const style = {
      backgroundColor: event.color,
      borderRadius: '4px',
      opacity: 0.9,
      color: '#fff',
      border: '0',
      display: 'block',
    };
    return {
      style,
    };
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-medium">Calendar</h2>
        <div className="flex items-center space-x-2">
          <div className="flex border rounded overflow-hidden">
            <Button
              variant={view === "month" ? "default" : "ghost"}
              className={cn(
                "px-3 py-1 h-auto text-sm rounded-none",
                view === "month" && "bg-primary text-white"
              )}
              onClick={() => setView("month")}
            >
              Month
            </Button>
            <Button
              variant={view === "week" ? "default" : "ghost"}
              className={cn(
                "px-3 py-1 h-auto text-sm rounded-none",
                view === "week" && "bg-primary text-white"
              )}
              onClick={() => setView("week")}
            >
              Week
            </Button>
            <Button
              variant={view === "day" ? "default" : "ghost"}
              className={cn(
                "px-3 py-1 h-auto text-sm rounded-none",
                view === "day" && "bg-primary text-white"
              )}
              onClick={() => setView("day")}
            >
              Day
            </Button>
          </div>
          <Button
            className="flex items-center bg-primary text-white"
            onClick={() => setCreateSessionDialogOpen(true)}
          >
            <span className="material-icons mr-1">add</span>
            New Session
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 h-[calc(100vh-200px)]">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          view={view}
          onView={(newView) => setView(newView as any)}
          date={currentDate}
          onNavigate={setCurrentDate}
          onSelectEvent={handleEventClick}
          eventPropGetter={eventStyleGetter}
          formats={{
            timeGutterFormat: (date, culture, localizer) => localizer.format(date, 'h:mm a', culture),
            eventTimeRangeFormat: ({ start, end }, culture, localizer) => {
              return `${localizer.format(start, 'h:mm a', culture)} - ${localizer.format(end, 'h:mm a', culture)}`;
            },
          }}
        />
      </div>

      {/* Create Session Dialog */}
      <Dialog open={createSessionDialogOpen} onOpenChange={setCreateSessionDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Study Session</DialogTitle>
          </DialogHeader>
          <CreateSessionForm onSuccess={handleCreateSessionSuccess} />
        </DialogContent>
      </Dialog>

      {/* Event Details Dialog */}
      {selectedEvent && (
        <Dialog open={eventDetailsOpen} onOpenChange={setEventDetailsOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{selectedEvent.type === "exam" ? "Exam Details" : "Session Details"}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <h3 className="text-xl font-medium">{selectedEvent.title}</h3>
              <div className="mt-4 space-y-2">
                <div className="flex items-center">
                  <span className="material-icons text-sm mr-2">calendar_today</span>
                  <span>
                    {format(selectedEvent.start, "EEEE, MMMM d, yyyy")}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="material-icons text-sm mr-2">schedule</span>
                  <span>
                    {format(selectedEvent.start, "h:mm a")} - {format(selectedEvent.end, "h:mm a")}
                  </span>
                </div>
                {selectedEvent.type === "exam" && selectedEvent.data.location && (
                  <div className="flex items-center">
                    <span className="material-icons text-sm mr-2">place</span>
                    <span>{selectedEvent.data.location}</span>
                  </div>
                )}
                {selectedEvent.data.notes && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-1">Notes:</h4>
                    <p className="text-sm text-gray-600">{selectedEvent.data.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

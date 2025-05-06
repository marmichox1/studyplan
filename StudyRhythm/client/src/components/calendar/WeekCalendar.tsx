import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { 
  addDays, 
  addMonths,
  subMonths,
  format, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  eachWeekOfInterval,
  isSameMonth,
  getDay
} from "date-fns";
import { cn } from "@/lib/utils";

export default function WeekCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"week" | "month">("week");

  // For week view
  const startOfWeekDate = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);
  const endOfWeekDate = useMemo(() => endOfWeek(currentDate, { weekStartsOn: 1 }), [currentDate]);
  
  // For month view
  const startOfMonthDate = useMemo(() => startOfMonth(currentDate), [currentDate]);
  const endOfMonthDate = useMemo(() => endOfMonth(currentDate), [currentDate]);
  
  // Determine current view's start and end dates
  const startDate = useMemo(
    () => view === "week" ? startOfWeekDate : startOfMonthDate,
    [view, startOfWeekDate, startOfMonthDate]
  );
  
  const endDate = useMemo(
    () => view === "week" ? endOfWeekDate : endOfMonthDate,
    [view, endOfWeekDate, endOfMonthDate]
  );
  
  // Generate days for the week view
  const daysOfWeek = useMemo(
    () => eachDayOfInterval({ start: startOfWeekDate, end: endOfWeekDate }),
    [startOfWeekDate, endOfWeekDate]
  );
  
  // Generate weeks for the month view
  const weeksOfMonth = useMemo(() => {
    // Get all weeks that have days in this month
    const weeks = eachWeekOfInterval(
      { start: startOfMonthDate, end: endOfMonthDate },
      { weekStartsOn: 1 }
    );
    
    // For each week, get the 7 days
    return weeks.map(week => {
      const start = startOfWeek(week, { weekStartsOn: 1 });
      const end = endOfWeek(week, { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end });
    });
  }, [startOfMonthDate, endOfMonthDate]);

  const { data: sessions = [] } = useQuery<any[]>({
    queryKey: ["/api/sessions", format(startDate, "yyyy-MM-dd"), format(endDate, "yyyy-MM-dd")],
  });

  // Navigation handlers
  const handlePrevious = () => {
    if (view === "week") {
      setCurrentDate(addDays(currentDate, -7));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (view === "week") {
      setCurrentDate(addDays(currentDate, 7));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const subjectColors = {
    Mathematics: {
      bg: "bg-blue-100",
      border: "border-primary",
    },
    "Computer Science": {
      bg: "bg-green-100",
      border: "border-secondary",
    },
    Physics: {
      bg: "bg-yellow-100",
      border: "border-accent",
    },
    Chemistry: {
      bg: "bg-red-100",
      border: "border-danger",
    },
  };

  // Group sessions by day
  const sessionsByDay = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    
    if (!sessions || !Array.isArray(sessions)) {
      return grouped;
    }
    
    // Helper function to group sessions for a particular day
    const groupByDay = (day: Date) => {
      const dayStr = format(day, 'yyyy-MM-dd');
      return sessions.filter((session: any) => {
        if (!session || !session.date) return false;
        const sessionDate = new Date(session.date);
        return format(sessionDate, 'yyyy-MM-dd') === dayStr;
      });
    };
    
    // Process each day for both week view and month view
    if (view === 'week') {
      daysOfWeek.forEach(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        grouped[dayStr] = groupByDay(day);
      });
    } else {
      // For month view, flatten all days from all weeks
      weeksOfMonth.forEach(week => {
        week.forEach(day => {
          const dayStr = format(day, 'yyyy-MM-dd');
          grouped[dayStr] = groupByDay(day);
        });
      });
    }
    
    return grouped;
  }, [sessions, daysOfWeek, weeksOfMonth, view]);

  // Render a day cell with sessions
  const renderDayCell = (day: Date, isWeekend: boolean) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const dayNumber = format(day, "d");
    const sessionsForDay = sessionsByDay[dayStr] || [];
    const isCurrentMonth = view === "week" || isSameMonth(day, currentDate);
    
    return (
      <div 
        key={dayStr} 
        className={cn(
          "calendar-cell rounded-lg", 
          isWeekend && "bg-gray-50",
          !isCurrentMonth && "opacity-40"
        )}
      >
        <div className={cn(
          "text-sm font-medium",
          isWeekend && "text-gray-500",
          !isCurrentMonth && "text-gray-400"
        )}>
          {dayNumber}
        </div>
        <div className="mt-2 space-y-2 max-h-20 overflow-y-auto">
          {sessionsForDay.map((session: any) => {
            if (!session || !session.subject) return null;
            const subject = session.subject.name || 'Untitled';
            const colorConfig = subjectColors[subject as keyof typeof subjectColors] || { 
              bg: "bg-gray-100", 
              border: "border-gray-400" 
            };
            
            return (
              <div 
                key={session.id}
                className={cn(
                  "p-2 rounded border-l-4 text-xs",
                  colorConfig.bg,
                  colorConfig.border
                )}
              >
                <div className="font-medium">{subject}: {session.topic || 'No topic'}</div>
                <div className="text-gray-500">
                  {session.startTime && format(new Date(session.startTime), 'h:mm')} - {session.endTime && format(new Date(session.endTime), 'h:mm a')}
                </div>
              </div>
            );
          }).filter(Boolean)}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">
          {view === "week" ? "This Week" : format(currentDate, "MMMM yyyy")}
        </h3>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={handlePrevious}>
            <span className="material-icons">chevron_left</span>
          </Button>
          <span>
            {format(startDate, "MMM d")} - {format(endDate, "MMM d")}
          </span>
          <Button variant="ghost" size="icon" onClick={handleNext}>
            <span className="material-icons">chevron_right</span>
          </Button>
          <div className="flex ml-4 border rounded overflow-hidden">
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
              variant={view === "month" ? "default" : "ghost"}
              className={cn(
                "px-3 py-1 h-auto text-sm rounded-none",
                view === "month" && "bg-primary text-white"
              )}
              onClick={() => setView("month")}
            >
              Month
            </Button>
          </div>
        </div>
      </div>

      {/* Days of the week header */}
      <div className="calendar-grid mb-2">
        {daysOfWeek.map((day, index) => (
          <div
            key={index}
            className={cn(
              "text-center text-sm font-medium py-2",
              index > 4 && "text-gray-500"
            )}
          >
            {format(day, "EEE")}
          </div>
        ))}
      </div>

      {/* Week view */}
      {view === "week" && (
        <div className="calendar-grid mb-2">
          {daysOfWeek.map((day, index) => renderDayCell(day, index > 4))}
        </div>
      )}

      {/* Month view */}
      {view === "month" && (
        <div className="mb-2">
          {weeksOfMonth.map((week, weekIndex) => (
            <div key={weekIndex} className="calendar-grid mb-1">
              {week.map((day, dayIndex) => renderDayCell(day, dayIndex > 4))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

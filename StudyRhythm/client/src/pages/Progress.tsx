import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog";
import CreateSubjectForm from "@/components/forms/CreateSubjectForm";
import { Plus } from "lucide-react";
import { format, subDays, startOfWeek, endOfWeek, addWeeks } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useMobile } from "@/hooks/use-mobile";

export default function ProgressPage() {
  const [timeRange, setTimeRange] = useState("week");
  const [activeTab, setActiveTab] = useState("overview");
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const isMobile = useMobile();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: progressData } = useQuery({
    queryKey: ["/api/progress", timeRange],
  });

  const { data: studyStats } = useQuery({
    queryKey: ["/api/stats/weekly"],
  });

  if (!progressData || !studyStats) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-medium mb-6">Progress Tracking</h2>
        <Card>
          <CardContent className="p-12 flex justify-center items-center">
            <div className="text-center">
              <span className="material-icons text-4xl mb-2 text-gray-400">hourglass_empty</span>
              <p className="text-gray-500">Loading progress data...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { subjects, totalProgress } = progressData;

  const subjectColors = {
    Mathematics: "bg-primary",
    "Computer Science": "bg-secondary",
    Physics: "bg-accent",
    Chemistry: "bg-danger",
  };

  const getSubjectColor = (subjectName: string, opacity = 1) => {
    const colors: { [key: string]: string } = {
      "Mathematics": `rgba(66, 133, 244, ${opacity})`,
      "Computer Science": `rgba(52, 168, 83, ${opacity})`,
      "Physics": `rgba(251, 188, 5, ${opacity})`,
      "Chemistry": `rgba(234, 67, 53, ${opacity})`,
    };
    return colors[subjectName] || `rgba(154, 160, 166, ${opacity})`;
  };

  // Helper function to format date ranges for the chart
  const formatDateRange = (weekIndex: number) => {
    const today = new Date();
    const startDate = startOfWeek(addWeeks(today, -weekIndex), { weekStartsOn: 1 });
    const endDate = endOfWeek(addWeeks(today, -weekIndex), { weekStartsOn: 1 });
    return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d')}`;
  };

  // Prepare data for the chart
  const chartData = studyStats.weeklyData.map((week: any, index: number) => ({
    name: formatDateRange(studyStats.weeklyData.length - 1 - index),
    ...week.subjectHours,
  }));

  // Extract subjects for the chart
  const chartSubjects = Object.keys(
    studyStats.weeklyData.reduce((acc: any, week: any) => {
      Object.keys(week.subjectHours).forEach(subject => {
        acc[subject] = true;
      });
      return acc;
    }, {})
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-medium">Progress Tracking</h2>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Time Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="subjects">By Subject</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">Overall Progress</h3>
              
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-1">
                  <span>Total Progress</span>
                  <span>{totalProgress.percentage}%</span>
                </div>
                <Progress value={totalProgress.percentage} />
                <div className="mt-2 text-sm text-gray-500">
                  {totalProgress.completedTopics} of {totalProgress.totalTopics} topics completed
                </div>
              </div>

              <h4 className="text-md font-medium mb-3">Progress by Subject</h4>
              <div className="space-y-4">
                {subjects.map((subject: any) => {
                  const bgColor = subjectColors[subject.name as keyof typeof subjectColors] || "bg-gray-400";
                  
                  return (
                    <div key={subject.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="flex items-center">
                          <div className={`w-3 h-3 rounded-full ${bgColor} mr-2`}></div>
                          {subject.name}
                        </span>
                        <span>{subject.progress}%</span>
                      </div>
                      <Progress 
                        value={subject.progress} 
                        color={
                          subject.name === "Mathematics" ? "primary" : 
                          subject.name === "Computer Science" ? "secondary" :
                          subject.name === "Physics" ? "accent" :
                          subject.name === "Chemistry" ? "danger" : "primary"
                        }
                      />
                      <div className="mt-1 text-xs text-gray-500">
                        {subject.completedTopics} of {subject.totalTopics} topics completed
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="charts">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">Study Time by Subject</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={isMobile ? -45 : 0} 
                      textAnchor={isMobile ? "end" : "middle"}
                      height={60}
                    />
                    <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    {chartSubjects.map((subject: string, index: number) => (
                      <Bar 
                        key={subject} 
                        dataKey={subject} 
                        name={subject}
                        stackId="a" 
                        fill={getSubjectColor(subject)} 
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subjects" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Subjects</h3>
            <Button onClick={() => setIsAddSubjectOpen(true)} size="sm" className="flex items-center gap-1">
              <Plus className="h-4 w-4" />
              <span>Add Subject</span>
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {subjects.map((subject: any) => {
            const color = getSubjectColor(subject.name);
            
            return (
              <Card key={subject.id}>
                <CardContent className="p-4">
                  <div className="flex items-center mb-3">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: color }}
                    ></div>
                    <h3 className="text-lg font-medium">{subject.name}</h3>
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Overall Progress</span>
                      <span>{subject.progress}%</span>
                    </div>
                    <Progress value={subject.progress} />
                  </div>
                  
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Topics completed:</span>
                      <span>{subject.completedTopics} / {subject.totalTopics}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Study sessions:</span>
                      <span>{subject.sessionCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total study time:</span>
                      <span>{subject.totalStudyTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last studied:</span>
                      <span>{subject.lastStudied ? format(new Date(subject.lastStudied), 'MMM d, yyyy') : 'N/A'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Add Subject Dialog */}
      <Dialog open={isAddSubjectOpen} onOpenChange={setIsAddSubjectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Subject</DialogTitle>
          </DialogHeader>
          <CreateSubjectForm onSuccess={(newSubject) => {
            setIsAddSubjectOpen(false);
            queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
            queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
            
            toast({
              title: "Subject created",
              description: `${newSubject.name} has been successfully created.`
            });
          }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

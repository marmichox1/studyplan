import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

export default function Profile() {
  const { user } = useAuth();
  
  interface StudyStats {
    totalStudyTime: string;
    topicsCompleted: number;
    sessionsCompleted: number;
    avgSessionLength: string;
    studyTimeChange: number;
    topicsCompletedChange: number;
    sessionsCompletedChange: number;
    avgSessionLengthChange: number;
  }

  const { data: stats, isLoading: statsLoading } = useQuery<StudyStats>({
    queryKey: ["/api/stats"],
  });

  // Create user initials from username or email
  const getUserInitials = () => {
    if (!user) return "";
    
    if (user.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    
    if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    
    return "U";
  };

  if (!user) {
    return null;
  }

  return (
    <div className="container py-8 px-4">
      <div className="flex flex-col items-center justify-center mb-8">
        <Avatar className="w-24 h-24 mb-4 bg-primary text-white text-3xl">
          <AvatarFallback>{getUserInitials()}</AvatarFallback>
        </Avatar>
        <h1 className="text-3xl font-bold">{user.username}</h1>
        <p className="text-muted-foreground">{user.email}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your personal account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="font-medium text-sm text-muted-foreground mb-1">Username</div>
              <div>{user.username}</div>
            </div>
            <div>
              <div className="font-medium text-sm text-muted-foreground mb-1">Email Address</div>
              <div>{user.email}</div>
            </div>
            <div>
              <div className="font-medium text-sm text-muted-foreground mb-1">Account Created</div>
              <div>{format(new Date(user.createdAt), 'MMMM d, yyyy')}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Study Statistics</CardTitle>
            <CardDescription>Your study progress overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {statsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : stats ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-primary/10 p-4 rounded-lg">
                    <div className="text-3xl font-bold text-primary">{stats.totalStudyTime || "0h"}</div>
                    <div className="text-sm text-muted-foreground">Total Study Time</div>
                  </div>
                  <div className="bg-green-500/10 p-4 rounded-lg">
                    <div className="text-3xl font-bold text-green-500">{stats.topicsCompleted || 0}</div>
                    <div className="text-sm text-muted-foreground">Completed Topics</div>
                  </div>
                  <div className="bg-yellow-500/10 p-4 rounded-lg">
                    <div className="text-3xl font-bold text-yellow-500">{stats.sessionsCompleted || 0}</div>
                    <div className="text-sm text-muted-foreground">Sessions Completed</div>
                  </div>
                  <div className="bg-blue-500/10 p-4 rounded-lg">
                    <div className="text-3xl font-bold text-blue-500">{stats.avgSessionLength || "0h"}</div>
                    <div className="text-sm text-muted-foreground">Avg Session Length</div>
                  </div>
                </div>
                <div className="pt-2">
                  <Link href="/progress">
                    <Button className="w-full" variant="outline">View Detailed Progress</Button>
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No study statistics available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

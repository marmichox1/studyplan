import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import CreateSubjectForm from "@/components/forms/CreateSubjectForm";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2 } from "lucide-react";

export default function SubjectsPage() {
  const { toast } = useToast();
  const [subjectToDelete, setSubjectToDelete] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [createSubjectDialogOpen, setCreateSubjectDialogOpen] = useState(false);

  interface Subject {
    id: number;
    name: string;
    color: string;
    topicsCount?: number;
    completedTopics?: number;
    progress?: number;
  }
  
  interface ProgressSubject {
    id: number;
    name: string;
    color: string;
    completedTopics: number;
    totalTopics: number;
    progress: number;
  }
  
  interface ProgressData {
    subjects: ProgressSubject[];
    totalProgress: {
      completedTopics: number;
      totalTopics: number;
      percentage: number;
    };
  }

  // Fetch subjects
  const { data: subjects, isLoading: subjectsLoading } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });

  // Fetch progress data
  const { data: progressData, isLoading: progressLoading } = useQuery<ProgressData>({
    queryKey: ["/api/progress"],
  });
  
  // Combine subjects with their progress
  const enrichedSubjects = useMemo(() => {
    if (!subjects || !progressData?.subjects) return [];
    
    return subjects.map(subject => {
      const progressInfo = progressData.subjects.find((s) => s.id === subject.id);
      return {
        ...subject,
        topicsCount: progressInfo?.totalTopics || 0,
        completedTopics: progressInfo?.completedTopics || 0,
        progress: progressInfo?.progress || 0
      };
    });
  }, [subjects, progressData]);
  
  const isLoading = subjectsLoading || progressLoading;

  // Delete subject mutation
  const deleteMutation = useMutation({
    mutationFn: async (subjectId: number) => {
      await apiRequest("DELETE", `/api/subjects/${subjectId}`);
    },
    onSuccess: () => {
      // Invalidate subjects query to refetch the data
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
      
      toast({
        title: "Subject deleted",
        description: "The subject has been successfully deleted.",
      });
      
      setDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete subject: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleDeleteClick = (id: number) => {
    setSubjectToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (subjectToDelete !== null) {
      deleteMutation.mutate(subjectToDelete);
    }
  };

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Subjects</h1>
        <Button 
          className="bg-primary"
          onClick={() => setCreateSubjectDialogOpen(true)}
        >
          Add New Subject
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Subjects</CardTitle>
          <CardDescription>
            View and manage your study subjects
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : enrichedSubjects.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Topics</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrichedSubjects.map((subject) => (
                  <TableRow key={subject.id}>
                    <TableCell className="font-medium">{subject.name}</TableCell>
                    <TableCell>
                      <div 
                        className="w-6 h-6 rounded-full" 
                        style={{ backgroundColor: subject.color }}
                      />
                    </TableCell>
                    <TableCell>{subject.completedTopics || 0} / {subject.topicsCount || 0}</TableCell>
                    <TableCell>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-green-500 h-2.5 rounded-full"
                          style={{ width: `${subject.progress || 0}%` }}
                        ></div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700 hover:bg-red-100"
                        onClick={() => handleDeleteClick(subject.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              No subjects found. Create your first subject to get started.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Subject Dialog */}
      <Dialog open={createSubjectDialogOpen} onOpenChange={setCreateSubjectDialogOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white">
          <div className="bg-secondary/10 p-4 border-b border-secondary/20">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-secondary">
                <span className="material-icons">bookmark</span>
                Create Subject
              </DialogTitle>
              <p className="text-sm text-gray-600">
                Add a new subject to organize your study materials and track progress.
              </p>
            </DialogHeader>
          </div>
          <div className="p-4">
            <CreateSubjectForm onSuccess={(newSubject) => {
              setCreateSubjectDialogOpen(false);
              queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
              queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
              
              toast({
                title: "Subject created",
                description: `${newSubject.name} has been successfully created.`
              });
            }} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Subject</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this subject? This action cannot be undone and will remove all related topics, sessions, and exams.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
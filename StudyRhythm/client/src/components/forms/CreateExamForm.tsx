import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";

interface CreateExamFormProps {
  onSuccess?: () => void;
}

const examSchema = z.object({
  title: z.string().min(2, { message: "Exam title must be at least 2 characters" }),
  subjectId: z.string().min(1, { message: "Please select a subject" }),
  date: z.date({ required_error: "Please select a date" }),
  time: z.string().min(1, { message: "Please enter a time" }),
  location: z.string().optional(),
  notes: z.string().optional(),
});

export default function CreateExamForm({ onSuccess }: CreateExamFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  interface Subject {
    id: number;
    name: string;
    color: string;
  }
  
  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });

  const form = useForm<z.infer<typeof examSchema>>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      title: "",
      subjectId: "",
      time: "09:00",
      location: "",
      notes: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof examSchema>) => {
    setIsSubmitting(true);
    
    try {
      // Format date and time into a single datetime string
      const dateTime = new Date(data.date);
      const [hours, minutes] = data.time.split(':').map(Number);
      dateTime.setHours(hours, minutes);
      
      const examData = {
        title: data.title,
        subjectId: parseInt(data.subjectId),
        date: dateTime.toISOString(),
        location: data.location || '',
        notes: data.notes || '',
      };

      console.log('Submitting exam with date:', examData.date);
      
      const response = await fetch("/api/exams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(examData),
      });

      if (!response.ok) {
        throw new Error("Failed to create exam");
      }

      const newExam = await response.json();
      
      // Invalidate and refetch exams
      queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/exams/upcoming"] });
      
      toast({
        title: "Exam Created",
        description: `${newExam.title} has been scheduled.`,
      });
      
      // Reset form
      form.reset();
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error creating exam:", error);
      toast({
        title: "Error",
        description: "Failed to create exam. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Exam Title</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input 
                    placeholder="e.g. Final Exam" 
                    {...field} 
                    className="pl-8"
                  />
                </FormControl>
                <span className="material-icons text-gray-400 text-base absolute left-2 top-1/2 -translate-y-1/2">
                  description
                </span>
              </div>
              <FormDescription className="text-xs">
                Enter a descriptive name for your exam
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="subjectId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger className="flex items-center">
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem 
                      key={subject.id} 
                      value={subject.id.toString()}
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: subject.color }}
                        />
                        {subject.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription className="text-xs">
                Choose the subject this exam is for
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col sm:flex-row gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className="w-full pl-3 text-left font-normal flex justify-between items-center"
                      >
                        {field.value ? (
                          <span>{format(field.value, "PPP")}</span>
                        ) : (
                          <span className="text-gray-400">Pick a date</span>
                        )}
                        <span className="material-icons text-gray-400 text-base">calendar_today</span>
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      className="rounded-md border shadow-sm"
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription className="text-xs">
                  Select the date of your exam
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Time</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input 
                      type="time" 
                      {...field} 
                      className="pl-8"
                    />
                  </FormControl>
                  <span className="material-icons text-gray-400 text-base absolute left-2 top-1/2 -translate-y-1/2">
                    schedule
                  </span>
                </div>
                <FormDescription className="text-xs">
                  Enter the start time of your exam
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location (optional)</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input 
                    placeholder="e.g. Room 101" 
                    {...field} 
                    className="pl-8"
                  />
                </FormControl>
                <span className="material-icons text-gray-400 text-base absolute left-2 top-1/2 -translate-y-1/2">
                  location_on
                </span>
              </div>
              <FormDescription className="text-xs">
                Specify where your exam will take place
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (optional)</FormLabel>
              <div className="relative">
                <FormControl>
                  <Textarea 
                    placeholder="Add any notes or topics to focus on"
                    className="resize-none pl-8 pt-2"
                    {...field}
                  />
                </FormControl>
                <span className="material-icons text-gray-400 text-base absolute left-2 top-3">
                  notes
                </span>
              </div>
              <FormDescription className="text-xs">
                Include any important details or topics to study
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          className="w-full mt-2" 
          disabled={isSubmitting}
          size="lg"
        >
          {isSubmitting ? (
            <>
              <span className="material-icons animate-spin mr-2">refresh</span>
              Creating...
            </>
          ) : (
            <>
              <span className="material-icons mr-2">add_task</span>
              Create Exam
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}

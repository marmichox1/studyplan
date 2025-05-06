import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog";

interface CreateSubjectFormProps {
  onSuccess?: (subject: any) => void;
}

const subjectSchema = z.object({
  name: z.string().min(2, { message: "Subject name must be at least 2 characters" }),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, { message: "Please enter a valid hex color code" }),
});

export default function CreateSubjectForm({ onSuccess }: CreateSubjectFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof subjectSchema>>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      name: "",
      color: "#4285F4", // Default to primary blue
    },
  });

  const predefinedColors = [
    { name: "Blue", value: "#4285F4" },
    { name: "Green", value: "#34A853" },
    { name: "Yellow", value: "#FBBC05" },
    { name: "Red", value: "#EA4335" },
    { name: "Purple", value: "#9C27B0" },
    { name: "Orange", value: "#FF9800" },
    { name: "Teal", value: "#009688" },
    { name: "Pink", value: "#E91E63" },
  ];

  async function onSubmit(data: z.infer<typeof subjectSchema>) {
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/subjects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        if (response.status === 409 && errorData.field === 'name' && errorData.error === 'duplicate') {
          form.setError('name', {
            type: 'manual',
            message: 'A subject with this name already exists'
          });
          throw new Error(errorData.message || 'A subject with this name already exists');
        }
        
        throw new Error(errorData.message || 'Failed to create subject');
      }

      const newSubject = await response.json();
      
      // Reset form
      form.reset();
      
      // Call onSuccess callback with the new subject if provided
      if (onSuccess) {
        onSuccess(newSubject);
      }
    } catch (error) {
      console.error("Error creating subject:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to create subject";
      
      // Don't show toast for duplicate name errors since we're showing the error in the form
      if (!errorMessage.includes("already exists")) {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Mathematics" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject Color</FormLabel>
              <div className="flex flex-wrap gap-2 mb-2">
                {predefinedColors.map((color) => (
                  <div 
                    key={color.value}
                    className={`w-8 h-8 rounded-full cursor-pointer border-2 ${field.value === color.value ? 'border-black' : 'border-transparent'}`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => form.setValue("color", color.value)}
                    title={color.name}
                  />
                ))}
              </div>
              <FormControl>
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full border"
                    style={{ backgroundColor: field.value }}
                  />
                  <Input {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Subject"}
        </Button>
      </form>
    </Form>
  );
}

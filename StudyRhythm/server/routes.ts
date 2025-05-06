import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSubjectSchema, insertSessionSchema, insertTopicSchema, insertExamSchema } from "@shared/schema";
import { format, parseISO, startOfDay } from "date-fns";
import { z } from "zod";
import { setupAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);
  
  // API Routes
  const apiPrefix = "/api";
  
  // Authentication middleware for protected routes
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  // Subjects Routes
  app.get(`${apiPrefix}/subjects`, requireAuth, async (req, res) => {
    try {
      const subjects = await storage.getAllSubjects(req.user?.id);
      res.json(subjects);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      res.status(500).json({ message: "Failed to fetch subjects" });
    }
  });

  app.get(`${apiPrefix}/subjects/:id`, requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const subject = await storage.getSubjectById(id);
      
      if (!subject) {
        return res.status(404).json({ message: "Subject not found" });
      }
      
      res.json(subject);
    } catch (error) {
      console.error("Error fetching subject:", error);
      res.status(500).json({ message: "Failed to fetch subject" });
    }
  });

  app.post(`${apiPrefix}/subjects`, requireAuth, async (req, res) => {
    try {
      const validatedData = insertSubjectSchema.parse({...req.body, userId: req.user?.id});
      const newSubject = await storage.insertSubject(validatedData);
      res.status(201).json(newSubject);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      
      // Check for duplicate key violation
      const errorObj = error as any;
      if (errorObj.code === '23505' && errorObj.constraint === 'subjects_name_unique') {
        return res.status(409).json({ 
          message: "A subject with this name already exists",
          field: "name",
          error: "duplicate"
        });
      }
      
      console.error("Error creating subject:", error);
      res.status(500).json({ message: "Failed to create subject" });
    }
  });

  app.delete(`${apiPrefix}/subjects/:id`, requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if subject exists
      const subject = await storage.getSubjectById(id);
      if (!subject) {
        return res.status(404).json({ message: "Subject not found" });
      }
      
      // Delete the subject
      const deletedSubject = await storage.deleteSubject(id);
      res.json(deletedSubject);
    } catch (error) {
      console.error("Error deleting subject:", error);
      res.status(500).json({ message: "Failed to delete subject" });
    }
  });

  // Sessions Routes
  app.get(`${apiPrefix}/sessions`, requireAuth, async (req, res) => {
    try {
      const { subject, status } = req.query;
      
      let sessions = await storage.getAllSessions(req.user?.id);
      
      // Apply subject filter if provided
      if (subject && subject !== 'all') {
        sessions = sessions.filter(session => session.subjectId === parseInt(subject as string));
      }
      
      // Apply status filter if provided
      if (status && status !== 'all') {
        sessions = sessions.map(session => {
          const now = new Date();
          const startTime = new Date(session.startTime);
          const endTime = new Date(session.endTime);
          
          let sessionStatus = 'upcoming';
          if (session.completedAt) {
            sessionStatus = 'completed';
          } else if (now >= startTime && now <= endTime) {
            sessionStatus = 'ongoing';
          }
          
          return { ...session, status: sessionStatus };
        }).filter(session => session.status === status);
      } else {
        // Add status to all sessions
        sessions = sessions.map(session => {
          const now = new Date();
          const startTime = new Date(session.startTime);
          const endTime = new Date(session.endTime);
          
          let status = 'upcoming';
          if (session.completedAt) {
            status = 'completed';
          } else if (now >= startTime && now <= endTime) {
            status = 'ongoing';
          }
          
          return { ...session, status };
        });
      }
      
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  app.get(`${apiPrefix}/sessions/all`, requireAuth, async (req, res) => {
    try {
      const sessions = await storage.getAllSessions(req.user?.id);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching all sessions:", error);
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  app.get(`${apiPrefix}/sessions/today`, requireAuth, async (req, res) => {
    try {
      const todaySessions = await storage.getTodaySessions(req.user?.id);
      
      // Enhance sessions with additional data
      const enhancedSessions = await Promise.all(
        todaySessions.map(async (session) => {
          // Calculate completed/total topics count
          const sessionTopicsCount = 5; // Mock value for now
          const completedTopicsCount = session.completedAt ? sessionTopicsCount : 0;
          
          return {
            ...session,
            totalTopicsCount: sessionTopicsCount,
            completedTopicsCount,
          };
        })
      );
      
      res.json(enhancedSessions);
    } catch (error) {
      console.error("Error fetching today's sessions:", error);
      res.status(500).json({ message: "Failed to fetch today's sessions" });
    }
  });

  app.get(`${apiPrefix}/sessions/:id`, requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const session = await storage.getSessionById(id);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      res.json(session);
    } catch (error) {
      console.error("Error fetching session:", error);
      res.status(500).json({ message: "Failed to fetch session" });
    }
  });

  app.post(`${apiPrefix}/sessions`, requireAuth, async (req, res) => {
    try {
      const validatedData = {
        subjectId: req.body.subjectId,
        topic: req.body.topic,
        date: req.body.date,
        startTime: req.body.startTime,
        endTime: req.body.endTime,
        durationHours: req.body.duration,
        notes: req.body.notes,
        userId: req.user?.id,
      };
      
      const newSession = await storage.insertSession(validatedData);
      res.status(201).json(newSession);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating session:", error);
      res.status(500).json({ message: "Failed to create session" });
    }
  });

  app.post(`${apiPrefix}/sessions/:id/complete`, requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const completedSession = await storage.completeSession(id);
      
      if (!completedSession) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      res.json(completedSession);
    } catch (error) {
      console.error("Error completing session:", error);
      res.status(500).json({ message: "Failed to complete session" });
    }
  });

  app.post(`${apiPrefix}/sessions/:id/start`, requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const session = await storage.getSessionById(id);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      // In a real application, you might update a "started" flag
      // For now, just return the session
      res.json(session);
    } catch (error) {
      console.error("Error starting session:", error);
      res.status(500).json({ message: "Failed to start session" });
    }
  });

  app.delete(`${apiPrefix}/sessions/:id`, requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deletedSession = await storage.deleteSession(id);
      
      if (!deletedSession) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      res.json({ message: "Session deleted successfully" });
    } catch (error) {
      console.error("Error deleting session:", error);
      res.status(500).json({ message: "Failed to delete session" });
    }
  });

  // Exams Routes
  app.get(`${apiPrefix}/exams`, requireAuth, async (req, res) => {
    try {
      const exams = await storage.getAllExams(req.user?.id);
      
      // Enhance exams with progress information
      const enhancedExams = await Promise.all(
        exams.map(async (exam) => {
          const { progress } = await storage.getExamProgress(exam.id);
          return { ...exam, progress };
        })
      );
      
      res.json(enhancedExams);
    } catch (error) {
      console.error("Error fetching exams:", error);
      res.status(500).json({ message: "Failed to fetch exams" });
    }
  });

  app.get(`${apiPrefix}/exams/upcoming`, requireAuth, async (req, res) => {
    try {
      const upcomingExams = await storage.getUpcomingExams(req.user?.id);
      
      // Enhance exams with progress information
      const enhancedExams = await Promise.all(
        upcomingExams.map(async (exam) => {
          const { progress } = await storage.getExamProgress(exam.id);
          return { ...exam, progress };
        })
      );
      
      res.json(enhancedExams);
    } catch (error) {
      console.error("Error fetching upcoming exams:", error);
      res.status(500).json({ message: "Failed to fetch upcoming exams" });
    }
  });

  app.get(`${apiPrefix}/exams/:id`, requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const exam = await storage.getExamById(id);
      
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      
      res.json(exam);
    } catch (error) {
      console.error("Error fetching exam:", error);
      res.status(500).json({ message: "Failed to fetch exam" });
    }
  });

  app.post(`${apiPrefix}/exams`, requireAuth, async (req, res) => {
    try {
      // Parse the date string to ensure it's valid
      let date = req.body.date;
      try {
        // Try to parse the date to ensure it's in a valid format
        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
          throw new Error('Invalid date format');
        }
        // Use the ISO string format
        date = parsedDate.toISOString();
      } catch (dateError) {
        console.error('Date parsing error:', dateError);
        return res.status(400).json({ message: 'Invalid date format' });
      }
      
      const examData = {
        subjectId: req.body.subjectId,
        title: req.body.title,
        date,
        location: req.body.location || '',
        notes: req.body.notes || '',
        userId: req.user?.id,
      };
      
      console.log('Creating exam with data:', examData);
      const newExam = await storage.insertExam(examData);
      res.status(201).json(newExam);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating exam:", error);
      res.status(500).json({ message: "Failed to create exam" });
    }
  });

  app.delete(`${apiPrefix}/exams/:id`, requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deletedExam = await storage.deleteExam(id);
      
      if (!deletedExam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      
      res.json({ message: "Exam deleted successfully" });
    } catch (error) {
      console.error("Error deleting exam:", error);
      res.status(500).json({ message: "Failed to delete exam" });
    }
  });

  // Progress Routes
  app.get(`${apiPrefix}/progress`, requireAuth, async (req, res) => {
    try {
      const timeRange = req.query.timeRange || 'week';
      // Pass the current user's ID to the getOverallProgress function
      const progress = await storage.getOverallProgress(req.user?.id);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching progress:", error);
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  // Stats Routes
  app.get(`${apiPrefix}/stats`, requireAuth, async (req, res) => {
    try {
      // Pass the current user's ID to the getStudyStats function
      const stats = await storage.getStudyStats(req.user?.id);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get(`${apiPrefix}/stats/weekly`, requireAuth, async (req, res) => {
    try {
      // Pass the current user's ID to the getWeeklyStudyStats function
      const weeklyStats = await storage.getWeeklyStudyStats(req.user?.id);
      res.json(weeklyStats);
    } catch (error) {
      console.error("Error fetching weekly stats:", error);
      res.status(500).json({ message: "Failed to fetch weekly stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

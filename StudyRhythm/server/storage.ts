import { db } from "@db";
import { and, asc, desc, eq, gte, lt, sql } from "drizzle-orm";
import {
  subjects,
  topics,
  sessions,
  sessionTopics,
  exams,
  examTopics,
  studyStats,
} from "@shared/schema";
import { addMinutes, format, parseISO, subDays, subMonths, subWeeks } from "date-fns";

export const storage = {
  // Subject operations
  async getAllSubjects(userId?: number) {
    // If no user ID is provided, return an empty array
    if (!userId) {
      return [];
    }
    
    return await db.query.subjects.findMany({
      where: eq(subjects.userId, userId),
      orderBy: asc(subjects.name),
    });
  },

  async getSubjectById(id: number) {
    return await db.query.subjects.findFirst({
      where: eq(subjects.id, id),
    });
  },

  async insertSubject(subject: typeof subjects.$inferInsert) {
    const [newSubject] = await db.insert(subjects).values(subject).returning();
    return newSubject;
  },

  async updateSubject(id: number, subject: Partial<typeof subjects.$inferInsert>) {
    const [updatedSubject] = await db
      .update(subjects)
      .set(subject)
      .where(eq(subjects.id, id))
      .returning();
    return updatedSubject;
  },

  async deleteSubject(id: number) {
    // Begin a transaction to ensure all operations succeed or fail together
    return await db.transaction(async (tx) => {
      // First, delete any exam topics related to this subject's exams
      const examsToDelete = await tx.query.exams.findMany({
        where: eq(exams.subjectId, id),
      });

      for (const exam of examsToDelete) {
        await tx.delete(examTopics).where(eq(examTopics.examId, exam.id));
      }
      
      // Delete exams related to this subject
      await tx.delete(exams).where(eq(exams.subjectId, id));
      
      // Delete session topics related to this subject's sessions
      const sessionsToDelete = await tx.query.sessions.findMany({
        where: eq(sessions.subjectId, id),
      });
      
      for (const session of sessionsToDelete) {
        await tx.delete(sessionTopics).where(eq(sessionTopics.sessionId, session.id));
      }
      
      // Delete sessions related to this subject
      await tx.delete(sessions).where(eq(sessions.subjectId, id));
      
      // Delete topics related to this subject
      await tx.delete(topics).where(eq(topics.subjectId, id));
      
      // Finally, delete the subject
      const [deletedSubject] = await tx
        .delete(subjects)
        .where(eq(subjects.id, id))
        .returning();
      
      return deletedSubject;
    });
  },

  // Topic operations
  async getAllTopics() {
    return await db.query.topics.findMany({
      with: {
        subject: true,
      },
      orderBy: [asc(topics.subjectId), asc(topics.name)],
    });
  },

  async getTopicsBySubject(subjectId: number) {
    return await db.query.topics.findMany({
      where: eq(topics.subjectId, subjectId),
      orderBy: asc(topics.name),
    });
  },

  async getTopicById(id: number) {
    return await db.query.topics.findFirst({
      where: eq(topics.id, id),
      with: {
        subject: true,
      },
    });
  },

  async insertTopic(topic: typeof topics.$inferInsert) {
    const [newTopic] = await db.insert(topics).values(topic).returning();
    return newTopic;
  },

  async updateTopic(id: number, topic: Partial<typeof topics.$inferInsert>) {
    const [updatedTopic] = await db
      .update(topics)
      .set(topic)
      .where(eq(topics.id, id))
      .returning();
    return updatedTopic;
  },

  async completeTopic(id: number) {
    const now = new Date().toISOString();
    const [completedTopic] = await db
      .update(topics)
      .set({ isCompleted: true, completedAt: now })
      .where(eq(topics.id, id))
      .returning();
    
    // Update study stats
    await db.update(studyStats)
      .set({ 
        topicsCompleted: sql`"topics_completed" + 1`,
        lastUpdated: now
      })
      .where(eq(studyStats.id, 1));
    
    return completedTopic;
  },

  async deleteTopic(id: number) {
    const [deletedTopic] = await db
      .delete(topics)
      .where(eq(topics.id, id))
      .returning();
    return deletedTopic;
  },

  // Session operations
  async getAllSessions(userId?: number) {
    // If no user ID is provided, return an empty array
    if (!userId) {
      return [];
    }
    
    return await db.query.sessions.findMany({
      where: eq(sessions.userId, userId),
      with: {
        subject: true,
      },
      orderBy: desc(sessions.date),
    });
  },

  async getSessionsBySubject(subjectId: number) {
    return await db.query.sessions.findMany({
      where: eq(sessions.subjectId, subjectId),
      with: {
        subject: true,
      },
      orderBy: desc(sessions.date),
    });
  },

  async getSessionsByDateRange(startDate: string, endDate: string, userId?: number) {
    // If no user ID is provided, return an empty array
    if (!userId) {
      return [];
    }
    
    return await db.query.sessions.findMany({
      where: and(
        gte(sessions.date, startDate),
        lt(sessions.date, endDate),
        eq(sessions.userId, userId)
      ),
      with: {
        subject: true,
      },
      orderBy: [asc(sessions.date), asc(sessions.startTime)],
    });
  },

  async getTodaySessions(userId?: number) {
    // If no user ID is provided, return an empty array
    if (!userId) {
      return [];
    }
    
    const today = format(new Date(), "yyyy-MM-dd");
    return await db.query.sessions.findMany({
      where: and(
        eq(sessions.date, today),
        eq(sessions.userId, userId)
      ),
      with: {
        subject: true,
      },
      orderBy: asc(sessions.startTime),
    });
  },

  async getSessionById(id: number) {
    return await db.query.sessions.findFirst({
      where: eq(sessions.id, id),
      with: {
        subject: true,
        sessionTopics: {
          with: {
            topic: true,
          },
        },
      },
    });
  },

  async insertSession(session: typeof sessions.$inferInsert) {
    const [newSession] = await db.insert(sessions).values(session).returning();
    return newSession;
  },

  async updateSession(id: number, session: Partial<typeof sessions.$inferInsert>) {
    const [updatedSession] = await db
      .update(sessions)
      .set(session)
      .where(eq(sessions.id, id))
      .returning();
    return updatedSession;
  },

  async completeSession(id: number) {
    const now = new Date().toISOString();
    const [completedSession] = await db
      .update(sessions)
      .set({ completedAt: now })
      .where(eq(sessions.id, id))
      .returning();
    
    // Update study stats
    await db.update(studyStats)
      .set({ 
        sessionsCompleted: sql`"sessions_completed" + 1`,
        totalStudyTime: sql`"total_study_time" + ${completedSession.durationHours * 60}`,
        lastUpdated: now
      })
      .where(eq(studyStats.id, 1));
    
    return completedSession;
  },

  async deleteSession(id: number) {
    return await db.transaction(async (tx) => {
      // First delete any session topics
      await tx.delete(sessionTopics).where(eq(sessionTopics.sessionId, id));
      
      // Then delete the session
      const [deletedSession] = await tx
        .delete(sessions)
        .where(eq(sessions.id, id))
        .returning();
      
      return deletedSession;
    });
  },

  // Exam operations
  async getAllExams(userId?: number) {
    // If no user ID is provided, return an empty array
    if (!userId) {
      return [];
    }
    
    return await db.query.exams.findMany({
      where: eq(exams.userId, userId),
      with: {
        subject: true,
      },
      orderBy: asc(exams.date),
    });
  },

  async getUpcomingExams(userId?: number, limit = 5) {
    // If no user ID is provided, return an empty array
    if (!userId) {
      return [];
    }
    
    const now = new Date().toISOString().split('T')[0]; // Get just the date part in YYYY-MM-DD format
    return await db.query.exams.findMany({
      where: and(
        gte(exams.date, now),
        eq(exams.userId, userId)
      ),
      with: {
        subject: true,
      },
      orderBy: asc(exams.date),
      limit,
    });
  },

  async getExamById(id: number) {
    return await db.query.exams.findFirst({
      where: eq(exams.id, id),
      with: {
        subject: true,
        examTopics: {
          with: {
            topic: true,
          },
        },
      },
    });
  },

  async insertExam(exam: typeof exams.$inferInsert) {
    const [newExam] = await db.insert(exams).values(exam).returning();
    return newExam;
  },

  async updateExam(id: number, exam: Partial<typeof exams.$inferInsert>) {
    const [updatedExam] = await db
      .update(exams)
      .set(exam)
      .where(eq(exams.id, id))
      .returning();
    return updatedExam;
  },

  async deleteExam(id: number) {
    return await db.transaction(async (tx) => {
      // First delete any associated exam topics
      await tx.delete(examTopics).where(eq(examTopics.examId, id));
      
      // Then delete the exam
      const [deletedExam] = await tx
        .delete(exams)
        .where(eq(exams.id, id))
        .returning();
      
      return deletedExam;
    });
  },

  // Session Topics operations
  async getSessionTopics(sessionId: number) {
    return await db.query.sessionTopics.findMany({
      where: eq(sessionTopics.sessionId, sessionId),
      with: {
        topic: true,
      },
    });
  },

  async insertSessionTopic(sessionTopic: typeof sessionTopics.$inferInsert) {
    const [newSessionTopic] = await db.insert(sessionTopics).values(sessionTopic).returning();
    return newSessionTopic;
  },

  async completeSessionTopic(id: number) {
    const now = new Date().toISOString();
    const [completedSessionTopic] = await db
      .update(sessionTopics)
      .set({ isCompleted: true, completedAt: now })
      .where(eq(sessionTopics.id, id))
      .returning();
    return completedSessionTopic;
  },

  async deleteSessionTopic(id: number) {
    const [deletedSessionTopic] = await db
      .delete(sessionTopics)
      .where(eq(sessionTopics.id, id))
      .returning();
    return deletedSessionTopic;
  },

  // Exam Topics operations
  async getExamTopics(examId: number) {
    return await db.query.examTopics.findMany({
      where: eq(examTopics.examId, examId),
      with: {
        topic: true,
      },
    });
  },

  async insertExamTopic(examTopic: typeof examTopics.$inferInsert) {
    const [newExamTopic] = await db.insert(examTopics).values(examTopic).returning();
    return newExamTopic;
  },

  async deleteExamTopic(id: number) {
    const [deletedExamTopic] = await db
      .delete(examTopics)
      .where(eq(examTopics.id, id))
      .returning();
    return deletedExamTopic;
  },

  // Progress tracking
  async getSubjectProgress(subjectId: number) {
    const result = await db.execute(sql`
      SELECT 
        COUNT(*) FILTER (WHERE t.is_completed = true) as completed_topics,
        COUNT(*) as total_topics
      FROM ${topics} t
      WHERE t.subject_id = ${subjectId}
    `);
    
    // Handle case where no topics exist for the subject
    if (!result[0]) {
      return {
        completedTopics: 0,
        totalTopics: 0,
        progress: 0,
      };
    }
    
    const { completed_topics, total_topics } = result[0] as { completed_topics: number, total_topics: number };
    const progress = total_topics > 0 ? Math.round((completed_topics / total_topics) * 100) : 0;
    
    return {
      completedTopics: completed_topics,
      totalTopics: total_topics,
      progress,
    };
  },

  async getOverallProgress(userId?: number) {
    // If no user ID is provided, return empty progress data
    if (!userId) {
      return {
        subjects: [],
        totalProgress: {
          completedTopics: 0,
          totalTopics: 0,
          percentage: 0,
        },
      };
    }
    
    const allSubjects = await this.getAllSubjects();
    // TODO: In the future, we should filter subjects by userId when that field is added
    const subjectsWithProgress = await Promise.all(
      allSubjects.map(async (subject) => {
        const progress = await this.getSubjectProgress(subject.id);
        
        // Get session count and study time
        const sessionResult = await db.execute(sql`
          SELECT 
            COUNT(*) as session_count,
            SUM(s.duration_hours) as total_study_time
          FROM ${sessions} s
          WHERE s.subject_id = ${subject.id}
        `);
        
        // Default values in case no sessions exist
        let session_count = 0;
        let total_study_time = 0;
        
        if (sessionResult[0]) {
          const result = sessionResult[0] as { 
            session_count: number, 
            total_study_time: number | null
          };
          
          session_count = result.session_count || 0;
          total_study_time = result.total_study_time || 0;
        }
        
        // Get last studied date
        const lastSessionResult = await db.execute(sql`
          SELECT MAX(s.start_time) as last_studied
          FROM ${sessions} s
          WHERE s.subject_id = ${subject.id} AND s.completed_at IS NOT NULL
        `);
        
        // Default value in case no last studied session
        let last_studied: string | null = null;
        
        if (lastSessionResult[0]) {
          const result = lastSessionResult[0] as { last_studied: string | null };
          last_studied = result.last_studied;
        }
        
        return {
          ...subject,
          ...progress,
          sessionCount: session_count || 0,
          totalStudyTime: total_study_time ? `${Math.floor(total_study_time)}h ${Math.round((total_study_time % 1) * 60)}m` : '0h 0m',
          lastStudied: last_studied,
        };
      })
    );
    
    // Calculate total progress
    const totalCompletedTopics = subjectsWithProgress.reduce((sum, subject) => sum + subject.completedTopics, 0);
    const totalTopics = subjectsWithProgress.reduce((sum, subject) => sum + subject.totalTopics, 0);
    const totalPercentage = totalTopics > 0 ? Math.round((totalCompletedTopics / totalTopics) * 100) : 0;
    
    return {
      subjects: subjectsWithProgress,
      totalProgress: {
        completedTopics: totalCompletedTopics,
        totalTopics,
        percentage: totalPercentage,
      },
    };
  },

  async getExamProgress(examId: number) {
    // Get all topics for the exam's subject
    const exam = await this.getExamById(examId);
    if (!exam) return { progress: 0 };
    
    const topicsForSubject = await this.getTopicsBySubject(exam.subjectId);
    const completedTopics = topicsForSubject.filter(topic => topic.isCompleted).length;
    const totalTopics = topicsForSubject.length;
    
    const progress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
    
    return { progress };
  },

  // Study Stats
  async getStudyStats(userId?: number) {
    // First try to get stats for this specific user
    let stats;
    
    if (userId) {
      stats = await db.query.studyStats.findFirst({
        where: eq(studyStats.userId, userId)
      });
      
      // If no stats found for this user, create a new record
      if (!stats) {
        // Try to insert a new stats record for this user
        try {
          const [newStats] = await db.insert(studyStats).values({
            userId: userId,
            totalStudyTime: 0,
            topicsCompleted: 0,
            sessionsCompleted: 0,
            lastUpdated: new Date()
          }).returning();
          
          stats = newStats;
        } catch (error) {
          console.error("Error creating study stats for user:", error);
          // Return empty stats instead of falling back to seeded data
          return {
            totalStudyTime: "0h 0m",
            topicsCompleted: 0,
            sessionsCompleted: 0,
            avgSessionLength: "0h 0m",
            studyTimeChange: 0,
            topicsCompletedChange: 0,
            sessionsCompletedChange: 0,
            avgSessionLengthChange: 0
          };
        }
      }
    } else {
      // No user ID provided, return empty stats
      return {
        totalStudyTime: "0h 0m",
        topicsCompleted: 0,
        sessionsCompleted: 0,
        avgSessionLength: "0h 0m",
        studyTimeChange: 0,
        topicsCompletedChange: 0,
        sessionsCompletedChange: 0,
        avgSessionLengthChange: 0
      };
    }
    
    if (!stats) {
      return {
        totalStudyTime: "0h 0m",
        topicsCompleted: 0,
        sessionsCompleted: 0,
        avgSessionLength: "0h 0m",
        studyTimeChange: 0,
        topicsCompletedChange: 0,
        sessionsCompletedChange: 0,
        avgSessionLengthChange: 0
      };
    }
    
    // Format total study time
    const hours = Math.floor(stats.totalStudyTime / 60);
    const minutes = stats.totalStudyTime % 60;
    const formattedStudyTime = `${hours}h ${minutes}m`;
    
    // Calculate average session length
    const avgSessionLengthMinutes = stats.sessionsCompleted > 0 
      ? Math.round(stats.totalStudyTime / stats.sessionsCompleted) 
      : 0;
    const avgHours = Math.floor(avgSessionLengthMinutes / 60);
    const avgMinutes = avgSessionLengthMinutes % 60;
    const formattedAvgLength = `${avgHours}h ${avgMinutes}m`;
    
    // Calculate changes from last week (this would typically involve more complex queries)
    // For demo purposes, we'll just use small random changes
    return {
      totalStudyTime: formattedStudyTime,
      topicsCompleted: stats.topicsCompleted,
      sessionsCompleted: stats.sessionsCompleted,
      avgSessionLength: formattedAvgLength,
      studyTimeChange: 15,  // percentage change
      topicsCompletedChange: 8,   // absolute change
      sessionsCompletedChange: 3,  // absolute change
      avgSessionLengthChange: 0    // no change
    };
  },

  async getWeeklyStudyStats(userId?: number) {
    // If no user ID is provided or if the user is new, return empty stats
    if (!userId) {
      return {
        weeklyData: [
          { weekIndex: 0, subjectHours: {} },
          { weekIndex: 1, subjectHours: {} },
          { weekIndex: 2, subjectHours: {} },
          { weekIndex: 3, subjectHours: {} }
        ]
      };
    }
    
    // Get study time by subject for the past few weeks
    const now = new Date();
    const fourWeeksAgo = format(subWeeks(now, 4), "yyyy-MM-dd");
    
    // Get all sessions in the last 4 weeks for this user
    const recentSessions = await db.query.sessions.findMany({
      where: and(
        gte(sessions.date, fourWeeksAgo),
        eq(sessions.userId, userId)
      ),
      with: {
        subject: true,
      },
    });
    
    // Group sessions by week and calculate hours by subject
    const weeklyData = [];
    for (let i = 0; i < 4; i++) {
      const weekStart = format(subWeeks(now, i + 1), "yyyy-MM-dd");
      const weekEnd = format(subWeeks(now, i), "yyyy-MM-dd");
      
      const weekSessions = recentSessions.filter(session => {
        return session.date >= weekStart && session.date < weekEnd;
      });
      
      // Group by subject
      const subjectHours: Record<string, number> = {};
      weekSessions.forEach(session => {
        const subject = session.subject.name;
        if (!subjectHours[subject]) {
          subjectHours[subject] = 0;
        }
        subjectHours[subject] += session.durationHours;
      });
      
      weeklyData.push({
        weekIndex: i,
        subjectHours,
      });
    }
    
    return {
      weeklyData: weeklyData.reverse(), // most recent week last
    };
  }
};

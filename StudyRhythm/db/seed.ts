import { db } from "./index";
import * as schema from "@shared/schema";
import { addDays, format, addHours, addMinutes } from "date-fns";

async function seed() {
  try {
    console.log("🌱 Starting database seeding...");

    // Delete any existing data first to avoid duplicates
    console.log("Cleaning existing data...");
    await db.delete(schema.sessionTopics);
    await db.delete(schema.examTopics);
    await db.delete(schema.topics);
    await db.delete(schema.sessions);
    await db.delete(schema.exams);
    await db.delete(schema.subjects);
    await db.delete(schema.studyStats);

    // Create subjects
    console.log("Creating subjects...");
    const subjects = [
      { name: "Mathematics", color: "#4285F4" },
      { name: "Computer Science", color: "#34A853" },
      { name: "Physics", color: "#FBBC05" },
      { name: "Chemistry", color: "#EA4335" },
    ];

    const createdSubjects = await db.insert(schema.subjects).values(subjects).returning();
    console.log(`Created ${createdSubjects.length} subjects`);

    // Create topics for each subject
    console.log("Creating topics...");
    const mathTopics = [
      { name: "Calculus: Limits", description: "Introduction to limits and continuity", isCompleted: true },
      { name: "Calculus: Derivatives", description: "Rules and applications of derivatives", isCompleted: true },
      { name: "Calculus: Integration", description: "Techniques of integration", isCompleted: false },
      { name: "Linear Algebra: Matrices", description: "Operations with matrices", isCompleted: false },
      { name: "Linear Algebra: Vector Spaces", description: "Vector spaces and subspaces", isCompleted: false },
    ];

    const csTopics = [
      { name: "Algorithms: Sorting", description: "Bubble, merge, quick sort algorithms", isCompleted: true },
      { name: "Algorithms: Searching", description: "Linear and binary search", isCompleted: true },
      { name: "Data Structures: Arrays", description: "Operations and applications", isCompleted: true },
      { name: "Data Structures: Linked Lists", description: "Implementation and operations", isCompleted: false },
      { name: "Data Structures: Trees", description: "Binary trees and traversals", isCompleted: false },
    ];

    const physicsTopics = [
      { name: "Mechanics: Kinematics", description: "Motion in one and two dimensions", isCompleted: true },
      { name: "Mechanics: Forces", description: "Newton's laws of motion", isCompleted: false },
      { name: "Mechanics: Energy", description: "Work, energy, and power", isCompleted: false },
      { name: "Mechanics: Momentum", description: "Linear and angular momentum", isCompleted: false },
      { name: "Electricity: Electrostatics", description: "Electric fields and Coulomb's law", isCompleted: false },
    ];

    const chemistryTopics = [
      { name: "Organic Chemistry: Alkanes", description: "Properties and reactions", isCompleted: true },
      { name: "Organic Chemistry: Alkenes", description: "Properties and reactions", isCompleted: false },
      { name: "Organic Chemistry: Alcohols", description: "Properties and reactions", isCompleted: false },
      { name: "Thermodynamics: Laws", description: "First and second laws of thermodynamics", isCompleted: false },
      { name: "Kinetics: Reaction Rates", description: "Factors affecting reaction rates", isCompleted: false },
    ];

    const mathSubject = createdSubjects.find(s => s.name === "Mathematics");
    const csSubject = createdSubjects.find(s => s.name === "Computer Science");
    const physicsSubject = createdSubjects.find(s => s.name === "Physics");
    const chemistrySubject = createdSubjects.find(s => s.name === "Chemistry");

    const createdMathTopics = await db.insert(schema.topics)
      .values(mathTopics.map(topic => ({ ...topic, subjectId: mathSubject!.id, completedAt: topic.isCompleted ? new Date() : null })))
      .returning();
    
    const createdCsTopics = await db.insert(schema.topics)
      .values(csTopics.map(topic => ({ ...topic, subjectId: csSubject!.id, completedAt: topic.isCompleted ? new Date() : null })))
      .returning();
    
    const createdPhysicsTopics = await db.insert(schema.topics)
      .values(physicsTopics.map(topic => ({ ...topic, subjectId: physicsSubject!.id, completedAt: topic.isCompleted ? new Date() : null })))
      .returning();
    
    const createdChemistryTopics = await db.insert(schema.topics)
      .values(chemistryTopics.map(topic => ({ ...topic, subjectId: chemistrySubject!.id, completedAt: topic.isCompleted ? new Date() : null })))
      .returning();

    console.log(`Created ${createdMathTopics.length + createdCsTopics.length + createdPhysicsTopics.length + createdChemistryTopics.length} topics`);

    // Create study sessions
    console.log("Creating study sessions...");
    const today = new Date();
    const yesterday = addDays(today, -1);
    const tomorrow = addDays(today, 1);
    const nextWeek = addDays(today, 7);
    
    const sessions = [
      // Today's sessions
      {
        subjectId: mathSubject!.id,
        topic: "Calculus: Integration Techniques",
        date: format(today, "yyyy-MM-dd"),
        startTime: addHours(today, 14), // 2:00 PM
        endTime: addHours(today, 16),   // 4:00 PM
        durationHours: 2,
        notes: "Focus on substitution and integration by parts",
        completedAt: null,
      },
      {
        subjectId: csSubject!.id,
        topic: "Algorithms: Sorting & Searching",
        date: format(today, "yyyy-MM-dd"),
        startTime: addHours(today, 10), // 10:00 AM
        endTime: addMinutes(addHours(today, 11), 30), // 11:30 AM
        durationHours: 2,
        notes: "Review quicksort and binary search implementations",
        completedAt: new Date(), // Already completed
      },
      {
        subjectId: physicsSubject!.id,
        topic: "Mechanics: Forces & Motion",
        date: format(today, "yyyy-MM-dd"),
        startTime: addHours(today, 15), // 3:00 PM
        endTime: addHours(today, 17),   // 5:00 PM
        durationHours: 2,
        notes: "Practice problems from Chapter 4",
        completedAt: null,
      },
      
      // Tomorrow's sessions
      {
        subjectId: chemistrySubject!.id,
        topic: "Organic Chemistry: Functional Groups",
        date: format(tomorrow, "yyyy-MM-dd"),
        startTime: addHours(tomorrow, 13), // 1:00 PM
        endTime: addHours(tomorrow, 15),   // 3:00 PM
        durationHours: 2,
        notes: "Review reaction mechanisms",
        completedAt: null,
      },
      
      // Sessions for the rest of the week
      {
        subjectId: mathSubject!.id,
        topic: "Linear Algebra: Vector Spaces",
        date: format(addDays(today, 2), "yyyy-MM-dd"),
        startTime: addHours(addDays(today, 2), 9), // 9:00 AM
        endTime: addMinutes(addHours(addDays(today, 2), 10), 30), // 10:30 AM
        durationHours: 2,
        notes: "Focus on basis and dimension",
        completedAt: null,
      },
      {
        subjectId: csSubject!.id,
        topic: "Data Structures: Trees",
        date: format(addDays(today, 4), "yyyy-MM-dd"),
        startTime: addHours(addDays(today, 4), 14), // 2:00 PM
        endTime: addHours(addDays(today, 4), 17),   // 5:00 PM
        durationHours: 3,
        notes: "Implement a binary search tree",
        completedAt: null,
      },
      {
        subjectId: physicsSubject!.id,
        topic: "Electricity: Circuits",
        date: format(addDays(today, 5), "yyyy-MM-dd"),
        startTime: addHours(addDays(today, 5), 10), // 10:00 AM
        endTime: addHours(addDays(today, 5), 12),   // 12:00 PM
        durationHours: 2,
        notes: "Practice problems on series and parallel circuits",
        completedAt: null,
      },
    ];

    const createdSessions = await db.insert(schema.sessions).values(sessions).returning();
    console.log(`Created ${createdSessions.length} study sessions`);

    // Create exams
    console.log("Creating exams...");
    const exams = [
      {
        subjectId: mathSubject!.id,
        title: "Linear Algebra Final",
        date: addDays(today, 23), // 23 days from now
        location: "Room 101, Math Building",
        notes: "Covers all topics from Chapters 1-7",
      },
      {
        subjectId: csSubject!.id,
        title: "Data Structures Midterm",
        date: addDays(today, 13), // 13 days from now
        location: "Computer Lab",
        notes: "Open book exam, bring your laptop",
      },
      {
        subjectId: physicsSubject!.id,
        title: "Mechanics Final Exam",
        date: addDays(today, 30), // 30 days from now
        location: "Physics Building, Auditorium",
        notes: "Comprehensive exam covering all mechanics topics",
      },
      {
        subjectId: chemistrySubject!.id,
        title: "Organic Chemistry Quiz",
        date: addDays(today, 7), // 7 days from now
        location: "Chemistry Lab",
        notes: "Focus on functional groups and reaction mechanisms",
      },
    ];

    const createdExams = await db.insert(schema.exams).values(exams).returning();
    console.log(`Created ${createdExams.length} exams`);

    // Initialize study stats
    console.log("Initializing study stats...");
    await db.insert(schema.studyStats).values({
      id: 1,
      userId: 1, // Default user ID
      totalStudyTime: 2550, // 42 hours and 30 minutes in minutes
      topicsCompleted: 8,
      sessionsCompleted: 15,
      lastUpdated: new Date(),
    });

    console.log("✅ Seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  }
}

seed();

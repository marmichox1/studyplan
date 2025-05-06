import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction, Router } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { User, users } from "@shared/schema";
import connectPg from "connect-pg-simple";
import { pool } from "../db";

declare global {
  namespace Express {
    // Define the User interface for Express
    interface User {
      id: number;
      email: string;
      username: string;
      password: string;
      createdAt: Date;
    }
  }
}

// Configure PostgreSQL session store
const PostgresSessionStore = connectPg(session);
const sessionStore = new PostgresSessionStore({ 
  pool,
  tableName: 'user_sessions', // Default table name
  createTableIfMissing: true
});

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const result = await db.select().from(users).where(eq(users.email, email));
  return result[0];
}

export async function getUser(id: number): Promise<User | undefined> {
  const result = await db.select().from(users).where(eq(users.id, id));
  return result[0];
}

export async function createUser(userData: { email: string, username: string, password: string }): Promise<User> {
  const hashedPassword = await hashPassword(userData.password);
  const [user] = await db.insert(users).values({
    ...userData,
    password: hashedPassword,
  }).returning();
  return user;
}

export function setupAuth(app: Express) {
  const router = Router();

  // Set up session middleware
  app.use(
    session({
      store: sessionStore,
      secret: process.env.SESSION_SECRET || "dev_secret_key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // Configure local strategy for username/password authentication
  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          const user = await getUserByEmail(email);
          if (!user || !(await comparePasswords(password, user.password))) {
            return done(null, false, { message: "Incorrect email or password" });
          }
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  // Configure serialization/deserialization
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Authentication routes
  router.post("/register", async (req, res, next) => {
    try {
      const existingUser = await getUserByEmail(req.body.email);
      if (existingUser) {
        res.status(400).json({ message: "Email already registered" });
        return;
      }

      const user = await createUser(req.body);
      req.login(user, (err) => {
        if (err) {
          next(err);
          return;
        }
        // Return user data without password
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/login", (req, res, next) => {
    passport.authenticate("local", (err: Error, user: User, info: { message: string }) => {
      if (err) {
        next(err);
        return;
      }
      if (!user) {
        res.status(401).json({ message: info.message || "Authentication failed" });
        return;
      }
      req.login(user, (err) => {
        if (err) {
          next(err);
          return;
        }
        // Return user data without password
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      });
    })(req, res, next);
  });

  router.post("/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) {
        next(err);
        return;
      }
      res.status(200).json({ message: "Successfully logged out" });
    });
  });

  router.get("/user", (req, res, next) => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }
    // Return user data without password
    const { password, ...userWithoutPassword } = req.user as User;
    res.json(userWithoutPassword);
  });

  // Mount all auth routes under /api
  app.use("/api", router);
}

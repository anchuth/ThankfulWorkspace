import { InsertUser, User, Thanks, InsertThanks, users, thanks } from "@shared/schema";
import session from "express-session";
import { db } from "./db";
import { eq, desc, and, gte } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsersByManagerId(managerId: number): Promise<User[]>;
  getAllUsers(): Promise<User[]>;
  updateUserManager(userId: number, managerId: number | null): Promise<User>;
  createThanks(fromId: number, thanks: InsertThanks): Promise<Thanks>;
  getThanksById(id: number): Promise<Thanks | undefined>;
  getPendingThanksForManager(managerId: number): Promise<Thanks[]>;
  updateThanksStatus(id: number, status: "approved" | "rejected"): Promise<Thanks>;
  getReceivedThanksForUser(userId: number): Promise<Thanks[]>;
  getSentThanksForUser(userId: number): Promise<Thanks[]>;
  getRankings(period: "week" | "month" | "quarter" | "year"): Promise<{userId: number, points: number}[]>;
  sessionStore: session.Store;
  updateUserPassword(userId: number, newPassword: string): Promise<User>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getUsersByManagerId(managerId: number): Promise<User[]> {
    return await db.select().from(users).where(eq(users.managerId, managerId));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUserManager(userId: number, managerId: number | null): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ managerId })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async createThanks(fromId: number, insertThanks: InsertThanks): Promise<Thanks> {
    const [thanks] = await db
      .insert(thanks)
      .values({
        fromId,
        toId: insertThanks.toId,
        message: insertThanks.message,
      })
      .returning();
    return thanks;
  }

  async getThanksById(id: number): Promise<Thanks | undefined> {
    const [thanks] = await db.select().from(thanks).where(eq(thanks.id, id));
    return thanks;
  }

  async getPendingThanksForManager(managerId: number): Promise<Thanks[]> {
    const managedUsers = await this.getUsersByManagerId(managerId);
    const managedUserIds = managedUsers.map((u) => u.id);

    return await db
      .select()
      .from(thanks)
      .where(
        and(
          eq(thanks.status, "pending"),
          thanks.toId.in(managedUserIds)
        )
      );
  }

  async updateThanksStatus(id: number, status: "approved" | "rejected"): Promise<Thanks> {
    const [updated] = await db
      .update(thanks)
      .set({
        status,
        approvedAt: status === "approved" ? new Date() : null,
      })
      .where(eq(thanks.id, id))
      .returning();
    return updated;
  }

  async getReceivedThanksForUser(userId: number): Promise<Thanks[]> {
    return await db
      .select()
      .from(thanks)
      .where(
        and(
          eq(thanks.toId, userId),
          eq(thanks.status, "approved")
        )
      )
      .orderBy(desc(thanks.createdAt));
  }

  async getSentThanksForUser(userId: number): Promise<Thanks[]> {
    return await db
      .select()
      .from(thanks)
      .where(eq(thanks.fromId, userId))
      .orderBy(desc(thanks.createdAt));
  }

  async getRankings(period: "week" | "month" | "quarter" | "year"): Promise<{userId: number, points: number}[]> {
    const now = new Date();
    let cutoff = new Date();

    switch (period) {
      case "week":
        cutoff.setDate(now.getDate() - 7);
        break;
      case "month":
        cutoff.setMonth(now.getMonth() - 1);
        break;
      case "quarter":
        cutoff.setMonth(now.getMonth() - 3);
        break;
      case "year":
        cutoff.setFullYear(now.getFullYear() - 1);
        break;
    }

    const thanksRows = await db
      .select({
        userId: thanks.toId,
        points: thanks.points,
      })
      .from(thanks)
      .where(
        and(
          eq(thanks.status, "approved"),
          gte(thanks.approvedAt, cutoff)
        )
      );

    const pointsMap = new Map<number, number>();
    thanksRows.forEach(({ userId, points }) => {
      const current = pointsMap.get(userId) || 0;
      pointsMap.set(userId, current + points);
    });

    return Array.from(pointsMap.entries())
      .map(([userId, points]) => ({ userId, points }))
      .sort((a, b) => b.points - a.points);
  }
  async updateUserPassword(userId: number, newPassword: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ password: newPassword })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }
}

export const storage = new DatabaseStorage();
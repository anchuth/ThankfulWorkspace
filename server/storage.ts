import { InsertUser, User, Thanks, InsertThanks, users, thanks } from "@shared/schema";
import session from "express-session";
import { db } from "./db";
import { eq, desc, and, gte, sql, inArray, or } from "drizzle-orm";
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
  getAllPendingThanks(): Promise<Thanks[]>;
  getAllThanks(): Promise<Thanks[]>;
  updateThanksStatus(id: number, status: "approved" | "rejected", approvedById: number, reason?: string): Promise<Thanks>;
  getReceivedThanksForUser(userId: number): Promise<Thanks[]>;
  getSentThanksForUser(userId: number): Promise<Thanks[]>;
  getRankings(period: "week" | "month" | "quarter" | "year"): Promise<{userId: number, points: number}[]>;
  sessionStore: session.Store;
  updateUserPassword(userId: number, newPassword: string): Promise<User>;
  getRecentThanks(): Promise<Thanks[]>;
  updateUserRole(userId: number, role: string): Promise<User>;
  updateUserInfo(userId: number, info: { title?: string; department?: string }): Promise<User>;
  deleteUser(userId: number): Promise<void>;
  updateThanksContent(id: number, data: { message?: string; fromId?: number; toId?: number; status?: "pending" | "approved" | "rejected"; approvedById?: number | null; approvedAt?: Date | null; rejectReason?: string | null; }): Promise<Thanks>;
  deleteThanks(id: number): Promise<void>;
  createManyUsers(users: InsertUser[]): Promise<User[]>;
  getUserByEmail(email: string): Promise<User | undefined>;
  updateManyUsers(userIds: number[], info: { title?: string; department?: string; managerId?: number | null }): Promise<User[]>;
  deleteManyUsers(userIds: number[]): Promise<void>;
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
    const [newThanks] = await db
      .insert(thanks)
      .values({
        fromId,
        toId: insertThanks.toId,
        message: insertThanks.message,
      })
      .returning();
    return newThanks;
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
          inArray(thanks.toId, managedUserIds)
        )
      );
  }

  async getAllPendingThanks(): Promise<Thanks[]> {
    return await db
      .select()
      .from(thanks)
      .where(eq(thanks.status, "pending"))
      .orderBy(desc(thanks.createdAt));
  }

  async getAllThanks(): Promise<Thanks[]> {
    return await db
      .select()
      .from(thanks)
      .orderBy(desc(thanks.createdAt));
  }

  async updateThanksStatus(
    id: number,
    status: "approved" | "rejected",
    approvedById: number,
    reason?: string
  ): Promise<Thanks> {
    const [updated] = await db
      .update(thanks)
      .set({
        status,
        approvedAt: status === "approved" ? new Date() : null,
        approvedById,
        rejectReason: status === "rejected" ? reason : null,
      })
      .where(eq(thanks.id, id))
      .returning();
    return updated;
  }

  async getReceivedThanksForUser(userId: number): Promise<Thanks[]> {
    return await db
      .select()
      .from(thanks)
      .where(eq(thanks.toId, userId))
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
  async getRecentThanks(): Promise<Thanks[]> {
    return await db
      .select()
      .from(thanks)
      .where(eq(thanks.status, "approved"))
      .orderBy(desc(thanks.createdAt))
      .limit(5);
  }
  async updateUserRole(userId: number, role: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }
  async updateUserInfo(userId: number, info: { title?: string; department?: string }): Promise<User> {
    const [user] = await db
      .update(users)
      .set(info)
      .where(eq(users.id, userId))
      .returning();
    return user;
  }
  async deleteUser(userId: number): Promise<void> {
    try {
      await db.transaction(async (tx) => {
        // First update users who have this user as their manager to have no manager
        await tx
          .update(users)
          .set({ managerId: null })
          .where(eq(users.managerId, userId));

        // Delete all thanks related to this user
        await tx
          .delete(thanks)
          .where(
            or(
              eq(thanks.fromId, userId),
              eq(thanks.toId, userId),
              eq(thanks.approvedById, userId)
            )
          );

        // Then delete the user
        await tx
          .delete(users)
          .where(eq(users.id, userId));
      });
    } catch (error) {
      console.error("Transaction error while deleting user:", error);
      throw error;
    }
  }
  async updateThanksContent(id: number, data: { 
    message?: string; 
    fromId?: number;
    toId?: number;
    status?: "pending" | "approved" | "rejected";
    approvedById?: number | null;
    approvedAt?: Date | null;
    rejectReason?: string | null;
  }): Promise<Thanks> {
    const [updated] = await db
      .update(thanks)
      .set(data)
      .where(eq(thanks.id, id))
      .returning();
    return updated;
  }
  async deleteThanks(id: number): Promise<void> {
    await db
      .delete(thanks)
      .where(eq(thanks.id, id));
  }
  async createManyUsers(insertUsers: InsertUser[]): Promise<User[]> {
    const createdUsers = await db
      .insert(users)
      .values(insertUsers)
      .returning();
    return createdUsers;
  }
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async updateManyUsers(
    userIds: number[],
    info: { title?: string; department?: string; managerId?: number | null }
  ): Promise<User[]> {
    const updatedUsers = await db
      .update(users)
      .set(info)
      .where(inArray(users.id, userIds))
      .returning();
    return updatedUsers;
  }
  async deleteManyUsers(userIds: number[]): Promise<void> {
    try {
      // Validate that all IDs are numbers
      const validIds = userIds.filter(id => !isNaN(id) && Number.isInteger(id));

      if (validIds.length === 0) {
        return; // No valid IDs to delete
      }

      await db.transaction(async (tx) => {
        // First update users who have these users as their manager to have no manager
        await tx
          .update(users)
          .set({ managerId: null })
          .where(inArray(users.managerId, validIds));

        // Delete all thanks related to these users
        await tx
          .delete(thanks)
          .where(
            or(
              inArray(thanks.fromId, validIds),
              inArray(thanks.toId, validIds),
              inArray(thanks.approvedById, validIds)
            )
          );

        // Then delete the users
        await tx
          .delete(users)
          .where(inArray(users.id, validIds));
      });
    } catch (error) {
      console.error("Transaction error while deleting users:", error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
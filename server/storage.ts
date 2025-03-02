import { InsertUser, User, Thanks, InsertThanks } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsersByManagerId(managerId: number): Promise<User[]>;
  getAllUsers(): Promise<User[]>;
  createThanks(fromId: number, thanks: InsertThanks): Promise<Thanks>;
  getThanksById(id: number): Promise<Thanks | undefined>;
  getPendingThanksForManager(managerId: number): Promise<Thanks[]>;
  updateThanksStatus(id: number, status: "approved" | "rejected"): Promise<Thanks>;
  getReceivedThanksForUser(userId: number): Promise<Thanks[]>;
  getSentThanksForUser(userId: number): Promise<Thanks[]>;
  getRankings(period: "week" | "month" | "quarter" | "year"): Promise<{userId: number, points: number}[]>;
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private thanks: Map<number, Thanks>;
  private currentUserId: number;
  private currentThanksId: number;
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.thanks = new Map();
    this.currentUserId = 1;
    this.currentThanksId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id, role: "employee" };
    this.users.set(id, user);
    return user;
  }

  async getUsersByManagerId(managerId: number): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.managerId === managerId,
    );
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createThanks(fromId: number, thanks: InsertThanks): Promise<Thanks> {
    const id = this.currentThanksId++;
    const newThanks: Thanks = {
      id,
      fromId,
      toId: thanks.toId,
      message: thanks.message,
      createdAt: new Date(),
      status: "pending",
      approvedAt: null,
      points: 1,
    };
    this.thanks.set(id, newThanks);
    return newThanks;
  }

  async getThanksById(id: number): Promise<Thanks | undefined> {
    return this.thanks.get(id);
  }

  async getPendingThanksForManager(managerId: number): Promise<Thanks[]> {
    const managedUsers = await this.getUsersByManagerId(managerId);
    const managedUserIds = new Set(managedUsers.map((u) => u.id));
    
    return Array.from(this.thanks.values()).filter(
      (thanks) => thanks.status === "pending" && managedUserIds.has(thanks.toId),
    );
  }

  async updateThanksStatus(id: number, status: "approved" | "rejected"): Promise<Thanks> {
    const thanks = await this.getThanksById(id);
    if (!thanks) throw new Error("Thanks not found");
    
    const updated: Thanks = {
      ...thanks,
      status,
      approvedAt: status === "approved" ? new Date() : null,
    };
    this.thanks.set(id, updated);
    return updated;
  }

  async getReceivedThanksForUser(userId: number): Promise<Thanks[]> {
    return Array.from(this.thanks.values()).filter(
      (thanks) => thanks.toId === userId && thanks.status === "approved",
    );
  }

  async getSentThanksForUser(userId: number): Promise<Thanks[]> {
    return Array.from(this.thanks.values()).filter(
      (thanks) => thanks.fromId === userId,
    );
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

    const pointsMap = new Map<number, number>();
    
    Array.from(this.thanks.values())
      .filter((thanks) => thanks.status === "approved" && thanks.approvedAt! >= cutoff)
      .forEach((thanks) => {
        const current = pointsMap.get(thanks.toId) || 0;
        pointsMap.set(thanks.toId, current + thanks.points);
      });

    return Array.from(pointsMap.entries())
      .map(([userId, points]) => ({ userId, points }))
      .sort((a, b) => b.points - a.points);
  }
}

export const storage = new MemStorage();

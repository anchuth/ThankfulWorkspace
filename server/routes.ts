import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertThanksSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Get all users (for user selection)
  app.get("/api/users", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const users = await storage.getAllUsers();
    res.json(users);
  });

  // Get recent thanks
  app.get("/api/thanks/recent", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const thanks = await storage.getRecentThanks();
    res.json(thanks);
  });

  // Get users managed by a manager
  app.get("/api/users/manager/:managerId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user!.role !== "manager") return res.sendStatus(403);

    const managerId = parseInt(req.params.managerId);
    if (managerId !== req.user!.id) return res.sendStatus(403);

    const users = await storage.getUsersByManagerId(managerId);
    res.json(users);
  });

  // Update user's manager (admin only)
  app.patch("/api/users/:userId/manager", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user!.role !== "admin") return res.sendStatus(403);

    const userId = parseInt(req.params.userId);
    const { managerId } = req.body;

    const user = await storage.updateUserManager(userId, managerId);
    res.json(user);
  });

  // Send thanks
  app.post("/api/thanks", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const parsed = insertThanksSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);

    if (parsed.data.toId === req.user!.id) {
      return res.status(400).send("Cannot send thanks to yourself");
    }

    const thanks = await storage.createThanks(req.user!.id, parsed.data);
    res.json(thanks);
  });

  // Get pending approvals for manager
  app.get("/api/approvals", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user!.role !== "manager" && req.user!.role !== "admin") return res.sendStatus(403);

    let approvals;
    if (req.user!.role === "admin") {
      approvals = await storage.getAllPendingThanks();
    } else {
      approvals = await storage.getPendingThanksForManager(req.user!.id);
    }
    res.json(approvals);
  });

  // Approve/reject thanks
  app.post("/api/thanks/:id/:action", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user!.role !== "manager" && req.user!.role !== "admin") return res.sendStatus(403);

    const { id, action } = req.params;
    const { reason } = req.body;

    if (action !== "approve" && action !== "reject") {
      return res.status(400).send("Invalid action");
    }

    if (action === "reject" && !reason) {
      return res.status(400).send("Reject reason is required");
    }

    const thanks = await storage.updateThanksStatus(
      parseInt(id),
      action === "approve" ? "approved" : "rejected",
      req.user!.id,
      reason
    );
    res.json(thanks);
  });

  // Get rankings
  app.get("/api/rankings/:period", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const period = req.params.period as "week" | "month" | "quarter" | "year";
    if (!["week", "month", "quarter", "year"].includes(period)) {
      return res.status(400).send("Invalid period");
    }

    const rankings = await storage.getRankings(period);
    res.json(rankings);
  });

  // Get user stats
  app.get("/api/stats/:userId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const userId = parseInt(req.params.userId);
    const [received, sent] = await Promise.all([
      storage.getReceivedThanksForUser(userId),
      storage.getSentThanksForUser(userId)
    ]);

    res.json({ received, sent });
  });

  const httpServer = createServer(app);
  return httpServer;
}
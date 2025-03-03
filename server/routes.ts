import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertThanksSchema, insertUserSchema } from "@shared/schema";
import { hashPassword } from './utils'; // Assuming hashPassword function exists

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Get all thanks (admin only)
  app.get("/api/admin/thanks", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user!.role !== "admin") return res.sendStatus(403);

    const thanks = await storage.getAllThanks();
    res.json(thanks);
  });

  // Update thanks (admin only)
  app.patch("/api/admin/thanks/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user!.role !== "admin") return res.sendStatus(403);

    const id = parseInt(req.params.id);
    const { message, fromId, toId, status, approvedById, rejectReason } = req.body;

    const thanks = await storage.updateThanksContent(id, {
      message,
      fromId,
      toId,
      status,
      approvedById: status === "approved" ? approvedById : null,
      approvedAt: status === "approved" ? new Date() : null,
      rejectReason: status === "rejected" ? rejectReason : null,
    });
    res.json(thanks);
  });

  // Delete thanks (admin only)
  app.delete("/api/admin/thanks/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user!.role !== "admin") return res.sendStatus(403);

    const id = parseInt(req.params.id);
    await storage.deleteThanks(id);
    res.sendStatus(200);
  });

  // Get all users (for user selection)
  app.get("/api/users", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const users = await storage.getAllUsers();
    res.json(users);
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

  // Update user's role (admin only)
  app.patch("/api/users/:userId/role", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user!.role !== "admin") return res.sendStatus(403);

    const userId = parseInt(req.params.userId);
    const { role } = req.body;

    // Validate role
    if (!["employee", "manager"].includes(role)) {
      return res.status(400).send("Invalid role");
    }

    const user = await storage.updateUserRole(userId, role);
    res.json(user);
  });

  // Update user information (admin only)
  app.patch("/api/users/:userId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user!.role !== "admin") return res.sendStatus(403);

    const userId = parseInt(req.params.userId);
    const { title, department, email } = req.body;

    // Validate email format
    const parsed = insertUserSchema.pick({ email: true }).safeParse({ email });
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }

    // Check if email already exists for another user
    if (email) {
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).send("Email đã được sử dụng bởi người khác");
      }
    }

    const user = await storage.updateUserInfo(userId, { title, department, email });
    res.json(user);
  });

  // Delete user (admin only)
  app.delete("/api/users/:userId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user!.role !== "admin") return res.sendStatus(403);

    const userId = parseInt(req.params.userId);

    try {
      // Không cho phép xóa admin
      const user = await storage.getUser(userId);
      if (!user || user.role === "admin") {
        return res.status(400).send("Cannot delete admin user");
      }

      // Check if the user is a manager with employees
      const employees = await storage.getUsersByManagerId(userId);
      if (employees.length > 0) {
        return res.status(400).send("Không thể xóa nhân viên này vì họ đang là quản lý của nhân viên khác");
      }

      await storage.deleteUser(userId);
      res.sendStatus(200);
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).send("Không thể xóa nhân viên do có lỗi xảy ra");
    }
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

  // Update the bulk import endpoint with proper validation
  app.post("/api/users/bulk-import", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user!.role !== "admin") return res.sendStatus(403);

    const { users, defaultPassword } = req.body;
    if (!Array.isArray(users)) {
      return res.status(400).send("Invalid data format");
    }

    if (!defaultPassword || !defaultPassword.trim()) {
      return res.status(400).send("Default password is required");
    }

    try {
      const BATCH_SIZE = 100; // Process 100 users at a time

      // Transform imported data to match our schema
      const transformedUsers = users.map(user => ({
        username: user.username,
        password: defaultPassword.trim(), // Will be hashed below
        name: `${user.first_name} ${user.last_name}`,
        title: user.position,
        department: user.department,
        role: "employee", // Default role
        email: user.email || `${user.username}@example.com` // Ensure email exists
      }));

      // Check for duplicates
      const existingUsers = await storage.getAllUsers();
      const existingUsernames = new Set(existingUsers.map(u => u.username));
      const existingEmails = new Set(existingUsers.map(u => u.email));

      const duplicates = [];
      const validUsers = [];

      // Validate and filter users
      for (const [index, user] of transformedUsers.entries()) {
        const parsed = insertUserSchema.safeParse(user);

        if (!parsed.success) {
          duplicates.push({
            row: index + 1,
            username: user.username,
            errors: parsed.error.errors.map(e => e.message)
          });
          continue;
        }

        if (existingUsernames.has(user.username) || existingEmails.has(user.email)) {
          duplicates.push({
            row: index + 1,
            username: user.username,
            email: user.email,
            reason: existingUsernames.has(user.username) ? "Username đã tồn tại" : "Email đã tồn tại"
          });
        } else {
          validUsers.push(user);
          // Add to sets to check for duplicates in remaining rows
          existingUsernames.add(user.username);
          existingEmails.add(user.email);
        }
      }

      // Process valid users in batches
      const results = [];
      for (let i = 0; i < validUsers.length; i += BATCH_SIZE) {
        const batch = validUsers.slice(i, i + BATCH_SIZE);
        const hashedPasswords = await Promise.all(
          batch.map(user => hashPassword(user.password))
        );
        const batchWithHashedPasswords = batch.map((user, index) => ({
          ...user,
          password: hashedPasswords[index]
        }));
        const createdUsers = await storage.createManyUsers(batchWithHashedPasswords);
        results.push(...createdUsers);
      }

      res.json({
        success: true,
        total: results.length,
        skipped: duplicates,
        users: results
      });
    } catch (error) {
      console.error("Bulk import error:", error);
      res.status(500).send("Failed to import users");
    }
  });

  // Update the bulk update endpoint with proper validation
  app.patch("/api/users/bulk-update", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user!.role !== "admin") return res.sendStatus(403);

    const { employeeIds, title, department, managerId } = req.body;

    if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
      return res.status(400).send("No employees selected");
    }

    try {
      // Ensure all IDs are numbers
      const numericIds = employeeIds.map(id =>
        typeof id === 'string' ? parseInt(id, 10) : id
      ).filter(id => !isNaN(id));

      if (numericIds.length === 0) {
        return res.status(400).send("No valid employee IDs provided");
      }

      // Don't allow updating admin users
      const users = await storage.getAllUsers();
      const adminIds = new Set(users.filter(u => u.role === "admin").map(u => u.id));
      const validIds = numericIds.filter(id => !adminIds.has(id));

      if (validIds.length === 0) {
        return res.status(400).send("Cannot update admin users");
      }

      // Prepare update data with only defined fields
      const updateData: { title?: string; department?: string; managerId?: number | null } = {};

      if (typeof title === 'string' && title.trim()) {
        updateData.title = title.trim();
      }

      if (typeof department === 'string' && department.trim()) {
        updateData.department = department.trim();
      }

      // Only update managerId if it's explicitly set
      if (managerId !== undefined && managerId !== "unchanged") {
        if (managerId === "none" || managerId === null) {
          updateData.managerId = null;
        } else {
          try {
            // Convert string to number if needed
            const managerIdNum = typeof managerId === 'string' ? parseInt(managerId, 10) : managerId;
            if (!isNaN(managerIdNum)) {
              updateData.managerId = managerIdNum;
            } else {
              return res.status(400).send("Invalid manager ID format");
            }
          } catch (error) {
            return res.status(400).send("Invalid manager ID format");
          }
        }
      }

      // Validate managerId if set
      if (updateData.managerId !== undefined && updateData.managerId !== null) {
        const managerExists = users.some(u => u.id === updateData.managerId);
        if (!managerExists) {
          return res.status(400).send("Invalid manager ID");
        }
      }

      // Update users
      const updatedUsers = await storage.updateManyUsers(validIds, updateData);

      res.json(updatedUsers);
    } catch (error) {
      console.error("Bulk update error:", error);
      res.status(500).send("Failed to update users");
    }
  });


  // Add new reset password endpoint
  app.post("/api/users/:userId/reset-password", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user!.role !== "admin") return res.sendStatus(403);

    const userId = parseInt(req.params.userId);
    const { newPassword } = req.body;

    if (!newPassword || !newPassword.trim()) {
      return res.status(400).send("Mật khẩu mới không được để trống");
    }

    try {
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).send("Không tìm thấy người dùng");
      }

      // Don't allow resetting admin passwords
      if (user.role === "admin") {
        return res.status(403).send("Không thể reset mật khẩu của admin");
      }

      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUserPassword(userId, hashedPassword);

      res.sendStatus(200);
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).send("Không thể reset mật khẩu");
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
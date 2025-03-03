import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(), // Employee ID
  email: text("email").notNull().unique(), // Add email field
  password: text("password").notNull(),
  name: text("name").notNull(),
  title: text("title"), // Chức danh
  department: text("department"), // Bộ phận
  managerId: integer("manager_id").references(() => users.id),
  role: text("role", { enum: ["employee", "manager", "admin"] }).notNull().default("employee"),
});

// Thanks table
export const thanks = pgTable("thanks", {
  id: serial("id").primaryKey(),
  fromId: integer("from_id").notNull().references(() => users.id),
  toId: integer("to_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
  approvedAt: timestamp("approved_at"),
  approvedById: integer("approved_by_id").references(() => users.id),
  points: integer("points").notNull().default(1),
  rejectReason: text("reject_reason"),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  manager: one(users, {
    fields: [users.managerId],
    references: [users.id],
  }),
  employees: many(users, {
    fields: [users.id],
    references: [users.managerId],
  }),
  thanksReceived: many(thanks, {
    fields: [users.id],
    references: [thanks.toId],
  }),
  thanksSent: many(thanks, {
    fields: [users.id],
    references: [thanks.fromId],
  }),
  thanksApproved: many(thanks, {
    fields: [users.id],
    references: [thanks.approvedById],
  }),
}));

export const thanksRelations = relations(thanks, ({ one }) => ({
  sender: one(users, {
    fields: [thanks.fromId],
    references: [users.id],
  }),
  receiver: one(users, {
    fields: [thanks.toId],
    references: [users.id],
  }),
  approvedBy: one(users, {
    fields: [thanks.approvedById],
    references: [users.id],
  }),
}));

// Schemas for validation
export const insertUserSchema = createInsertSchema(users)
  .pick({
    username: true,
    password: true,
    name: true,
    managerId: true,
    title: true,
    department: true,
    email: true,
  })
  .extend({
    managerId: z.number().optional(),
    title: z.string().optional(),
    department: z.string().optional(),
    email: z.string().email("Email không hợp lệ"),
  });

export const insertThanksSchema = createInsertSchema(thanks)
  .pick({
    toId: true,
    message: true,
  });

// Types for TypeScript
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Thanks = typeof thanks.$inferSelect;
export type InsertThanks = z.infer<typeof insertThanksSchema>;
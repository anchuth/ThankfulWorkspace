import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(), // Employee ID
  password: text("password").notNull(),
  name: text("name").notNull(),
  managerId: integer("manager_id").references(() => users.id),
  role: text("role", { enum: ["employee", "manager", "admin"] }).notNull().default("employee"),
});

export const thanks = pgTable("thanks", {
  id: serial("id").primaryKey(),
  fromId: integer("from_id").notNull().references(() => users.id),
  toId: integer("to_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
  approvedAt: timestamp("approved_at"),
  points: integer("points").notNull().default(1),
});

export const insertUserSchema = createInsertSchema(users)
  .pick({
    username: true,
    password: true,
    name: true,
    managerId: true,
  })
  .extend({
    managerId: z.number().optional(),
  });

export const insertThanksSchema = createInsertSchema(thanks)
  .pick({
    toId: true,
    message: true,
  });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Thanks = typeof thanks.$inferSelect;
export type InsertThanks = z.infer<typeof insertThanksSchema>;

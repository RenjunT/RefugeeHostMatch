import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User roles enum
export const userRoleEnum = pgEnum("user_role", ["refugee", "host", "admin"]);

// Profile status enum
export const profileStatusEnum = pgEnum("profile_status", ["pending", "approved", "rejected"]);

// Contract status enum
export const contractStatusEnum = pgEnum("contract_status", ["proposed", "signed_refugee", "signed_host", "completed", "cancelled"]);

// Message status enum
export const messageStatusEnum = pgEnum("message_status", ["sent", "delivered", "read"]);

// User storage table - required for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").notNull().default("refugee"),
  profileStatus: profileStatusEnum("profile_status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Refugee profiles
export const refugeeProfiles = pgTable("refugee_profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  familySize: integer("family_size").notNull(),
  estimatedStay: varchar("estimated_stay").notNull(), // "1-3 months", "3-6 months", etc.
  medicalNeeds: text("medical_needs"),
  specialRequirements: text("special_requirements"),
  languages: text("languages").array(), 
  countryOfOrigin: varchar("country_of_origin"),
  phoneNumber: varchar("phone_number"),
  emergencyContact: varchar("emergency_contact"),
  additionalInfo: text("additional_info"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Host profiles
export const hostProfiles = pgTable("host_profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  accommodationType: varchar("accommodation_type").notNull(), // "apartment", "house", "room"
  maxOccupants: integer("max_occupants").notNull(),
  availabilityDuration: varchar("availability_duration").notNull(),
  description: text("description"),
  houseRules: text("house_rules"),
  amenities: text("amenities").array(),
  location: varchar("location").notNull(),
  address: text("address"),
  phoneNumber: varchar("phone_number"),
  petFriendly: boolean("pet_friendly").default(false),
  smokingAllowed: boolean("smoking_allowed").default(false),
  accessibilityFeatures: text("accessibility_features"),
  criminalRecordChecked: boolean("criminal_record_checked").default(false),
  backgroundCheckDate: timestamp("background_check_date"),
  additionalInfo: text("additional_info"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Document uploads (for hosts' criminal records, apartment photos, etc.)
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  fileName: varchar("file_name").notNull(),
  fileType: varchar("file_type").notNull(),
  fileUrl: varchar("file_url").notNull(),
  documentType: varchar("document_type").notNull(), // "criminal_record", "apartment_photo", "id_document"
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// Messages between users
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: varchar("sender_id").references(() => users.id).notNull(),
  receiverId: varchar("receiver_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  status: messageStatusEnum("status").notNull().default("sent"),
  createdAt: timestamp("created_at").defaultNow(),
  readAt: timestamp("read_at"),
});

// Contracts between refugees and hosts
export const contracts = pgTable("contracts", {
  id: serial("id").primaryKey(),
  refugeeId: varchar("refugee_id").references(() => users.id).notNull(),
  hostId: varchar("host_id").references(() => users.id).notNull(),
  status: contractStatusEnum("status").notNull().default("proposed"),
  terms: text("terms").notNull(),
  duration: varchar("duration").notNull(),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  refugeeSignedAt: timestamp("refugee_signed_at"),
  hostSignedAt: timestamp("host_signed_at"),
  adminApprovedAt: timestamp("admin_approved_at"),
  adminApprovedBy: varchar("admin_approved_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  type: varchar("type").notNull(), // "approval", "message", "contract", "system"
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Feedback and complaints
export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  type: varchar("type").notNull(), // "feedback", "complaint", "suggestion"
  subject: varchar("subject").notNull(),
  content: text("content").notNull(),
  status: varchar("status").notNull().default("pending"), // "pending", "in_progress", "resolved"
  adminResponse: text("admin_response"),
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  refugeeProfile: one(refugeeProfiles, {
    fields: [users.id],
    references: [refugeeProfiles.userId],
  }),
  hostProfile: one(hostProfiles, {
    fields: [users.id],
    references: [hostProfiles.userId],
  }),
  documents: many(documents),
  sentMessages: many(messages, { relationName: "sender" }),
  receivedMessages: many(messages, { relationName: "receiver" }),
  refugeeContracts: many(contracts, { relationName: "refugee" }),
  hostContracts: many(contracts, { relationName: "host" }),
  notifications: many(notifications),
  feedback: many(feedback),
}));

export const refugeeProfilesRelations = relations(refugeeProfiles, ({ one }) => ({
  user: one(users, {
    fields: [refugeeProfiles.userId],
    references: [users.id],
  }),
}));

export const hostProfilesRelations = relations(hostProfiles, ({ one }) => ({
  user: one(users, {
    fields: [hostProfiles.userId],
    references: [users.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  user: one(users, {
    fields: [documents.userId],
    references: [users.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "sender",
  }),
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id],
    relationName: "receiver",
  }),
}));

export const contractsRelations = relations(contracts, ({ one }) => ({
  refugee: one(users, {
    fields: [contracts.refugeeId],
    references: [users.id],
    relationName: "refugee",
  }),
  host: one(users, {
    fields: [contracts.hostId],
    references: [users.id],
    relationName: "host",
  }),
  adminApprover: one(users, {
    fields: [contracts.adminApprovedBy],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const feedbackRelations = relations(feedback, ({ one }) => ({
  user: one(users, {
    fields: [feedback.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  role: true,
});

export const insertRefugeeProfileSchema = createInsertSchema(refugeeProfiles).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertHostProfileSchema = createInsertSchema(hostProfiles).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  readAt: true,
});

export const insertContractSchema = createInsertSchema(contracts).omit({
  id: true,
  refugeeSignedAt: true,
  hostSignedAt: true,
  adminApprovedAt: true,
  adminApprovedBy: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertFeedbackSchema = createInsertSchema(feedback).omit({
  id: true,
  createdAt: true,
  resolvedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type RefugeeProfile = typeof refugeeProfiles.$inferSelect;
export type InsertRefugeeProfile = z.infer<typeof insertRefugeeProfileSchema>;
export type HostProfile = typeof hostProfiles.$inferSelect;
export type InsertHostProfile = z.infer<typeof insertHostProfileSchema>;
export type Document = typeof documents.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Contract = typeof contracts.$inferSelect;
export type InsertContract = z.infer<typeof insertContractSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Feedback = typeof feedback.$inferSelect;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;

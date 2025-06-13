import {
  users,
  refugeeProfiles,
  hostProfiles,
  documents,
  messages,
  contracts,
  notifications,
  feedback,
  type User,
  type UpsertUser,
  type RefugeeProfile,
  type InsertRefugeeProfile,
  type HostProfile,
  type InsertHostProfile,
  type Document,
  type Message,
  type InsertMessage,
  type Contract,
  type InsertContract,
  type Notification,
  type InsertNotification,
  type Feedback,
  type InsertFeedback,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, asc } from "drizzle-orm";

export interface IStorage {
  // User operations - required for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Profile operations
  createRefugeeProfile(profile: InsertRefugeeProfile & { userId: string }): Promise<RefugeeProfile>;
  createHostProfile(profile: InsertHostProfile & { userId: string }): Promise<HostProfile>;
  getRefugeeProfile(userId: string): Promise<RefugeeProfile | undefined>;
  getHostProfile(userId: string): Promise<HostProfile | undefined>;
  updateProfileStatus(userId: string, status: "pending" | "approved" | "rejected"): Promise<void>;
  
  // Get users with profiles for admin review
  getPendingProfiles(): Promise<(User & { refugeeProfile?: RefugeeProfile; hostProfile?: HostProfile })[]>;
  getApprovedHosts(): Promise<(User & { hostProfile: HostProfile })[]>;
  getApprovedRefugees(): Promise<(User & { refugeeProfile: RefugeeProfile })[]>;
  
  // Message operations
  sendMessage(message: InsertMessage): Promise<Message>;
  getConversation(userId1: string, userId2: string): Promise<Message[]>;
  getUserMessages(userId: string): Promise<Message[]>;
  markMessageAsRead(messageId: number): Promise<void>;
  
  // Contract operations
  createContract(contract: InsertContract): Promise<Contract>;
  getContract(id: number): Promise<Contract | undefined>;
  signContract(contractId: number, userType: "refugee" | "host"): Promise<void>;
  approveContract(contractId: number, adminId: string): Promise<void>;
  getUserContracts(userId: string): Promise<Contract[]>;
  
  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: string): Promise<Notification[]>;
  markNotificationAsRead(notificationId: number): Promise<void>;
  
  // Feedback operations
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;
  getFeedback(): Promise<Feedback[]>;
  
  // Statistics
  getStatistics(): Promise<{
    pendingApprovals: number;
    activeMatches: number;
    registeredRefugees: number;
    verifiedHosts: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Profile operations
  async createRefugeeProfile(profile: InsertRefugeeProfile & { userId: string }): Promise<RefugeeProfile> {
    const [refugeeProfile] = await db
      .insert(refugeeProfiles)
      .values(profile)
      .returning();
    return refugeeProfile;
  }

  async createHostProfile(profile: InsertHostProfile & { userId: string }): Promise<HostProfile> {
    const [hostProfile] = await db
      .insert(hostProfiles)
      .values(profile)
      .returning();
    return hostProfile;
  }

  async getRefugeeProfile(userId: string): Promise<RefugeeProfile | undefined> {
    const [profile] = await db
      .select()
      .from(refugeeProfiles)
      .where(eq(refugeeProfiles.userId, userId));
    return profile;
  }

  async getHostProfile(userId: string): Promise<HostProfile | undefined> {
    const [profile] = await db
      .select()
      .from(hostProfiles)
      .where(eq(hostProfiles.userId, userId));
    return profile;
  }

  async updateProfileStatus(userId: string, status: "pending" | "approved" | "rejected"): Promise<void> {
    await db
      .update(users)
      .set({ profileStatus: status, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async getPendingProfiles(): Promise<(User & { refugeeProfile?: RefugeeProfile; hostProfile?: HostProfile })[]> {
    const pendingUsers = await db
      .select()
      .from(users)
      .where(eq(users.profileStatus, "pending"));

    const result = [];
    for (const user of pendingUsers) {
      const refugeeProfile = await this.getRefugeeProfile(user.id);
      const hostProfile = await this.getHostProfile(user.id);
      result.push({ ...user, refugeeProfile, hostProfile });
    }
    return result;
  }

  async getApprovedHosts(): Promise<(User & { hostProfile: HostProfile })[]> {
    const approvedHosts = await db
      .select()
      .from(users)
      .innerJoin(hostProfiles, eq(users.id, hostProfiles.userId))
      .where(and(eq(users.profileStatus, "approved"), eq(users.role, "host")));

    return approvedHosts.map(row => ({
      ...row.users,
      hostProfile: row.host_profiles,
    }));
  }

  async getApprovedRefugees(): Promise<(User & { refugeeProfile: RefugeeProfile })[]> {
    const approvedRefugees = await db
      .select()
      .from(users)
      .innerJoin(refugeeProfiles, eq(users.id, refugeeProfiles.userId))
      .where(and(eq(users.profileStatus, "approved"), eq(users.role, "refugee")));

    return approvedRefugees.map(row => ({
      ...row.users,
      refugeeProfile: row.refugee_profiles,
    }));
  }

  // Message operations
  async sendMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async getConversation(userId1: string, userId2: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(
        or(
          and(eq(messages.senderId, userId1), eq(messages.receiverId, userId2)),
          and(eq(messages.senderId, userId2), eq(messages.receiverId, userId1))
        )
      )
      .orderBy(asc(messages.createdAt));
  }

  async getUserMessages(userId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)))
      .orderBy(desc(messages.createdAt));
  }

  async markMessageAsRead(messageId: number): Promise<void> {
    await db
      .update(messages)
      .set({ status: "read", readAt: new Date() })
      .where(eq(messages.id, messageId));
  }

  // Contract operations
  async createContract(contract: InsertContract): Promise<Contract> {
    const [newContract] = await db.insert(contracts).values(contract).returning();
    return newContract;
  }

  async getContract(id: number): Promise<Contract | undefined> {
    const [contract] = await db.select().from(contracts).where(eq(contracts.id, id));
    return contract;
  }

  async signContract(contractId: number, userType: "refugee" | "host"): Promise<void> {
    const updateData = userType === "refugee" 
      ? { refugeeSignedAt: new Date() }
      : { hostSignedAt: new Date() };

    await db
      .update(contracts)
      .set(updateData)
      .where(eq(contracts.id, contractId));
  }

  async approveContract(contractId: number, adminId: string): Promise<void> {
    await db
      .update(contracts)
      .set({ 
        adminApprovedAt: new Date(),
        adminApprovedBy: adminId,
        status: "completed"
      })
      .where(eq(contracts.id, contractId));
  }

  async getUserContracts(userId: string): Promise<Contract[]> {
    return await db
      .select()
      .from(contracts)
      .where(or(eq(contracts.refugeeId, userId), eq(contracts.hostId, userId)))
      .orderBy(desc(contracts.createdAt));
  }

  // Notification operations
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async markNotificationAsRead(notificationId: number): Promise<void> {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, notificationId));
  }

  // Feedback operations
  async createFeedback(feedback: InsertFeedback): Promise<Feedback> {
    const [newFeedback] = await db.insert(feedback).values(feedback).returning();
    return newFeedback;
  }

  async getFeedback(): Promise<Feedback[]> {
    return await db
      .select()
      .from(feedback)
      .orderBy(desc(feedback.createdAt));
  }

  // Statistics
  async getStatistics(): Promise<{
    pendingApprovals: number;
    activeMatches: number;
    registeredRefugees: number;
    verifiedHosts: number;
  }> {
    const [pendingCount] = await db
      .select({ count: eq(users.profileStatus, "pending") })
      .from(users);

    const [activeContracts] = await db
      .select({ count: eq(contracts.status, "completed") })
      .from(contracts);

    const [refugeeCount] = await db
      .select({ count: eq(users.role, "refugee") })
      .from(users);

    const [hostCount] = await db
      .select({ count: and(eq(users.role, "host"), eq(users.profileStatus, "approved")) })
      .from(users);

    return {
      pendingApprovals: pendingCount?.count || 0,
      activeMatches: activeContracts?.count || 0,
      registeredRefugees: refugeeCount?.count || 0,
      verifiedHosts: hostCount?.count || 0,
    };
  }
}

export const storage = new DatabaseStorage();

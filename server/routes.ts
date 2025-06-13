import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertRefugeeProfileSchema, 
  insertHostProfileSchema,
  insertMessageSchema,
  insertContractSchema,
  insertNotificationSchema,
  insertFeedbackSchema 
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post('/api/auth/update-role', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { role } = req.body;
      
      if (!['refugee', 'host', 'admin'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      
      await storage.updateUserRole(userId, role);
      res.json({ message: "Role updated successfully" });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update role" });
    }
  });

  // Profile routes
  app.post('/api/profiles/refugee', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profileData = insertRefugeeProfileSchema.parse(req.body);
      const profile = await storage.createRefugeeProfile({ ...profileData, userId });
      
      // Create notification for admin
      await storage.createNotification({
        userId: "admin", // In real app, get actual admin ID
        title: "New Refugee Profile",
        content: `New refugee profile submitted by ${req.user.claims.first_name || "User"}`,
        type: "approval"
      });
      
      res.json(profile);
    } catch (error) {
      console.error("Error creating refugee profile:", error);
      res.status(400).json({ message: "Failed to create profile" });
    }
  });

  app.post('/api/profiles/host', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const profileData = insertHostProfileSchema.parse(req.body);
      const profile = await storage.createHostProfile({ ...profileData, userId });
      
      // Create notification for admin
      await storage.createNotification({
        userId: "admin", // In real app, get actual admin ID
        title: "New Host Profile",
        content: `New host profile submitted by ${req.user.claims.first_name || "User"}`,
        type: "approval"
      });
      
      res.json(profile);
    } catch (error) {
      console.error("Error creating host profile:", error);
      res.status(400).json({ message: "Failed to create profile" });
    }
  });

  app.get('/api/profiles/refugee/:userId', isAuthenticated, async (req, res) => {
    try {
      const profile = await storage.getRefugeeProfile(req.params.userId);
      res.json(profile);
    } catch (error) {
      console.error("Error fetching refugee profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.get('/api/profiles/host/:userId', isAuthenticated, async (req, res) => {
    try {
      const profile = await storage.getHostProfile(req.params.userId);
      res.json(profile);
    } catch (error) {
      console.error("Error fetching host profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Admin routes
  app.get('/api/admin/pending-profiles', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const profiles = await storage.getPendingProfiles();
      res.json(profiles);
    } catch (error) {
      console.error("Error fetching pending profiles:", error);
      res.status(500).json({ message: "Failed to fetch profiles" });
    }
  });

  app.post('/api/admin/approve-profile', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { userId, approved } = req.body;
      const status = approved ? "approved" : "rejected";
      await storage.updateProfileStatus(userId, status);

      // Create notification for user
      await storage.createNotification({
        userId,
        title: `Profile ${approved ? 'Approved' : 'Rejected'}`,
        content: `Your profile has been ${approved ? 'approved' : 'rejected'} by the admin team.`,
        type: "approval"
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error updating profile status:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.get('/api/admin/statistics', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const stats = await storage.getStatistics();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching statistics:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Matching routes
  app.get('/api/hosts/available', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.profileStatus !== 'approved') {
        return res.status(403).json({ message: "Profile must be approved to view hosts" });
      }
      
      const hosts = await storage.getApprovedHosts();
      res.json(hosts);
    } catch (error) {
      console.error("Error fetching available hosts:", error);
      res.status(500).json({ message: "Failed to fetch hosts" });
    }
  });

  // Message routes
  app.post('/api/messages', isAuthenticated, async (req: any, res) => {
    try {
      const senderId = req.user.claims.sub;
      const messageData = insertMessageSchema.parse({ ...req.body, senderId });
      const message = await storage.sendMessage(messageData);
      
      // Broadcast message via WebSocket if connected
      const wsMessage = JSON.stringify({
        type: 'new_message',
        data: message
      });
      
      // Send to all connected clients (in real app, filter by user)
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(wsMessage);
        }
      });
      
      res.json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(400).json({ message: "Failed to send message" });
    }
  });

  app.get('/api/messages/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      const otherUserId = req.params.userId;
      const messages = await storage.getConversation(currentUserId, otherUserId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.get('/api/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const messages = await storage.getUserMessages(userId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching user messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Contract routes
  app.post('/api/contracts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      const contractData = insertContractSchema.parse(req.body);
      
      // Set the correct user ID based on role
      if (user?.role === 'refugee') {
        contractData.refugeeId = userId;
      } else if (user?.role === 'host') {
        contractData.hostId = userId;
      }
      
      const contract = await storage.createContract(contractData);
      
      // Notify the other party
      const notifyUserId = user?.role === 'refugee' ? contractData.hostId : contractData.refugeeId;
      await storage.createNotification({
        userId: notifyUserId,
        title: "New Contract Proposal",
        content: "You have received a new contract proposal",
        type: "contract"
      });
      
      res.json(contract);
    } catch (error) {
      console.error("Error creating contract:", error);
      res.status(400).json({ message: "Failed to create contract" });
    }
  });

  app.post('/api/contracts/:id/sign', isAuthenticated, async (req: any, res) => {
    try {
      const contractId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== 'refugee' && user.role !== 'host')) {
        return res.status(403).json({ message: "Only refugees and hosts can sign contracts" });
      }
      
      await storage.signContract(contractId, user.role);
      
      // Check if both parties have signed
      const contract = await storage.getContract(contractId);
      if (contract?.refugeeSignedAt && contract?.hostSignedAt) {
        // Notify admin for final approval
        await storage.createNotification({
          userId: "admin", // In real app, get actual admin ID
          title: "Contract Ready for Approval",
          content: "A contract has been signed by both parties and needs admin approval",
          type: "contract"
        });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error signing contract:", error);
      res.status(500).json({ message: "Failed to sign contract" });
    }
  });

  app.post('/api/contracts/:id/approve', isAuthenticated, async (req: any, res) => {
    try {
      const contractId = parseInt(req.params.id);
      const adminId = req.user.claims.sub;
      const user = await storage.getUser(adminId);
      
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      await storage.approveContract(contractId, adminId);
      
      // Get contract details to notify both parties
      const contract = await storage.getContract(contractId);
      if (contract) {
        await storage.createNotification({
          userId: contract.refugeeId,
          title: "Contract Approved",
          content: "Your housing contract has been approved by admin",
          type: "contract"
        });
        
        await storage.createNotification({
          userId: contract.hostId,
          title: "Contract Approved",
          content: "Your hosting contract has been approved by admin",
          type: "contract"
        });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error approving contract:", error);
      res.status(500).json({ message: "Failed to approve contract" });
    }
  });

  app.get('/api/contracts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const contracts = await storage.getUserContracts(userId);
      res.json(contracts);
    } catch (error) {
      console.error("Error fetching contracts:", error);
      res.status(500).json({ message: "Failed to fetch contracts" });
    }
  });

  // Notification routes
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const notifications = await storage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.post('/api/notifications/:id/read', isAuthenticated, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      await storage.markNotificationAsRead(notificationId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Feedback routes
  app.post('/api/feedback', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const feedbackData = insertFeedbackSchema.parse({ ...req.body, userId });
      const feedback = await storage.createFeedback(feedbackData);
      res.json(feedback);
    } catch (error) {
      console.error("Error creating feedback:", error);
      res.status(400).json({ message: "Failed to create feedback" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time messaging
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('New WebSocket connection');
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received WebSocket message:', data);
        
        // Handle different message types
        if (data.type === 'join_room') {
          // In a real app, you'd manage rooms/channels
          ws.send(JSON.stringify({ type: 'joined_room', room: data.room }));
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket connection closed');
    });
  });

  return httpServer;
}

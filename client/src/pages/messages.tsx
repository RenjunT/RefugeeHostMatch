import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { MessageCircle, Send, User } from "lucide-react";

interface Message {
  id: number;
  senderId: string;
  receiverId: string;
  content: string;
  status: string;
  createdAt: string;
  readAt?: string;
}

export default function Messages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");

  // Get all user messages to show conversation list
  const { data: allMessages } = useQuery<Message[]>({
    queryKey: ['/api/messages'],
  });

  // Get conversation with selected user
  const { data: conversation } = useQuery<Message[]>({
    queryKey: ['/api/messages', selectedUserId],
    enabled: !!selectedUserId,
  });

  // WebSocket for real-time messages
  useWebSocket('/ws', {
    onMessage: (data) => {
      if (data.type === 'new_message') {
        queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
        if (selectedUserId) {
          queryClient.invalidateQueries({ queryKey: ['/api/messages', selectedUserId] });
        }
      }
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { receiverId: string; content: string }) => {
      await apiRequest('POST', '/api/messages', data);
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      if (selectedUserId) {
        queryClient.invalidateQueries({ queryKey: ['/api/messages', selectedUserId] });
      }
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedUserId) return;
    
    sendMessageMutation.mutate({
      receiverId: selectedUserId,
      content: messageText.trim(),
    });
  };

  // Group messages by conversation partner
  const conversations = React.useMemo(() => {
    if (!allMessages || !user) return [];
    
    const conversationMap = new Map();
    
    allMessages.forEach(message => {
      const partnerId = message.senderId === user.id ? message.receiverId : message.senderId;
      
      if (!conversationMap.has(partnerId)) {
        conversationMap.set(partnerId, {
          partnerId,
          lastMessage: message,
          unreadCount: 0,
        });
      } else {
        const existing = conversationMap.get(partnerId);
        if (new Date(message.createdAt) > new Date(existing.lastMessage.createdAt)) {
          existing.lastMessage = message;
        }
      }
      
      // Count unread messages from partner to current user
      if (message.receiverId === user.id && message.status !== 'read') {
        conversationMap.get(partnerId).unreadCount++;
      }
    });
    
    return Array.from(conversationMap.values()).sort(
      (a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
    );
  }, [allMessages, user]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Messages</h1>
          <p className="text-gray-600">Communicate with hosts and refugees</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          {/* Conversations List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageCircle className="h-5 w-5 mr-2" />
                Conversations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                {conversations.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No conversations yet</p>
                    <p className="text-sm">Start messaging hosts or refugees to begin conversations</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {conversations.map((conv) => (
                      <div
                        key={conv.partnerId}
                        className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors border-b ${
                          selectedUserId === conv.partnerId ? 'bg-primary-50 border-primary-200' : ''
                        }`}
                        onClick={() => setSelectedUserId(conv.partnerId)}
                      >
                        <div className="flex items-start space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              <User className="h-5 w-5" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-gray-900 truncate">
                                User {conv.partnerId}
                              </p>
                              {conv.unreadCount > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  {conv.unreadCount}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 truncate">
                              {conv.lastMessage.senderId === user.id ? 'You: ' : ''}
                              {conv.lastMessage.content}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(conv.lastMessage.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2">
            {selectedUserId ? (
              <>
                <CardHeader className="border-b">
                  <CardTitle className="flex items-center">
                    <Avatar className="h-8 w-8 mr-3">
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    User {selectedUserId}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex flex-col h-[500px]">
                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    {conversation?.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        <p>No messages yet</p>
                        <p className="text-sm">Start the conversation below</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {conversation?.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${
                              message.senderId === user.id ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                message.senderId === user.id
                                  ? 'bg-primary-500 text-white'
                                  : 'bg-gray-200 text-gray-900'
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                              <p
                                className={`text-xs mt-1 ${
                                  message.senderId === user.id
                                    ? 'text-primary-100'
                                    : 'text-gray-500'
                                }`}
                              >
                                {new Date(message.createdAt).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>

                  {/* Message Input */}
                  <div className="border-t p-4">
                    <div className="flex space-x-2">
                      <Input
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Type a message..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleSendMessage();
                          }
                        }}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!messageText.trim() || sendMessageMutation.isPending}
                        size="icon"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex items-center justify-center h-[500px]">
                <div className="text-center text-gray-500">
                  <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">Select a conversation</p>
                  <p className="text-sm">Choose a conversation from the left to start messaging</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

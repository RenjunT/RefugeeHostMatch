import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Clock, Handshake, Users, Home, Check, X, Bell, MessageCircle, BarChart3 } from "lucide-react";

interface Statistics {
  pendingApprovals: number;
  activeMatches: number;
  registeredRefugees: number;
  verifiedHosts: number;
}

interface PendingProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "refugee" | "host";
  profileStatus: string;
  createdAt: string;
  refugeeProfile?: any;
  hostProfile?: any;
}

export default function AdminDashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  // Redirect if not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
      toast({
        title: "Unauthorized",
        description: "Admin access required. Redirecting...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  // Fetch statistics
  const { data: stats, isLoading: statsLoading } = useQuery<Statistics>({
    queryKey: ['/api/admin/statistics'],
  });

  // Fetch pending profiles
  const { data: pendingProfiles, isLoading: profilesLoading } = useQuery<PendingProfile[]>({
    queryKey: ['/api/admin/pending-profiles'],
  });

  // Approve/reject profile mutation
  const approveProfileMutation = useMutation({
    mutationFn: async ({ userId, approved }: { userId: string; approved: boolean }) => {
      await apiRequest('POST', '/api/admin/approve-profile', { userId, approved });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pending-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/statistics'] });
      toast({
        title: "Success",
        description: "Profile status updated successfully",
      });
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
        description: "Failed to update profile status",
        variant: "destructive",
      });
    },
  });

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Platform Overview</h1>
        <p className="text-gray-600">Manage refugee and host registrations, approvals, and matches</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                <p className="text-3xl font-bold text-accent-600">
                  {statsLoading ? "..." : stats?.pendingApprovals || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center">
                <Clock className="text-accent-600 h-6 w-6" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-gray-500">Requires immediate attention</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Matches</p>
                <p className="text-3xl font-bold text-secondary-600">
                  {statsLoading ? "..." : stats?.activeMatches || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center">
                <Handshake className="text-secondary-600 h-6 w-6" />
              </div>
            </div>
            <div className="mt-4">
              <Badge variant="secondary" className="text-xs">
                Successful pairings
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Registered Refugees</p>
                <p className="text-3xl font-bold text-primary-600">
                  {statsLoading ? "..." : stats?.registeredRefugees || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <Users className="text-primary-600 h-6 w-6" />
              </div>
            </div>
            <div className="mt-4">
              <Badge variant="outline" className="text-xs">
                Total registered
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Verified Hosts</p>
                <p className="text-3xl font-bold text-primary-600">
                  {statsLoading ? "..." : stats?.verifiedHosts || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <Home className="text-primary-600 h-6 w-6" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-xs text-gray-500">Ready to host</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pending Approvals */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Pending Approvals
                <Badge variant="destructive">
                  {pendingProfiles?.length || 0}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profilesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse flex items-center space-x-4 p-4 border rounded-lg">
                      <div className="w-12 h-12 bg-gray-200 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : pendingProfiles?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No pending approvals</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingProfiles?.map((profile) => (
                    <div key={profile.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <Avatar>
                        <AvatarImage src={profile.profileImageUrl} />
                        <AvatarFallback>
                          {profile.firstName?.[0]}{profile.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {profile.firstName} {profile.lastName}
                        </p>
                        <p className="text-sm text-gray-500 capitalize">
                          {profile.role} • {profile.role === 'refugee' 
                            ? `Family of ${profile.refugeeProfile?.familySize || 'Unknown'}`
                            : `${profile.hostProfile?.accommodationType || 'Unknown'} accommodation`
                          }
                        </p>
                        <p className="text-xs text-accent-600">
                          Submitted {new Date(profile.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-secondary-600 border-secondary-300 hover:bg-secondary-50"
                          onClick={() => approveProfileMutation.mutate({ userId: profile.id, approved: true })}
                          disabled={approveProfileMutation.isPending}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                          onClick={() => approveProfileMutation.mutate({ userId: profile.id, approved: false })}
                          disabled={approveProfileMutation.isPending}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Handshake className="h-4 w-4 mr-2" />
                Create Manual Match
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Bell className="h-4 w-4 mr-2" />
                Send Notification
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageCircle className="h-5 w-5 mr-2" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-primary-500 rounded-full mt-2" />
                  <div>
                    <p className="text-gray-900">New refugee registration</p>
                    <p className="text-gray-500 text-xs">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-secondary-500 rounded-full mt-2" />
                  <div>
                    <p className="text-gray-900">Contract signed</p>
                    <p className="text-gray-500 text-xs">4 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-accent-500 rounded-full mt-2" />
                  <div>
                    <p className="text-gray-900">Host profile approved</p>
                    <p className="text-gray-500 text-xs">1 day ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

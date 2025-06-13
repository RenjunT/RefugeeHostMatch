import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Users, Home, Shield, Heart, ArrowRight } from "lucide-react";

export default function RoleSelection() {
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<string>("");

  const updateRoleMutation = useMutation({
    mutationFn: async (role: string) => {
      await apiRequest('POST', '/api/auth/update-role', { role });
    },
    onSuccess: () => {
      toast({
        title: "Role Selected",
        description: "Your role has been set successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      // Refresh the page to update user state and redirect
      window.location.reload();
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
        description: "Failed to update role. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleContinue = () => {
    if (!selectedRole) {
      toast({
        title: "Please select a role",
        description: "Choose how you'd like to use the platform",
        variant: "destructive",
      });
      return;
    }
    updateRoleMutation.mutate(selectedRole);
  };

  const roles = [
    {
      id: "refugee",
      title: "Register Now",
      subtitle: "Refugee seeking accommodation",
      description: "Find safe, verified host families who can provide temporary housing and support",
      icon: Users,
      color: "bg-primary-50 border-primary-200 hover:bg-primary-100",
      iconColor: "text-primary-600",
      features: [
        "Browse verified host families",
        "Secure messaging system",
        "Digital contract signing",
        "24/7 support services"
      ]
    },
    {
      id: "host",
      title: "I Can Provide Housing",
      subtitle: "Volunteer host family",
      description: "Open your home to refugee families and provide safe accommodation",
      icon: Home,
      color: "bg-secondary-50 border-secondary-200 hover:bg-secondary-100",
      iconColor: "text-secondary-600",
      features: [
        "Host refugee families safely",
        "Background verification process",
        "Ongoing NGO support",
        "Community of caring hosts"
      ]
    },
    {
      id: "admin",
      title: "NGO Administrator",
      subtitle: "Platform administrator",
      description: "Manage the platform, approve profiles, and oversee matches",
      icon: Shield,
      color: "bg-accent-50 border-accent-200 hover:bg-accent-100",
      iconColor: "text-accent-600",
      features: [
        "Review and approve profiles",
        "Monitor platform activity",
        "Manage contracts and matches",
        "Access to all admin tools"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <Heart className="h-12 w-12 text-primary-500 mr-3" />
              <h1 className="text-4xl font-bold text-gray-900">Welcome to RefugeeConnect</h1>
            </div>
            <p className="text-xl text-gray-600 mb-4">
              How would you like to use our platform?
            </p>
            <p className="text-gray-500">
              Choose your role to get started with the right features for you
            </p>
          </div>

          {/* Role Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {roles.map((role) => {
              const Icon = role.icon;
              const isSelected = selectedRole === role.id;
              
              return (
                <Card
                  key={role.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    isSelected 
                      ? `${role.color} ring-2 ring-offset-2 ring-primary-500` 
                      : 'hover:shadow-md border-gray-200'
                  }`}
                  onClick={() => setSelectedRole(role.id)}
                >
                  <CardHeader className="text-center pb-2">
                    <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
                      isSelected ? role.color : 'bg-gray-100'
                    }`}>
                      <Icon className={`h-8 w-8 ${isSelected ? role.iconColor : 'text-gray-500'}`} />
                    </div>
                    <CardTitle className="text-lg mb-1">{role.title}</CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {role.subtitle}
                    </Badge>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-sm text-gray-600 mb-4">
                      {role.description}
                    </p>
                    <div className="space-y-2">
                      {role.features.map((feature, index) => (
                        <div key={index} className="flex items-center text-xs text-gray-500">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Continue Button */}
          <div className="text-center">
            <Button
              onClick={handleContinue}
              disabled={!selectedRole || updateRoleMutation.isPending}
              size="lg"
              className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-3"
            >
              {updateRoleMutation.isPending ? (
                "Setting up your account..."
              ) : (
                <>
                  Continue <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
            
            {selectedRole && (
              <p className="text-sm text-gray-500 mt-3">
                You selected: <span className="font-medium capitalize">{selectedRole}</span>
              </p>
            )}
          </div>

          {/* Additional Information */}
          <div className="mt-12 bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">For Everyone</h4>
                <ul className="space-y-1">
                  <li>• Secure profile verification</li>
                  <li>• Real-time messaging</li>
                  <li>• 24/7 support access</li>
                  <li>• Multi-language support</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Safety First</h4>
                <ul className="space-y-1">
                  <li>• Background checks for hosts</li>
                  <li>• Admin-approved profiles only</li>
                  <li>• Digital contract protection</li>
                  <li>• Emergency support contacts</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
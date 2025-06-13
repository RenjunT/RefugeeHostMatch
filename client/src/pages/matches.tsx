import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ContractModal } from "@/components/contract-modal";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Home, Users, Calendar, MapPin, Star, MessageCircle, Filter, Search, Heart } from "lucide-react";

interface HostProfile {
  id: number;
  userId: string;
  accommodationType: string;
  maxOccupants: number;
  availabilityDuration: string;
  description: string;
  houseRules: string;
  amenities: string[];
  location: string;
  phoneNumber: string;
  petFriendly: boolean;
  smokingAllowed: boolean;
  accessibilityFeatures?: string;
}

interface HostWithProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImageUrl?: string;
  hostProfile: HostProfile;
}

export default function Matches() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [accommodationFilter, setAccommodationFilter] = useState("");
  const [selectedHost, setSelectedHost] = useState<HostWithProfile | null>(null);
  const [showContractModal, setShowContractModal] = useState(false);

  // Fetch available hosts
  const { data: hosts, isLoading } = useQuery<HostWithProfile[]>({
    queryKey: ['/api/hosts/available'],
    enabled: !!user && user.profileStatus === 'approved',
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { receiverId: string; content: string }) => {
      await apiRequest('POST', '/api/messages', data);
    },
    onSuccess: () => {
      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
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

  const handleContactHost = (host: HostWithProfile) => {
    const message = `Hello ${host.firstName}, I'm interested in your ${host.hostProfile.accommodationType} in ${host.hostProfile.location}. Could we schedule a time to discuss the details?`;
    
    sendMessageMutation.mutate({
      receiverId: host.id,
      content: message,
    });
  };

  const handleProposeContract = (host: HostWithProfile) => {
    setSelectedHost(host);
    setShowContractModal(true);
  };

  // Filter hosts based on search and filters
  const filteredHosts = hosts?.filter(host => {
    const matchesSearch = !searchTerm || 
      host.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      host.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      host.hostProfile.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLocation = !locationFilter || 
      host.hostProfile.location.toLowerCase().includes(locationFilter.toLowerCase());
    
    const matchesAccommodation = !accommodationFilter || 
      host.hostProfile.accommodationType === accommodationFilter;
    
    return matchesSearch && matchesLocation && matchesAccommodation;
  }) || [];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user.profileStatus !== 'approved') {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-8 text-center">
            <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Approved</h1>
            <p className="text-gray-600 mb-4">
              Your profile needs to be approved before you can view available hosts.
            </p>
            <Badge variant="secondary">
              Status: {user.profileStatus}
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Available Hosts</h1>
          <p className="text-gray-600">Find verified host families ready to welcome you</p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search hosts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Locations</SelectItem>
                  <SelectItem value="zurich">Zurich</SelectItem>
                  <SelectItem value="basel">Basel</SelectItem>
                  <SelectItem value="geneva">Geneva</SelectItem>
                  <SelectItem value="bern">Bern</SelectItem>
                  <SelectItem value="lausanne">Lausanne</SelectItem>
                </SelectContent>
              </Select>

              <Select value={accommodationFilter} onValueChange={setAccommodationFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Accommodation Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="house">House</SelectItem>
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="room">Private Room</SelectItem>
                  <SelectItem value="studio">Studio</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {filteredHosts.length} hosts found
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Host Listings */}
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-20 h-20 bg-gray-200 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                      <div className="h-3 bg-gray-200 rounded w-2/3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredHosts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Home className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No hosts found</h3>
              <p className="text-gray-600">
                {hosts?.length === 0 
                  ? "There are no available hosts at the moment. Please check back later."
                  : "Try adjusting your search criteria to find more hosts."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredHosts.map((host) => (
              <Card key={host.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    {/* Host Image Placeholder */}
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Home className="h-8 w-8 text-blue-600" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={host.profileImageUrl} />
                            <AvatarFallback>
                              {host.firstName[0]}{host.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {host.firstName} {host.lastName}
                            </h3>
                            <div className="flex items-center space-x-2">
                              <Badge variant="secondary" className="text-xs">
                                <Home className="h-3 w-3 mr-1" />
                                Verified Host
                              </Badge>
                              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                Available
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-current" />
                          ))}
                          <span className="text-xs text-gray-600 ml-1">(4.8)</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 text-sm text-gray-600 mb-2">
                        <MapPin className="h-4 w-4" />
                        <span>{host.hostProfile.location}, Switzerland</span>
                        <span>•</span>
                        <span className="capitalize">{host.hostProfile.accommodationType}</span>
                      </div>

                      <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                        <div className="flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          <span>Up to {host.hostProfile.maxOccupants} people</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>{host.hostProfile.availabilityDuration}</span>
                        </div>
                        {host.hostProfile.petFriendly && (
                          <div className="flex items-center">
                            <Heart className="h-3 w-3 mr-1" />
                            <span>Pet friendly</span>
                          </div>
                        )}
                      </div>

                      <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                        {host.hostProfile.description}
                      </p>

                      {/* Amenities */}
                      {host.hostProfile.amenities && host.hostProfile.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {host.hostProfile.amenities.slice(0, 4).map((amenity, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {amenity}
                            </Badge>
                          ))}
                          {host.hostProfile.amenities.length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{host.hostProfile.amenities.length - 4} more
                            </Badge>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center text-yellow-400">
                            <Star className="h-3 w-3 fill-current" />
                            <span className="text-xs text-gray-600 ml-1">4.8 (12 reviews)</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                View Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <div className="space-y-4">
                                <div className="flex items-center space-x-3">
                                  <Avatar className="h-12 w-12">
                                    <AvatarImage src={host.profileImageUrl} />
                                    <AvatarFallback>
                                      {host.firstName[0]}{host.lastName[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <h3 className="text-lg font-semibold">
                                      {host.firstName} {host.lastName}
                                    </h3>
                                    <p className="text-gray-600">{host.hostProfile.location}, Switzerland</p>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="font-medium">Accommodation:</span>
                                    <p className="capitalize">{host.hostProfile.accommodationType}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium">Capacity:</span>
                                    <p>{host.hostProfile.maxOccupants} people</p>
                                  </div>
                                  <div>
                                    <span className="font-medium">Duration:</span>
                                    <p>{host.hostProfile.availabilityDuration}</p>
                                  </div>
                                  <div>
                                    <span className="font-medium">Pet Friendly:</span>
                                    <p>{host.hostProfile.petFriendly ? 'Yes' : 'No'}</p>
                                  </div>
                                </div>

                                <div>
                                  <h4 className="font-medium mb-2">Description</h4>
                                  <p className="text-sm text-gray-600">{host.hostProfile.description}</p>
                                </div>

                                {host.hostProfile.houseRules && (
                                  <div>
                                    <h4 className="font-medium mb-2">House Rules</h4>
                                    <p className="text-sm text-gray-600">{host.hostProfile.houseRules}</p>
                                  </div>
                                )}

                                {host.hostProfile.amenities && host.hostProfile.amenities.length > 0 && (
                                  <div>
                                    <h4 className="font-medium mb-2">Amenities</h4>
                                    <div className="flex flex-wrap gap-2">
                                      {host.hostProfile.amenities.map((amenity, index) => (
                                        <Badge key={index} variant="secondary" className="text-xs">
                                          {amenity}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleContactHost(host)}
                            disabled={sendMessageMutation.isPending}
                            className="text-primary-600 border-primary-300 hover:bg-primary-50"
                          >
                            <MessageCircle className="h-4 w-4 mr-1" />
                            Contact
                          </Button>
                          
                          <Button
                            size="sm"
                            onClick={() => handleProposeContract(host)}
                            className="bg-secondary-500 hover:bg-secondary-600"
                          >
                            Propose Contract
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Contract Modal */}
        {selectedHost && (
          <ContractModal
            isOpen={showContractModal}
            onClose={() => {
              setShowContractModal(false);
              setSelectedHost(null);
            }}
            host={selectedHost}
            refugeeId={user.id}
          />
        )}
      </div>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { User, Home, Users, Clock, MapPin, Phone, Mail, Heart, Shield } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();

  const { data: refugeeProfile } = useQuery({
    queryKey: [`/api/profiles/refugee/${user?.id}`],
    enabled: !!user && user.role === 'refugee',
  });

  const { data: hostProfile } = useQuery({
    queryKey: [`/api/profiles/host/${user?.id}`],
    enabled: !!user && user.role === 'host',
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-secondary-100 text-secondary-700';
      case 'pending': return 'bg-accent-100 text-accent-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Avatar className="h-24 w-24 mx-auto mb-4">
            <AvatarImage src={user.profileImageUrl || ''} />
            <AvatarFallback className="text-2xl">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-3xl font-bold text-gray-900">
            {user.firstName} {user.lastName}
          </h1>
          <div className="flex items-center justify-center space-x-2 mt-2">
            <Badge variant="outline" className="capitalize">
              {user.role}
            </Badge>
            <Badge className={getStatusColor(user.profileStatus)}>
              {user.profileStatus === 'approved' ? 'Profile Approved' : 
               user.profileStatus === 'pending' ? 'Pending Review' : 
               'Profile Rejected'}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Basic Information */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{user.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    Joined {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Profile Status</h4>
                  <div className="text-sm text-gray-600">
                    {user.profileStatus === 'approved' && (
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4 text-secondary-500" />
                        <span>Your profile has been verified and approved</span>
                      </div>
                    )}
                    {user.profileStatus === 'pending' && (
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-accent-500" />
                        <span>Your profile is under review</span>
                      </div>
                    )}
                    {user.profileStatus === 'rejected' && (
                      <div className="flex items-center space-x-2">
                        <X className="h-4 w-4 text-red-500" />
                        <span>Your profile needs updates</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Heart className="h-4 w-4 mr-2" />
                  View Matches
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Messages
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  My Contracts
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2">
            {user.role === 'refugee' && refugeeProfile && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Refugee Profile Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Family Information</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-500">Family Size:</span>
                          <span className="ml-2">{refugeeProfile.familySize} people</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Estimated Stay:</span>
                          <span className="ml-2">{refugeeProfile.estimatedStay}</span>
                        </div>
                        {refugeeProfile.countryOfOrigin && (
                          <div>
                            <span className="text-gray-500">Country of Origin:</span>
                            <span className="ml-2">{refugeeProfile.countryOfOrigin}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Contact Information</h4>
                      <div className="space-y-2 text-sm">
                        {refugeeProfile.phoneNumber && (
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4 text-gray-500" />
                            <span>{refugeeProfile.phoneNumber}</span>
                          </div>
                        )}
                        {refugeeProfile.emergencyContact && (
                          <div>
                            <span className="text-gray-500">Emergency Contact:</span>
                            <span className="ml-2">{refugeeProfile.emergencyContact}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {refugeeProfile.languages && refugeeProfile.languages.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Languages</h4>
                      <div className="flex flex-wrap gap-2">
                        {refugeeProfile.languages.map((language: string, index: number) => (
                          <Badge key={index} variant="secondary">{language}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {refugeeProfile.medicalNeeds && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Medical or Special Needs</h4>
                      <p className="text-sm text-gray-600">{refugeeProfile.medicalNeeds}</p>
                    </div>
                  )}

                  {refugeeProfile.specialRequirements && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Housing Requirements</h4>
                      <p className="text-sm text-gray-600">{refugeeProfile.specialRequirements}</p>
                    </div>
                  )}

                  {refugeeProfile.additionalInfo && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Additional Information</h4>
                      <p className="text-sm text-gray-600">{refugeeProfile.additionalInfo}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {user.role === 'host' && hostProfile && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Home className="h-5 w-5 mr-2" />
                    Host Profile Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Property Information</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-500">Type:</span>
                          <span className="ml-2 capitalize">{hostProfile.accommodationType}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Max Occupants:</span>
                          <span className="ml-2">{hostProfile.maxOccupants} people</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Availability:</span>
                          <span className="ml-2">{hostProfile.availabilityDuration}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span>{hostProfile.location}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Contact Information</h4>
                      <div className="space-y-2 text-sm">
                        {hostProfile.phoneNumber && (
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4 text-gray-500" />
                            <span>{hostProfile.phoneNumber}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-gray-500">Pet Friendly:</span>
                          <span className="ml-2">{hostProfile.petFriendly ? 'Yes' : 'No'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Smoking Allowed:</span>
                          <span className="ml-2">{hostProfile.smokingAllowed ? 'Yes' : 'No'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {hostProfile.description && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Property Description</h4>
                      <p className="text-sm text-gray-600">{hostProfile.description}</p>
                    </div>
                  )}

                  {hostProfile.amenities && hostProfile.amenities.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Amenities</h4>
                      <div className="flex flex-wrap gap-2">
                        {hostProfile.amenities.map((amenity: string, index: number) => (
                          <Badge key={index} variant="secondary">{amenity}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {hostProfile.houseRules && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">House Rules</h4>
                      <p className="text-sm text-gray-600">{hostProfile.houseRules}</p>
                    </div>
                  )}

                  {hostProfile.accessibilityFeatures && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Accessibility Features</h4>
                      <p className="text-sm text-gray-600">{hostProfile.accessibilityFeatures}</p>
                    </div>
                  )}

                  {hostProfile.additionalInfo && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Additional Information</h4>
                      <p className="text-sm text-gray-600">{hostProfile.additionalInfo}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

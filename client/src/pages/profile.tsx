import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertRefugeeProfileSchema } from "@shared/schema";
import { Home, Users, Info, AlertCircle } from "lucide-react";

// Form schema extending the insert schema with additional validation
const refugeeProfileFormSchema = insertRefugeeProfileSchema.extend({
  familySize: z.number().min(1, "Family size must be at least 1"),
  estimatedStay: z.string().min(1, "Estimated stay is required"),
});

type RefugeeProfileFormData = z.infer<typeof refugeeProfileFormSchema>;

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const { data: refugeeProfile, isLoading: profileLoading } = useQuery({
    queryKey: [`/api/profiles/refugee/${(user as any)?.id}`],
    enabled: !!(user as any) && (user as any).role === 'refugee',
  });

  const form = useForm<RefugeeProfileFormData>({
    resolver: zodResolver(refugeeProfileFormSchema),
    defaultValues: {
      familySize: (refugeeProfile as any)?.familySize || 1,
      estimatedStay: (refugeeProfile as any)?.estimatedStay || "",
      medicalNeeds: (refugeeProfile as any)?.medicalNeeds || "",
      specialRequirements: (refugeeProfile as any)?.specialRequirements || "",
      languages: (refugeeProfile as any)?.languages || [],
      countryOfOrigin: (refugeeProfile as any)?.countryOfOrigin || "",
      phoneNumber: (refugeeProfile as any)?.phoneNumber || "",
      emergencyContact: (refugeeProfile as any)?.emergencyContact || "",
      additionalInfo: (refugeeProfile as any)?.additionalInfo || "",
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: RefugeeProfileFormData) => {
      const profileData = {
        ...data,
        languages: data.primaryLanguage ? [data.primaryLanguage] : [],
      };
      
      if (refugeeProfile) {
        return await apiRequest('PUT', `/api/profiles/refugee/${refugeeProfile.id}`, profileData);
      } else {
        return await apiRequest('POST', '/api/profiles/refugee', profileData);
      }
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your refugee housing profile has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/profiles/refugee/${(user as any)?.id}`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RefugeeProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if ((user as any).role !== 'refugee') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p className="text-gray-600">This page is only available for refugees.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <Home className="h-6 w-6" />
            <h1 className="text-3xl font-bold text-gray-900">
              Update your Refugee Housing Profile
            </h1>
          </div>
          <p className="text-gray-600 mb-6">
            Please provide information about your housing needs to help us match you with potential hosts. 
            All information will be shared only with verified organizations and potential host families.
          </p>
          
          {/* Important Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900 mb-1">Important</h3>
                <p className="text-sm text-blue-800">
                  After submitting your profile, it will be reviewed by our team and made available to verified 
                  organizations who can match you with appropriate housing options. You'll be notified when matches are found.
                </p>
              </div>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Family Information Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Family Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="familySize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Family Size*</FormLabel>
                        <FormControl>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                            <SelectTrigger>
                              <SelectValue placeholder="1" />
                            </SelectTrigger>
                            <SelectContent>
                              {[1,2,3,4,5,6,7,8,9,10].map(num => (
                                <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <p className="text-sm text-gray-500">Total number of people needing accommodation</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="adultsCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Adults*</FormLabel>
                        <FormControl>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                            <SelectTrigger>
                              <SelectValue placeholder="1" />
                            </SelectTrigger>
                            <SelectContent>
                              {[1,2,3,4,5,6,7,8].map(num => (
                                <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="childrenCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Children</FormLabel>
                        <FormControl>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                            <SelectTrigger>
                              <SelectValue placeholder="0" />
                            </SelectTrigger>
                            <SelectContent>
                              {[0,1,2,3,4,5,6,7,8].map(num => (
                                <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="childrenAges"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Children's Ages</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g. 3, 7, 12" 
                          {...field}
                        />
                      </FormControl>
                      <p className="text-sm text-gray-500">Separate ages with commas</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Housing Preferences Section */}
            <Card>
              <CardHeader>
                <CardTitle>Housing Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="preferredLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Location</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="City or region in Switzerland" 
                          {...field}
                        />
                      </FormControl>
                      <p className="text-sm text-gray-500">If you have a specific area where you would prefer to stay</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="primaryLanguage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Language*</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your primary language" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="german">German</SelectItem>
                              <SelectItem value="french">French</SelectItem>
                              <SelectItem value="italian">Italian</SelectItem>
                              <SelectItem value="english">English</SelectItem>
                              <SelectItem value="arabic">Arabic</SelectItem>
                              <SelectItem value="farsi">Farsi</SelectItem>
                              <SelectItem value="dari">Dari</SelectItem>
                              <SelectItem value="turkish">Turkish</SelectItem>
                              <SelectItem value="kurdish">Kurdish</SelectItem>
                              <SelectItem value="somali">Somali</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="estimatedStay"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expected Stay Duration*</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select expected duration" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1-3 months">1-3 months</SelectItem>
                              <SelectItem value="3-6 months">3-6 months</SelectItem>
                              <SelectItem value="6-12 months">6-12 months</SelectItem>
                              <SelectItem value="1+ years">1+ years</SelectItem>
                              <SelectItem value="permanent">Permanent</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="employmentStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employment Status</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select employment status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unemployed">Unemployed</SelectItem>
                              <SelectItem value="employed">Employed</SelectItem>
                              <SelectItem value="student">Student</SelectItem>
                              <SelectItem value="looking-for-work">Looking for work</SelectItem>
                              <SelectItem value="unable-to-work">Unable to work</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="urgencyLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Urgency Level*</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select urgency level" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low - Have time to find suitable housing</SelectItem>
                              <SelectItem value="medium">Medium - Need housing within 1-2 months</SelectItem>
                              <SelectItem value="high">High - Need housing within 2-4 weeks</SelectItem>
                              <SelectItem value="urgent">Urgent - Need housing immediately</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="currentHousingStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Housing Status*</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select current housing status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="refugee-center">In refugee/asylum center</SelectItem>
                            <SelectItem value="temporary-shelter">Temporary shelter</SelectItem>
                            <SelectItem value="with-friends">Staying with friends/family</SelectItem>
                            <SelectItem value="hotel">Hotel/temporary accommodation</SelectItem>
                            <SelectItem value="homeless">Homeless</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Additional Information Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Info className="h-5 w-5 mr-2" />
                  Additional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="countryOfOrigin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country of Origin</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Your home country" 
                            value={field.value || ""}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="+41 XX XXX XX XX" 
                            value={field.value || ""}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="emergencyContact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emergency Contact</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Name and phone number of emergency contact" 
                          value={field.value || ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="medicalNeeds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medical or Special Needs</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Please describe any medical conditions, disabilities, or special needs that potential hosts should be aware of."
                          rows={4}
                          value={field.value || ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="specialRequirements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Special Housing Requirements</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Any specific housing requirements (accessibility, pet allergies, dietary restrictions, etc.)"
                          rows={4}
                          value={field.value || ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="additionalInfo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Information</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Any other information you would like to share with potential hosts."
                          rows={4}
                          value={field.value || ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Button 
                type="submit" 
                disabled={updateProfileMutation.isPending}
                size="lg"
                className="px-8"
              >
                {updateProfileMutation.isPending ? 'Saving...' : 'Save Profile'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}

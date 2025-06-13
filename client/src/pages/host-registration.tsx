import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { insertHostProfileSchema } from "@shared/schema";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Home, Clock, Shield, ArrowRight } from "lucide-react";
import { useState } from "react";

export default function HostRegistration() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);

  const form = useForm({
    resolver: zodResolver(insertHostProfileSchema),
    defaultValues: {
      accommodationType: "",
      maxOccupants: 1,
      availabilityDuration: "",
      description: "",
      houseRules: "",
      amenities: [],
      location: "",
      address: "",
      phoneNumber: "",
      petFriendly: false,
      smokingAllowed: false,
      accessibilityFeatures: "",
      criminalRecordChecked: false,
      additionalInfo: "",
    },
  });

  const createProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest('POST', '/api/profiles/host', data);
    },
    onSuccess: () => {
      toast({
        title: "Profile Submitted",
        description: "Your host profile has been submitted for admin approval.",
      });
      // Refresh the page to update user status
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
        description: "Failed to create profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    createProfileMutation.mutate(data);
  };

  const nextStep = () => {
    if (step < 4) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  if (user?.profileStatus === 'pending') {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-8 text-center">
            <Clock className="h-16 w-16 text-accent-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile Under Review</h1>
            <p className="text-gray-600 mb-6">
              Your host profile has been submitted and is currently being reviewed by our admin team. 
              You will be notified once your profile is approved.
            </p>
            <Badge variant="secondary" className="mb-4">
              Status: Pending Approval
            </Badge>
            <p className="text-sm text-gray-500">
              This process typically takes 1-3 business days and includes background verification.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Home className="h-8 w-8 text-secondary-500 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Host Registration</h1>
          </div>
          <p className="text-gray-600">Open your home to help refugee families find stability and support</p>
          <div className="flex items-center justify-center mt-4">
            <Badge variant={step >= 1 ? "default" : "secondary"}>1. Property</Badge>
            <ArrowRight className="h-4 w-4 mx-2 text-gray-400" />
            <Badge variant={step >= 2 ? "default" : "secondary"}>2. Details</Badge>
            <ArrowRight className="h-4 w-4 mx-2 text-gray-400" />
            <Badge variant={step >= 3 ? "default" : "secondary"}>3. Rules</Badge>
            <ArrowRight className="h-4 w-4 mx-2 text-gray-400" />
            <Badge variant={step >= 4 ? "default" : "secondary"}>4. Contact</Badge>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              Step {step} of 4: {
                step === 1 ? "Property Information" : 
                step === 2 ? "Accommodation Details" : 
                step === 3 ? "House Rules & Preferences" : 
                "Contact & Verification"
              }
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {step === 1 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="accommodationType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Accommodation Type *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="apartment">Apartment</SelectItem>
                                <SelectItem value="house">House</SelectItem>
                                <SelectItem value="room">Private Room</SelectItem>
                                <SelectItem value="studio">Studio</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="maxOccupants"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Maximum Occupants *</FormLabel>
                            <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select max occupants" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="1">1 person</SelectItem>
                                <SelectItem value="2">2 people</SelectItem>
                                <SelectItem value="3">3 people</SelectItem>
                                <SelectItem value="4">4 people</SelectItem>
                                <SelectItem value="5">5+ people</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City/Location *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Zurich, Basel, Geneva" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Address</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Street address, postal code, city (will be kept confidential until matching)"
                              rows={2}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="availabilityDuration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Availability Duration *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="How long can you host?" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1-3 months">1-3 months</SelectItem>
                              <SelectItem value="3-6 months">3-6 months</SelectItem>
                              <SelectItem value="6-12 months">6-12 months</SelectItem>
                              <SelectItem value="1+ years">1+ years</SelectItem>
                              <SelectItem value="flexible">Flexible</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Property Description *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe your accommodation, neighborhood, and what makes it special..."
                              rows={4}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="amenities"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Available Amenities</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., WiFi, kitchen access, laundry, parking (separate with commas)"
                              onChange={(e) => field.onChange(e.target.value.split(',').map(amenity => amenity.trim()))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="accessibilityFeatures"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Accessibility Features</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="e.g., wheelchair accessible, elevator, ground floor, grab bars..."
                              rows={2}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="petFriendly"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Pet Friendly</FormLabel>
                              <div className="text-sm text-muted-foreground">
                                Allow guests with pets
                              </div>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="smokingAllowed"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Smoking Allowed</FormLabel>
                              <div className="text-sm text-muted-foreground">
                                Allow smoking on property
                              </div>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="houseRules"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>House Rules</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="e.g., quiet hours 10 PM - 7 AM, shared household responsibilities, kitchen usage guidelines..."
                              rows={4}
                              {...field}
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
                              placeholder="Tell us about yourself, your family, experience with hosting, or anything else that would help with matching..."
                              rows={4}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="bg-amber-50 p-4 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <Shield className="h-5 w-5 text-amber-500 mt-0.5" />
                        <div>
                          <h3 className="font-medium text-amber-900">Safety & Trust</h3>
                          <p className="text-sm text-amber-700 mt-1">
                            All host profiles undergo background verification. We'll contact you about the verification process after your initial application is reviewed.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number *</FormLabel>
                          <FormControl>
                            <Input placeholder="+41 XX XXX XX XX" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="criminalRecordChecked"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={field.onChange}
                              className="mt-1"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Criminal Background Check Consent *
                            </FormLabel>
                            <div className="text-sm text-muted-foreground">
                              I consent to a criminal background check as part of the host verification process. This is required for the safety of refugee families.
                            </div>
                          </div>
                        </FormItem>
                      )}
                    />

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <Home className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div>
                          <h3 className="font-medium text-blue-900">Next Steps</h3>
                          <p className="text-sm text-blue-700 mt-1">
                            After submitting your profile, our team will:
                          </p>
                          <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
                            <li>Review your application (1-3 business days)</li>
                            <li>Contact you for background verification</li>
                            <li>Schedule a brief home visit or video call</li>
                            <li>Activate your profile for refugee family matching</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between">
                  {step > 1 && (
                    <Button type="button" variant="outline" onClick={prevStep}>
                      Previous
                    </Button>
                  )}
                  
                  <div className="ml-auto">
                    {step < 4 ? (
                      <Button type="button" onClick={nextStep}>
                        Next <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    ) : (
                      <Button 
                        type="submit" 
                        disabled={createProfileMutation.isPending || !form.watch('criminalRecordChecked')}
                        className="bg-secondary-500 hover:bg-secondary-600"
                      >
                        {createProfileMutation.isPending ? "Submitting..." : "Submit Profile"}
                      </Button>
                    )}
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

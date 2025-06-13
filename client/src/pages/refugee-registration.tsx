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
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { insertRefugeeProfileSchema } from "@shared/schema";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Users, Clock, Heart, ArrowRight } from "lucide-react";
import { useState } from "react";

export default function RefugeeRegistration() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);

  const form = useForm({
    resolver: zodResolver(insertRefugeeProfileSchema),
    defaultValues: {
      familySize: 1,
      estimatedStay: "",
      medicalNeeds: "",
      specialRequirements: "",
      languages: [],
      countryOfOrigin: "",
      phoneNumber: "",
      emergencyContact: "",
      additionalInfo: "",
    },
  });

  const createProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest('POST', '/api/profiles/refugee', data);
    },
    onSuccess: () => {
      toast({
        title: "Profile Submitted",
        description: "Your refugee profile has been submitted for admin approval.",
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
    if (step < 3) setStep(step + 1);
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
              Your refugee profile has been submitted and is currently being reviewed by our admin team. 
              You will be notified once your profile is approved.
            </p>
            <Badge variant="secondary" className="mb-4">
              Status: Pending Approval
            </Badge>
            <p className="text-sm text-gray-500">
              This process typically takes 1-3 business days.
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
            <Users className="h-8 w-8 text-primary-500 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Refugee Registration</h1>
          </div>
          <p className="text-gray-600">Complete your profile to connect with verified host families</p>
          <div className="flex items-center justify-center mt-4">
            <Badge variant={step >= 1 ? "default" : "secondary"}>1. Basic Info</Badge>
            <ArrowRight className="h-4 w-4 mx-2 text-gray-400" />
            <Badge variant={step >= 2 ? "default" : "secondary"}>2. Requirements</Badge>
            <ArrowRight className="h-4 w-4 mx-2 text-gray-400" />
            <Badge variant={step >= 3 ? "default" : "secondary"}>3. Contact</Badge>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              Step {step} of 3: {step === 1 ? "Basic Information" : step === 2 ? "Housing Requirements" : "Contact Information"}
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
                        name="familySize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Family Size *</FormLabel>
                            <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select family size" />
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

                      <FormField
                        control={form.control}
                        name="estimatedStay"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estimated Stay Duration *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select duration" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="1-3 months">1-3 months</SelectItem>
                                <SelectItem value="3-6 months">3-6 months</SelectItem>
                                <SelectItem value="6-12 months">6-12 months</SelectItem>
                                <SelectItem value="1+ years">1+ years</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="countryOfOrigin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country of Origin</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Syria, Afghanistan, Ukraine" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="languages"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Languages Spoken</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., Arabic, English, German (separate with commas)" 
                              onChange={(e) => field.onChange(e.target.value.split(',').map(lang => lang.trim()))}
                            />
                          </FormControl>
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
                      name="medicalNeeds"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Medical or Special Needs</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Please describe any medical conditions, disabilities, or special requirements..."
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
                      name="specialRequirements"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Housing Preferences or Requirements</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="e.g., ground floor access, pet allergies, dietary restrictions, etc."
                              rows={3}
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
                              placeholder="Any other information that would help us find the right match..."
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="phoneNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="+41 XX XXX XX XX" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="emergencyContact"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Emergency Contact</FormLabel>
                            <FormControl>
                              <Input placeholder="Name and phone number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <Heart className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div>
                          <h3 className="font-medium text-blue-900">What happens next?</h3>
                          <p className="text-sm text-blue-700 mt-1">
                            Once you submit your profile, our admin team will review it within 1-3 business days. 
                            After approval, you'll be able to browse and contact verified host families.
                          </p>
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
                    {step < 3 ? (
                      <Button type="button" onClick={nextStep}>
                        Next <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    ) : (
                      <Button 
                        type="submit" 
                        disabled={createProfileMutation.isPending}
                        className="bg-primary-500 hover:bg-primary-600"
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

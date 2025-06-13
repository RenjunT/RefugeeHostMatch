import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { File, Calendar, Home, Users, Shield } from "lucide-react";

interface HostWithProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImageUrl?: string;
  hostProfile: {
    id: number;
    accommodationType: string;
    maxOccupants: number;
    availabilityDuration: string;
    description: string;
    location: string;
    houseRules?: string;
  };
}

interface ContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  host: HostWithProfile;
  refugeeId: string;
}

export function ContractModal({ isOpen, onClose, host, refugeeId }: ContractModalProps) {
  const { toast } = useToast();
  const [duration, setDuration] = useState("");
  const [startDate, setStartDate] = useState("");
  const [terms, setTerms] = useState("");

  const createContractMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest('POST', '/api/contracts', data);
    },
    onSuccess: () => {
      toast({
        title: "Contract Proposed",
        description: "Your contract proposal has been sent to the host",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/contracts'] });
      onClose();
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
        description: "Failed to create contract proposal",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!duration || !startDate || !terms.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const endDate = new Date(startDate);
    const durationMonths = parseInt(duration.split('-')[0]) || 6; // Default to 6 months
    endDate.setMonth(endDate.getMonth() + durationMonths);

    const standardTerms = `
HOUSING AGREEMENT CONTRACT

Property: ${host.hostProfile.accommodationType} in ${host.hostProfile.location}
Duration: ${duration}
Start Date: ${new Date(startDate).toLocaleDateString()}
End Date: ${endDate.toLocaleDateString()}

TERMS AND CONDITIONS:

1. ACCOMMODATION DETAILS
- Type: ${host.hostProfile.accommodationType}
- Maximum occupancy: ${host.hostProfile.maxOccupants} people
- Location: ${host.hostProfile.location}, Switzerland

2. HOUSE RULES
${host.hostProfile.houseRules || 'Standard house rules apply as discussed.'}

3. ADDITIONAL TERMS
${terms}

4. SUPPORT SERVICES
- RefugeeConnect NGO provides ongoing support and mediation
- 24/7 emergency contact available through the platform
- Regular check-ins and feedback collection

5. TERMINATION
- Either party may terminate with 30 days written notice
- Emergency termination available through RefugeeConnect mediation

This agreement is subject to approval by RefugeeConnect administration.

Signatures:
Refugee: [Digital signature required]
Host: [Digital signature required]
Admin Approval: [Pending]
    `.trim();

    createContractMutation.mutate({
      hostId: host.id,
      refugeeId,
      duration,
      startDate: new Date(startDate).toISOString(),
      endDate: endDate.toISOString(),
      terms: standardTerms,
      status: "proposed"
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <File className="h-5 w-5 mr-2" />
            Housing Agreement Proposal
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Host Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Host Information</h3>
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={host.profileImageUrl} />
                <AvatarFallback>
                  {host.firstName[0]}{host.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-gray-900">
                  {host.firstName} {host.lastName}
                </p>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Home className="h-4 w-4" />
                  <span className="capitalize">{host.hostProfile.accommodationType}</span>
                  <span>•</span>
                  <span>{host.hostProfile.location}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Users className="h-4 w-4" />
                  <span>Up to {host.hostProfile.maxOccupants} people</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contract Details Form */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Contract Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stay Duration *
                </label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-3 months">1-3 months</SelectItem>
                    <SelectItem value="3-6 months">3-6 months</SelectItem>
                    <SelectItem value="6-12 months">6-12 months</SelectItem>
                    <SelectItem value="12+ months">12+ months</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Start Date *
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Terms & Requests *
              </label>
              <Textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="Please describe any specific needs, expectations, or arrangements you'd like to include in the contract..."
                rows={4}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Include details about family members, special needs, preferred arrangements, etc.
              </p>
            </div>
          </div>

          {/* Contract Preview */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h4 className="font-medium text-gray-900 mb-2">Contract Preview</h4>
            <div className="text-sm text-gray-600 space-y-2">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>
                  Duration: {duration || "Not specified"} 
                  {startDate && ` starting ${new Date(startDate).toLocaleDateString()}`}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Home className="h-4 w-4" />
                <span>
                  Accommodation: {host.hostProfile.accommodationType} in {host.hostProfile.location}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>Subject to NGO admin approval and background verification</span>
              </div>
            </div>
          </div>

          {/* Important Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-blue-900">Important Information</h4>
                <ul className="text-sm text-blue-700 mt-2 space-y-1">
                  <li>• This proposal will be sent to the host for review</li>
                  <li>• Both parties must digitally sign before the contract becomes active</li>
                  <li>• Final approval is required from RefugeeConnect administration</li>
                  <li>• You will receive notifications about the proposal status</li>
                  <li>• Support services are available throughout the hosting period</li>
                </ul>
              </div>
            </div>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createContractMutation.isPending || !duration || !startDate || !terms.trim()}
              className="bg-secondary-500 hover:bg-secondary-600"
            >
              {createContractMutation.isPending ? "Sending..." : "Send Proposal"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

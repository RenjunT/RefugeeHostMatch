import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Home, Users, Shield } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <Home className="h-12 w-12 text-primary-500 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">RefugeeConnect</h1>
          </div>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Connecting refugee families with compassionate Swiss hosts to build bridges of hope and community.
          </p>
          <Button 
            size="lg" 
            className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-3"
            onClick={() => window.location.href = '/api/login'}
          >
            Get Started
          </Button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="border-none shadow-lg">
            <CardHeader className="text-center pb-2">
              <Users className="h-12 w-12 text-primary-500 mx-auto mb-4" />
              <CardTitle className="text-lg">Safe Matching</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-gray-600">
                Verified profiles and background checks ensure safe connections between refugees and hosts.
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader className="text-center pb-2">
              <Shield className="h-12 w-12 text-secondary-500 mx-auto mb-4" />
              <CardTitle className="text-lg">Admin Approved</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-gray-600">
                Every profile is carefully reviewed and approved by our NGO team before activation.
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader className="text-center pb-2">
              <Heart className="h-12 w-12 text-accent-500 mx-auto mb-4" />
              <CardTitle className="text-lg">Full Support</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-gray-600">
                Comprehensive support system with guidelines, contacts, and feedback mechanisms.
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardHeader className="text-center pb-2">
              <Home className="h-12 w-12 text-primary-500 mx-auto mb-4" />
              <CardTitle className="text-lg">Digital Contracts</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-gray-600">
                Secure digital contract system with legal protection for both parties.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Make a Difference?</h2>
          <p className="text-gray-600 mb-6">
            Join our community of caring individuals making a real impact in refugee integration.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => window.location.href = '/api/login'}
            >
              Register Now
            </Button>
            <Button 
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => window.location.href = '/api/login'}
            >
              I Can Host (Volunteer)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

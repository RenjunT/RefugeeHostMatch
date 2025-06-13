import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  Home, 
  Users, 
  MessageCircle, 
  File, 
  User, 
  Settings, 
  LogOut, 
  Bell,
  Menu,
  Shield,
  Heart
} from "lucide-react";

export default function Navigation() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return null;

  const navigation = [
    ...(user.role === 'admin' ? [
      { name: 'Dashboard', href: '/', icon: Shield, current: location === '/' }
    ] : [
      { name: 'Find Hosts', href: '/matches', icon: Heart, current: location === '/matches' },
      { name: 'Messages', href: '/messages', icon: MessageCircle, current: location === '/messages' },
      { name: 'My Contracts', href: '/contracts', icon: File, current: location === '/contracts' }
    ]),
    { name: 'Profile', href: '/profile', icon: User, current: location === '/profile' }
  ];

  const NavLinks = ({ mobile = false }) => (
    <>
      {navigation.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={mobile ? () => setMobileMenuOpen(false) : undefined}
          >
            <Button
              variant={item.current ? "default" : "ghost"}
              className={`${mobile ? 'w-full justify-start' : ''} ${
                item.current 
                  ? 'bg-primary-500 text-white hover:bg-primary-600' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Icon className={`h-4 w-4 ${mobile ? 'mr-2' : 'mr-1'}`} />
              {item.name}
            </Button>
          </Link>
        );
      })}
    </>
  );

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center space-x-2 cursor-pointer">
              <Home className="h-8 w-8 text-primary-500" />
              <span className="text-xl font-bold text-gray-900">RefugeeConnect</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <NavLinks />
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* Language Selector */}
            <div className="hidden md:flex items-center">
              <Button variant="outline" size="sm" className="text-xs">
                🌐 EN
              </Button>
            </div>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-gray-600" />
              <span className="absolute -top-1 -right-1 bg-accent-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                3
              </span>
            </Button>

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 hover:bg-gray-100 rounded-lg p-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.profileImageUrl || ''} />
                    <AvatarFallback>
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-700">
                      {user.firstName} {user.lastName}
                    </p>
                    <div className="flex items-center space-x-1">
                      <Badge 
                        variant={user.role === 'admin' ? 'default' : 'secondary'} 
                        className="text-xs capitalize"
                      >
                        {user.role}
                      </Badge>
                      {user.profileStatus === 'approved' && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                
                <Link href="/profile">
                  <DropdownMenuItem className="cursor-pointer">
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                </Link>
                
                <DropdownMenuItem className="cursor-pointer">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  className="cursor-pointer text-red-600 focus:text-red-600"
                  onClick={() => window.location.href = '/api/logout'}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu */}
            <div className="md:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-64">
                  <div className="flex flex-col space-y-4 mt-8">
                    <div className="pb-4 border-b">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={user.profileImageUrl || ''} />
                          <AvatarFallback>
                            {user.firstName?.[0]}{user.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.firstName} {user.lastName}</p>
                          <Badge variant="secondary" className="text-xs capitalize">
                            {user.role}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <NavLinks mobile />
                    
                    <div className="pt-4 border-t space-y-2">
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-gray-600"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-red-600"
                        onClick={() => window.location.href = '/api/logout'}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

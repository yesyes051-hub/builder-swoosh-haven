import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User } from '@shared/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  BarChart3,
  Bell,
  Settings,
  LogOut,
  User as UserIcon,
  Menu,
  X
} from 'lucide-react';

interface Props {
  user: User;
  children: React.ReactNode;
}

export default function DashboardLayout({ user, children }: Props) {
  const { logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500';
      case 'hr': return 'bg-green-500';
      case 'manager': return 'bg-purple-500';
      case 'employee': return 'bg-blue-500';
      case 'interviewer': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getRoleLabel = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-4">
              {/* Mobile Menu Trigger */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="md:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Open navigation menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] sm:w-[350px]">
                  <SheetHeader>
                    <SheetTitle className="flex items-center space-x-2">
                      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                        <BarChart3 className="h-5 w-5 text-white" />
                      </div>
                      <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        TrackZen
                      </span>
                    </SheetTitle>
                  </SheetHeader>
                  <nav className="flex flex-col space-y-4 mt-6">
                    <Link
                      to="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        location.pathname === '/dashboard'
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      Dashboard
                    </Link>
                    {(user.role === 'employee' || user.role === 'manager' || user.role === 'admin') && (
                      <Link
                        to="/daily-updates"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          location.pathname === '/daily-updates'
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                      >
                        Daily Updates
                      </Link>
                    )}
                    <Link
                      to="/leaderboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        location.pathname === '/leaderboard'
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      Leaderboard
                    </Link>
                    <Link
                      to="/interviews"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        location.pathname === '/interviews'
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      Interviews
                    </Link>
                    {user.role !== 'admin' && (
                      <Link
                        to="/pms"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          location.pathname === '/pms'
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                      >
                        PMS
                      </Link>
                    )}
                    {(user.role === 'manager' || user.role === 'admin') && (
                      <div className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-400">
                        Team Reports
                      </div>
                    )}
                    {user.role === 'admin' && (
                      <div className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-400">
                        Admin Panel
                      </div>
                    )}
                  </nav>
                </SheetContent>
              </Sheet>

              <div className="flex items-center space-x-2">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    TrackZen
                  </h1>
                  <p className="text-xs text-gray-500 leading-none">
                    Performance & Visibility
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link
                to="/dashboard"
                className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                  location.pathname === '/dashboard' ? 'text-blue-600' : 'text-gray-600'
                }`}
              >
                Dashboard
              </Link>
              {(user.role === 'employee' || user.role === 'manager' || user.role === 'admin') && (
                <Link
                  to="/daily-updates"
                  className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                    location.pathname === '/daily-updates' ? 'text-blue-600' : 'text-gray-600'
                  }`}
                >
                  Daily Updates
                </Link>
              )}
              <Link
                to="/leaderboard"
                className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                  location.pathname === '/leaderboard' ? 'text-blue-600' : 'text-gray-600'
                }`}
              >
                Leaderboard
              </Link>
              <Link
                to="/interviews"
                className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                  location.pathname === '/interviews' ? 'text-blue-600' : 'text-gray-600'
                }`}
              >
                Interviews
              </Link>
              {user.role !== 'admin' && (
                <Link
                  to="/pms"
                  className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                    location.pathname === '/pms' ? 'text-blue-600' : 'text-gray-600'
                  }`}
                >
                  PMS
                </Link>
              )}
              {(user.role === 'manager' || user.role === 'admin') && (
                <span className="text-sm font-medium text-gray-400 cursor-not-allowed">
                  Team Reports
                </span>
              )}
              {user.role === 'admin' && (
                <span className="text-sm font-medium text-gray-400 cursor-not-allowed">
                  Admin Panel
                </span>
              )}
            </nav>

            {/* User Menu */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="absolute -top-1 -right-1 h-3 w-3 sm:h-4 sm:w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  <span className="hidden sm:block">3</span>
                  <span className="sm:hidden w-2 h-2 bg-red-500 rounded-full"></span>
                </span>
              </Button>

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className={`${getRoleColor(user.role)} text-white text-sm font-semibold`}>
                        {getInitials(user.firstName, user.lastName)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className={`inline-block w-2 h-2 rounded-full ${getRoleColor(user.role)}`}></span>
                        <span className="text-xs text-gray-600">{getRoleLabel(user.role)}</span>
                        {user.department && (
                          <>
                            <span className="text-gray-300">•</span>
                            <span className="text-xs text-gray-600">{user.department}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <BarChart3 className="h-4 w-4" />
              <span>© 2024 TrackZen. All rights reserved.</span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <a href="#" className="hover:text-blue-600">Support</a>
              <a href="#" className="hover:text-blue-600">Privacy</a>
              <a href="#" className="hover:text-blue-600">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

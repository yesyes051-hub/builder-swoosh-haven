import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Users, 
  Trophy, 
  Calendar, 
  TrendingUp, 
  Shield, 
  ArrowRight,
  CheckCircle,
  Star,
  Target,
  MessageSquare
} from 'lucide-react';

export default function Index() {
  const features = [
    {
      icon: <Calendar className="h-8 w-8 text-blue-600" />,
      title: "Daily Progress Tracking",
      description: "Employees submit daily updates to track tasks, accomplishments, and challenges in real-time."
    },
    {
      icon: <Users className="h-8 w-8 text-green-600" />,
      title: "Team Management",
      description: "Managers get visibility into team progress with comprehensive dashboards and reports."
    },
    {
      icon: <MessageSquare className="h-8 w-8 text-purple-600" />,
      title: "Mock Interview System",
      description: "HR can schedule mock interviews with structured feedback to help employees improve."
    },
    {
      icon: <Trophy className="h-8 w-8 text-yellow-600" />,
      title: "Performance Leaderboards",
      description: "Gamified rankings based on consistency, progress scores, and overall performance."
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-indigo-600" />,
      title: "Analytics & Insights",
      description: "Data-driven insights to help make informed decisions about team performance."
    },
    {
      icon: <Shield className="h-8 w-8 text-red-600" />,
      title: "Role-Based Access",
      description: "Secure, role-based dashboards for employees, managers, HR, and administrators."
    }
  ];

  const roles = [
    {
      name: "Employee",
      color: "blue",
      description: "Track daily progress, view personal performance, and participate in mock interviews",
      features: ["Daily Updates", "Personal Dashboard", "Interview Participation", "Leaderboard View"]
    },
    {
      name: "Manager",
      color: "purple",
      description: "Monitor team performance, track project progress, and review team updates",
      features: ["Team Dashboards", "Progress Monitoring", "Performance Reports", "Project Management"]
    },
    {
      name: "HR",
      color: "green",
      description: "Schedule interviews, manage feedback, and track talent development",
      features: ["Interview Scheduling", "Feedback Management", "Talent Analytics", "Employee Insights"]
    },
    {
      name: "Admin",
      color: "red",
      description: "Complete system oversight with user management and advanced analytics",
      features: ["User Management", "System Configuration", "Advanced Reports", "Full Access Control"]
    }
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: "bg-blue-50 border-blue-200 text-blue-700",
      purple: "bg-purple-50 border-purple-200 text-purple-700",
      green: "bg-green-50 border-green-200 text-green-700",
      red: "bg-red-50 border-red-200 text-red-700"
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            {/* Logo */}
            <div className="flex items-center justify-center space-x-3 mb-8">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-2xl shadow-trackzen">
                <BarChart3 className="h-12 w-12 text-white" />
              </div>
              <div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  TrackZen
                </h1>
                <p className="text-xl text-gray-600 font-medium">
                  Empowering Teams Through Performance and Visibility
                </p>
              </div>
            </div>

            {/* Hero Content */}
            <div className="max-w-4xl mx-auto mb-12">
              <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
                Transform Your Team's
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Performance </span>
                Management
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                A comprehensive platform that enhances employee productivity, ensures visibility into project progress, 
                and enables structured performance tracking through intelligent dashboards, leaderboards, and feedback systems.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/login">
                  <Button size="lg" className="trackzen-gradient text-white shadow-trackzen hover:shadow-trackzen-lg transition-all duration-300">
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="border-2 hover:bg-gray-50">
                  Learn More
                </Button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">5</div>
                <div className="text-sm text-gray-600">User Roles</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">24/7</div>
                <div className="text-sm text-gray-600">Performance Tracking</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">Real-time</div>
                <div className="text-sm text-gray-600">Dashboard Updates</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">360°</div>
                <div className="text-sm text-gray-600">Team Visibility</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need for 
              <span className="text-blue-600"> Performance Excellence</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              TrackZen provides all the tools your organization needs to build a culture of transparency, 
              accountability, and continuous improvement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-trackzen hover:shadow-trackzen-lg transition-all duration-300 group">
                <CardHeader>
                  <div className="mb-4 group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl text-gray-900">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Built for <span className="text-purple-600">Every Role</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              TrackZen adapts to your organization structure with role-specific dashboards and features 
              tailored to each team member's needs and responsibilities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {roles.map((role, index) => (
              <Card key={index} className="border-2 hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <CardTitle className="text-xl">{role.name}</CardTitle>
                    <Badge className={getColorClasses(role.color)}>
                      {role.name}
                    </Badge>
                  </div>
                  <CardDescription className="text-gray-600">
                    {role.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {role.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Transform Your Team's Performance?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join organizations already using TrackZen to build high-performing, transparent teams.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login">
              <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-50 shadow-lg">
                Start Your Journey
                <Star className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-2xl font-bold text-white mb-2">Increase Productivity</div>
              <div className="text-blue-100">Track daily progress and stay focused on goals</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white mb-2">Improve Visibility</div>
              <div className="text-blue-100">Real-time insights into team performance</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white mb-2">Drive Growth</div>
              <div className="text-blue-100">Structured feedback and continuous improvement</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <BarChart3 className="h-8 w-8 text-blue-400" />
              <span className="text-xl font-bold">TrackZen</span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              <Link to="/login" className="hover:text-white transition-colors">
                Login
              </Link>
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
              <span>Support</span>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 TrackZen. All rights reserved. Empowering teams through performance and visibility.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

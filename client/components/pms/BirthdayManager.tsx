import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Cake, 
  Plus, 
  Send, 
  Calendar as CalendarIcon,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Gift,
  PartyPopper
} from 'lucide-react';
import { format } from 'date-fns';
import { ApiResponse } from '@shared/api';

interface Birthday {
  _id: string;
  userId: string;
  name: string;
  department: string;
  role: string;
  birthday: string;
  email: string;
  wishSent: boolean;
  lastWishDate?: string;
}

interface Props {
  birthdays: { all: Birthday[]; upcoming: Birthday[] };
  onRefresh: () => void;
}

export default function BirthdayManager({ birthdays, onRefresh }: Props) {
  const { token, user } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sendingWish, setSendingWish] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    userId: '',
    name: '',
    department: '',
    role: '',
    email: '',
    birthday: undefined as Date | undefined
  });

  const departments = [
    'Engineering', 'Human Resources', 'Marketing', 'Sales', 'Finance', 
    'Operations', 'Customer Support', 'Design', 'Product', 'Quality Assurance'
  ];

  const roles = [
    'Software Engineer', 'Senior Software Engineer', 'Team Lead', 'Project Manager',
    'HR Manager', 'HR Executive', 'Marketing Manager', 'Sales Executive',
    'Financial Analyst', 'Operations Manager', 'Support Engineer', 'Designer',
    'Product Manager', 'QA Engineer', 'DevOps Engineer', 'Data Analyst'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name || !formData.department || !formData.role || !formData.email || !formData.birthday) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/pms/birthdays', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          userId: formData.userId || `user_${Date.now()}`, // Generate ID if not provided
          birthday: formData.birthday.toISOString()
        })
      });

      const data: ApiResponse<Birthday> = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to add birthday');
      }

      setSuccess('Birthday added successfully!');
      setFormData({
        userId: '',
        name: '',
        department: '',
        role: '',
        email: '',
        birthday: undefined
      });
      onRefresh();
      setTimeout(() => {
        setIsAddModalOpen(false);
        setSuccess('');
      }, 2000);
    } catch (err) {
      console.error('Add birthday error:', err);
      setError(err instanceof Error ? err.message : 'Failed to add birthday');
    } finally {
      setLoading(false);
    }
  };

  const sendBirthdayWish = async (birthdayId: string, name: string, email: string) => {
    try {
      setSendingWish(birthdayId);
      
      // Simulate sending birthday wish (in a real app, this would send an email)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update the birthday record to mark wish as sent
      // In a real implementation, you'd call an API to update the database
      
      setSuccess(`🎉 Birthday wish sent to ${name}!`);
      onRefresh();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Send birthday wish error:', err);
      setError('Failed to send birthday wish');
    } finally {
      setSendingWish(null);
    }
  };

  const isToday = (birthday: string) => {
    const today = new Date();
    const birthdayDate = new Date(birthday);
    return today.getMonth() === birthdayDate.getMonth() && 
           today.getDate() === birthdayDate.getDate();
  };

  const getBirthdayDate = (birthday: string) => {
    const date = new Date(birthday);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysUntilBirthday = (birthday: string) => {
    const today = new Date();
    const birthdayDate = new Date(birthday);
    const currentYear = today.getFullYear();
    
    // Set birthday to current year
    birthdayDate.setFullYear(currentYear);
    
    // If birthday already passed this year, set to next year
    if (birthdayDate < today) {
      birthdayDate.setFullYear(currentYear + 1);
    }
    
    const diffTime = birthdayDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Today's Birthdays */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-700">
            <PartyPopper className="h-6 w-6" />
            <span>🎉 Today's Birthdays</span>
          </CardTitle>
          <CardDescription className="text-blue-600">
            Celebrate your colleagues today!
          </CardDescription>
        </CardHeader>
        <CardContent>
          {birthdays.upcoming.filter(b => isToday(b.birthday)).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {birthdays.upcoming.filter(b => isToday(b.birthday)).map((birthday) => (
                <div key={birthday._id} className="bg-white border-2 border-blue-200 rounded-lg p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-lg text-blue-900 flex items-center space-x-2">
                        <Cake className="h-5 w-5" />
                        <span>{birthday.name}</span>
                      </h4>
                      <p className="text-blue-700 font-medium">{birthday.department}</p>
                      <p className="text-blue-600 text-sm">{birthday.role}</p>
                      <p className="text-blue-500 text-sm">{birthday.email}</p>
                    </div>
                    <Gift className="h-8 w-8 text-yellow-500" />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                      🎂 Today!
                    </Badge>
                    
                    {birthday.wishSent ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        ✅ Wish Sent
                      </Badge>
                    ) : (
                      <Button 
                        size="sm" 
                        className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                        onClick={() => sendBirthdayWish(birthday._id, birthday.name, birthday.email)}
                        disabled={sendingWish === birthday._id}
                      >
                        {sendingWish === birthday._id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Send Wishes 🎂
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Cake className="h-16 w-16 mx-auto mb-4 text-blue-300" />
              <p className="text-blue-600 text-lg">No birthdays today</p>
              <p className="text-blue-500 text-sm">Check back tomorrow for celebrations!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Birthdays */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>📅 Upcoming Birthdays (Next 30 Days)</span>
            </CardTitle>
            <CardDescription>Plan ahead for upcoming celebrations</CardDescription>
          </div>
          
          {(user?.role === 'admin' || user?.role === 'hr') && (
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Birthday
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Employee Birthday</DialogTitle>
                  <DialogDescription>
                    Add a new employee birthday to the system
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Enter full name"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="Enter email address"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="department">Department *</Label>
                    <Select 
                      value={formData.department} 
                      onValueChange={(value) => setFormData({...formData, department: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="role">Role *</Label>
                    <Select 
                      value={formData.role} 
                      onValueChange={(value) => setFormData({...formData, role: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role} value={role}>{role}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Birthday *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={`w-full justify-start text-left font-normal ${
                            !formData.birthday && "text-muted-foreground"
                          }`}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.birthday ? format(formData.birthday, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.birthday}
                          onSelect={(date) => setFormData({...formData, birthday: date})}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="flex space-x-2">
                    <Button 
                      type="submit" 
                      className="flex-1" 
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Birthday
                        </>
                      )}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsAddModalOpen(false)}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          {birthdays.upcoming.filter(b => !isToday(b.birthday)).length > 0 ? (
            <div className="space-y-3">
              {birthdays.upcoming
                .filter(b => !isToday(b.birthday))
                .sort((a, b) => getDaysUntilBirthday(a.birthday) - getDaysUntilBirthday(b.birthday))
                .map((birthday) => {
                  const daysUntil = getDaysUntilBirthday(birthday.birthday);
                  return (
                    <div key={birthday._id} className="flex justify-between items-center p-4 border rounded-lg hover:shadow-sm transition-shadow">
                      <div className="flex items-center space-x-4">
                        <div className="bg-purple-100 p-2 rounded-full">
                          <Cake className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{birthday.name}</h4>
                          <p className="text-sm text-gray-600">{birthday.department} • {birthday.role}</p>
                          <p className="text-xs text-gray-500">{birthday.email}</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-semibold text-purple-600">{getBirthdayDate(birthday.birthday)}</p>
                        <Badge variant="outline" className="text-xs">
                          {daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No upcoming birthdays in the next 30 days</p>
              <p className="text-sm">Add employee birthdays to track celebrations</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

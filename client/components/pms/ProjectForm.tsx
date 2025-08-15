import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Plus, 
  Calendar as CalendarIcon,
  CheckCircle,
  AlertTriangle,
  Loader2,
  FolderOpen
} from 'lucide-react';
import { format } from 'date-fns';
import { ApiResponse } from '@shared/api';

interface ProjectDetail {
  _id: string;
  projectName: string;
  projectManager: string;
  startDate: string;
  endDate?: string;
  status: 'Planning' | 'In Progress' | 'In Review' | 'Completed' | 'On Hold';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  description: string;
  teamMembers: string[];
  budget?: number;
}

interface Props {
  onProjectCreated: (project: ProjectDetail) => void;
}

export default function ProjectForm({ onProjectCreated }: Props) {
  const { token, user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    projectName: '',
    projectManager: user?.id || '',
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    status: 'Planning' as const,
    priority: 'Medium' as const,
    description: '',
    teamMembers: [''],
    budget: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.projectName || !formData.description || !formData.startDate) {
      setError('Please fill in all required fields');
      return;
    }

    const filteredTeamMembers = formData.teamMembers.filter(member => member.trim() !== '');

    try {
      setLoading(true);

      const response = await fetch('/api/pms/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          projectName: formData.projectName,
          projectManager: formData.projectManager,
          startDate: formData.startDate.toISOString(),
          endDate: formData.endDate?.toISOString(),
          status: formData.status,
          priority: formData.priority,
          description: formData.description,
          teamMembers: filteredTeamMembers,
          budget: formData.budget ? parseFloat(formData.budget) : undefined
        })
      });

      const data: ApiResponse<ProjectDetail> = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create project');
      }

      setSuccess('Project created successfully!');
      setFormData({
        projectName: '',
        projectManager: user?.id || '',
        startDate: undefined,
        endDate: undefined,
        status: 'Planning',
        priority: 'Medium',
        description: '',
        teamMembers: [''],
        budget: ''
      });
      
      if (data.data) {
        onProjectCreated(data.data);
      }
      
      setTimeout(() => {
        setIsModalOpen(false);
        setSuccess('');
      }, 2000);
    } catch (err) {
      console.error('Create project error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const addTeamMember = () => {
    setFormData({
      ...formData,
      teamMembers: [...formData.teamMembers, '']
    });
  };

  const removeTeamMember = (index: number) => {
    if (formData.teamMembers.length > 1) {
      const newTeamMembers = formData.teamMembers.filter((_, i) => i !== index);
      setFormData({ ...formData, teamMembers: newTeamMembers });
    }
  };

  const updateTeamMember = (index: number, value: string) => {
    const newTeamMembers = [...formData.teamMembers];
    newTeamMembers[index] = value;
    setFormData({ ...formData, teamMembers: newTeamMembers });
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FolderOpen className="h-5 w-5" />
            <span>Create New Project</span>
          </DialogTitle>
          <DialogDescription>
            Add a new project to the system with all necessary details
          </DialogDescription>
        </DialogHeader>
        
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
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="projectName">Project Name *</Label>
              <Input
                id="projectName"
                value={formData.projectName}
                onChange={(e) => setFormData({...formData, projectName: e.target.value})}
                placeholder="Enter project name"
                required
              />
            </div>

            <div>
              <Label htmlFor="projectManager">Project Manager ID</Label>
              <Input
                id="projectManager"
                value={formData.projectManager}
                onChange={(e) => setFormData({...formData, projectManager: e.target.value})}
                placeholder="Enter manager ID"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Enter project description"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full justify-start text-left font-normal ${
                      !formData.startDate && "text-muted-foreground"
                    }`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.startDate ? format(formData.startDate, "PPP") : "Pick start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.startDate}
                    onSelect={(date) => setFormData({...formData, startDate: date})}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full justify-start text-left font-normal ${
                      !formData.endDate && "text-muted-foreground"
                    }`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.endDate ? format(formData.endDate, "PPP") : "Pick end date (optional)"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.endDate}
                    onSelect={(date) => setFormData({...formData, endDate: date})}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: any) => setFormData({...formData, status: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Planning">Planning</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="In Review">In Review</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="On Hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(value: any) => setFormData({...formData, priority: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="budget">Budget ($)</Label>
              <Input
                id="budget"
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData({...formData, budget: e.target.value})}
                placeholder="Enter budget"
                min="0"
              />
            </div>
          </div>

          <div>
            <Label>Team Members</Label>
            <div className="space-y-2">
              {formData.teamMembers.map((member, index) => (
                <div key={index} className="flex space-x-2">
                  <Input
                    value={member}
                    onChange={(e) => updateTeamMember(index, e.target.value)}
                    placeholder="Enter team member ID or name"
                    className="flex-1"
                  />
                  {formData.teamMembers.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeTeamMember(index)}
                    >
                      ×
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTeamMember}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Team Member
              </Button>
            </div>
          </div>

          <div className="flex space-x-2 pt-4">
            <Button 
              type="submit" 
              className="flex-1" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Project
                </>
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsModalOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { 
  User, 
  DailyUpdate, 
  Project, 
  MockInterview, 
  InterviewFeedback,
  UserRole 
} from '@shared/api';

// In-memory storage (replace with real database in production)
class MemoryDatabase {
  private users: Map<string, User> = new Map();
  private dailyUpdates: Map<string, DailyUpdate> = new Map();
  private projects: Map<string, Project> = new Map();
  private interviews: Map<string, MockInterview> = new Map();
  private feedback: Map<string, InterviewFeedback> = new Map();

  constructor() {
    this.seedData();
  }

  // User operations
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const id = uuidv4();
    const hashedPassword = await bcrypt.hash(userData.password!, 10);
    
    const user: User = {
      ...userData,
      id,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };

    this.users.set(id, user);
    return user;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const user = this.users.get(id);
    if (!user) return null;

    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Daily Update operations
  async createDailyUpdate(update: Omit<DailyUpdate, 'id' | 'createdAt' | 'updatedAt'>): Promise<DailyUpdate> {
    const id = uuidv4();
    const dailyUpdate: DailyUpdate = {
      ...update,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.dailyUpdates.set(id, dailyUpdate);
    return dailyUpdate;
  }

  async getDailyUpdatesByUser(userId: string, limit = 10): Promise<DailyUpdate[]> {
    return Array.from(this.dailyUpdates.values())
      .filter(update => update.userId === userId)
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, limit);
  }

  async getDailyUpdatesByTeam(managerIds: string[], limit = 20): Promise<DailyUpdate[]> {
    return Array.from(this.dailyUpdates.values())
      .filter(update => managerIds.includes(update.userId))
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, limit);
  }

  // Project operations
  async createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    const id = uuidv4();
    const newProject: Project = {
      ...project,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.projects.set(id, newProject);
    return newProject;
  }

  async getProjectsByUser(userId: string): Promise<Project[]> {
    return Array.from(this.projects.values())
      .filter(project => 
        project.managerId === userId || 
        project.teamMembers.includes(userId)
      );
  }

  // Interview operations
  async createInterview(interview: Omit<MockInterview, 'id' | 'createdAt' | 'updatedAt'>): Promise<MockInterview> {
    const id = uuidv4();
    const newInterview: MockInterview = {
      ...interview,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.interviews.set(id, newInterview);
    return newInterview;
  }

  async getInterviewsByUser(userId: string): Promise<MockInterview[]> {
    return Array.from(this.interviews.values())
      .filter(interview => 
        interview.candidateId === userId || 
        interview.interviewerId === userId ||
        interview.scheduledBy === userId
      );
  }

  async getInterviewById(id: string): Promise<MockInterview | null> {
    return this.interviews.get(id) || null;
  }

  // Feedback operations
  async createFeedback(feedback: Omit<InterviewFeedback, 'id' | 'createdAt'>): Promise<InterviewFeedback> {
    const id = uuidv4();
    const newFeedback: InterviewFeedback = {
      ...feedback,
      id,
      createdAt: new Date()
    };

    this.feedback.set(id, newFeedback);
    return newFeedback;
  }

  async getFeedbackByInterview(interviewId: string): Promise<InterviewFeedback | null> {
    for (const feedback of this.feedback.values()) {
      if (feedback.interviewId === interviewId) {
        return feedback;
      }
    }
    return null;
  }

  // Seed initial data
  private async seedData() {
    // Create admin user
    await this.createUser({
      email: 'admin@trackzen.com',
      password: 'admin123',
      firstName: 'System',
      lastName: 'Administrator',
      role: 'admin',
      department: 'IT',
      isActive: true
    });

    // Create HR user
    await this.createUser({
      email: 'hr@trackzen.com',
      password: 'hr123',
      firstName: 'Sarah',
      lastName: 'Johnson',
      role: 'hr',
      department: 'Human Resources'
    });

    // Create manager
    const manager = await this.createUser({
      email: 'manager@trackzen.com',
      password: 'manager123',
      firstName: 'John',
      lastName: 'Smith',
      role: 'manager',
      department: 'Engineering'
    });

    // Create employees
    await this.createUser({
      email: 'employee@trackzen.com',
      password: 'employee123',
      firstName: 'Alice',
      lastName: 'Brown',
      role: 'employee',
      department: 'Engineering',
      managerId: manager.id
    });

    await this.createUser({
      email: 'interviewer@trackzen.com',
      password: 'interviewer123',
      firstName: 'Bob',
      lastName: 'Wilson',
      role: 'interviewer',
      department: 'Engineering'
    });

    console.log('✅ Database seeded with initial users');
  }
}

export const db = new MemoryDatabase();

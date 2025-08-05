import { RequestHandler } from 'express';
import { db } from '../db/memory';
import { AuthRequest } from '../middleware/auth';
import { 
  ApiResponse,
  DailyUpdate,
  MockInterview,
  InterviewFeedback,
  User
} from '@shared/api';

interface PerformanceMetrics {
  totalUpdates: number;
  averageProgressScore: number;
  updateConsistency: number;
  currentStreak: number;
  longestStreak: number;
  completedInterviews: number;
  averageInterviewScore: number;
  monthlyProgress: {
    month: string;
    updates: number;
    avgScore: number;
  }[];
}

interface PerformanceData {
  user: Omit<User, 'password'>;
  metrics: PerformanceMetrics;
  recentUpdates: DailyUpdate[];
  recentInterviews: (MockInterview & {
    feedback?: InterviewFeedback;
    interviewer?: {
      firstName: string;
      lastName: string;
    };
  })[];
  goals: {
    dailyUpdateTarget: number;
    progressScoreTarget: number;
    interviewScoreTarget: number;
  };
  achievements: {
    id: string;
    title: string;
    description: string;
    achievedAt: Date;
    type: 'streak' | 'score' | 'consistency' | 'interview';
  }[];
}

export const getUserPerformanceData: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const user = authReq.user!;
    let targetUserId = user.id;

    // Managers and HR can view other employees' data
    if ((user.role === 'manager' || user.role === 'hr') && req.query.userId) {
      targetUserId = req.query.userId as string;
    }

    const targetUser = await db.getUserById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      } as ApiResponse<never>);
    }

    // Permission check
    if (user.id !== targetUserId && user.role !== 'hr' && 
        (user.role !== 'manager' || targetUser.managerId !== user.id)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      } as ApiResponse<never>);
    }

    // Get daily updates
    const allUpdates = await db.getDailyUpdatesByUser(targetUserId, 100);
    const recentUpdates = allUpdates.slice(0, 10);

    // Calculate performance metrics
    const totalUpdates = allUpdates.length;
    const averageProgressScore = totalUpdates > 0 
      ? allUpdates.reduce((sum, update) => sum + update.progressScore, 0) / totalUpdates
      : 0;

    // Calculate update consistency (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentUpdates30Days = allUpdates.filter(update => 
      new Date(update.date) >= thirtyDaysAgo
    );
    const workDaysInLast30 = getWorkDaysInPeriod(thirtyDaysAgo, new Date());
    const updateConsistency = workDaysInLast30 > 0 
      ? (recentUpdates30Days.length / workDaysInLast30) * 100 
      : 0;

    // Calculate streaks
    const { currentStreak, longestStreak } = calculateUpdateStreaks(allUpdates);

    // Get interview data
    const userInterviews = await db.getInterviewsByUser(targetUserId);
    const completedInterviews = userInterviews.filter(interview => 
      interview.status === 'completed' && interview.candidateId === targetUserId
    );

    let averageInterviewScore = 0;
    const interviewsWithFeedback = await Promise.all(
      completedInterviews.map(async (interview) => {
        const feedback = await db.getFeedbackByInterview(interview.id);
        const interviewer = await db.getUserById(interview.interviewerId);
        
        if (feedback) {
          averageInterviewScore += feedback.overallRating;
        }

        return {
          ...interview,
          feedback,
          interviewer: interviewer ? {
            firstName: interviewer.firstName,
            lastName: interviewer.lastName
          } : undefined
        };
      })
    );

    if (completedInterviews.length > 0) {
      averageInterviewScore = averageInterviewScore / completedInterviews.length;
    }

    // Calculate monthly progress
    const monthlyProgress = calculateMonthlyProgress(allUpdates);

    // Generate achievements
    const achievements = generateAchievements(allUpdates, interviewsWithFeedback, {
      currentStreak,
      longestStreak,
      averageProgressScore,
      updateConsistency
    });

    const performanceData: PerformanceData = {
      user: { ...targetUser, password: undefined } as Omit<User, 'password'>,
      metrics: {
        totalUpdates,
        averageProgressScore: Math.round(averageProgressScore * 10) / 10,
        updateConsistency: Math.round(updateConsistency * 10) / 10,
        currentStreak,
        longestStreak,
        completedInterviews: completedInterviews.length,
        averageInterviewScore: Math.round(averageInterviewScore * 10) / 10,
        monthlyProgress
      },
      recentUpdates,
      recentInterviews: interviewsWithFeedback.slice(0, 5),
      goals: {
        dailyUpdateTarget: 22, // Monthly target (roughly weekdays)
        progressScoreTarget: 8,
        interviewScoreTarget: 7
      },
      achievements
    };

    res.json({
      success: true,
      data: performanceData
    } as ApiResponse<PerformanceData>);
  } catch (error) {
    console.error('Get user performance data error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
};

export const getTeamPerformanceOverview: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const user = authReq.user!;

    if (user.role !== 'manager' && user.role !== 'hr' && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      } as ApiResponse<never>);
    }

    const allUsers = await db.getAllUsers();
    let teamMembers: User[] = [];

    if (user.role === 'manager') {
      teamMembers = allUsers.filter(u => u.managerId === user.id);
    } else {
      // HR and Admin can see all employees
      teamMembers = allUsers.filter(u => u.role === 'employee');
    }

    const teamOverview = await Promise.all(
      teamMembers.map(async (member) => {
        const updates = await db.getDailyUpdatesByUser(member.id, 30);
        const interviews = await db.getInterviewsByUser(member.id);
        const completedInterviews = interviews.filter(i => 
          i.status === 'completed' && i.candidateId === member.id
        );

        const avgScore = updates.length > 0 
          ? updates.reduce((sum, update) => sum + update.progressScore, 0) / updates.length
          : 0;

        return {
          user: {
            id: member.id,
            firstName: member.firstName,
            lastName: member.lastName,
            email: member.email,
            department: member.department
          },
          recentUpdates: updates.length,
          averageScore: Math.round(avgScore * 10) / 10,
          completedInterviews: completedInterviews.length,
          lastUpdateDate: updates.length > 0 ? updates[0].date : null
        };
      })
    );

    res.json({
      success: true,
      data: teamOverview
    } as ApiResponse<typeof teamOverview>);
  } catch (error) {
    console.error('Get team performance overview error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
};

// Helper functions
function getWorkDaysInPeriod(startDate: Date, endDate: Date): number {
  let workDays = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workDays++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return workDays;
}

function calculateUpdateStreaks(updates: DailyUpdate[]): { currentStreak: number; longestStreak: number } {
  if (updates.length === 0) return { currentStreak: 0, longestStreak: 0 };

  // Sort updates by date (most recent first)
  const sortedUpdates = [...updates].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check current streak
  for (let i = 0; i < sortedUpdates.length; i++) {
    const updateDate = new Date(sortedUpdates[i].date);
    updateDate.setHours(0, 0, 0, 0);
    
    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - i);

    if (updateDate.getTime() === expectedDate.getTime()) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Calculate longest streak
  for (let i = 0; i < sortedUpdates.length; i++) {
    const updateDate = new Date(sortedUpdates[i].date);
    updateDate.setHours(0, 0, 0, 0);

    if (i === 0) {
      tempStreak = 1;
    } else {
      const prevUpdateDate = new Date(sortedUpdates[i - 1].date);
      prevUpdateDate.setHours(0, 0, 0, 0);
      
      const daysDiff = (prevUpdateDate.getTime() - updateDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysDiff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
  }
  
  longestStreak = Math.max(longestStreak, tempStreak);

  return { currentStreak, longestStreak };
}

function calculateMonthlyProgress(updates: DailyUpdate[]) {
  const monthlyData: { [key: string]: { updates: number; totalScore: number } } = {};

  updates.forEach(update => {
    const date = new Date(update.date);
    const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { updates: 0, totalScore: 0 };
    }
    
    monthlyData[monthKey].updates++;
    monthlyData[monthKey].totalScore += update.progressScore;
  });

  return Object.entries(monthlyData)
    .map(([month, data]) => ({
      month,
      updates: data.updates,
      avgScore: Math.round((data.totalScore / data.updates) * 10) / 10
    }))
    .sort((a, b) => b.month.localeCompare(a.month))
    .slice(0, 6);
}

function generateAchievements(
  updates: DailyUpdate[], 
  interviews: any[], 
  metrics: { currentStreak: number; longestStreak: number; averageProgressScore: number; updateConsistency: number }
) {
  const achievements: any[] = [];

  // Streak achievements
  if (metrics.currentStreak >= 7) {
    achievements.push({
      id: 'streak-7',
      title: 'Week Warrior',
      description: 'Maintained a 7-day update streak',
      achievedAt: new Date(),
      type: 'streak'
    });
  }

  if (metrics.longestStreak >= 30) {
    achievements.push({
      id: 'streak-30',
      title: 'Month Master',
      description: 'Achieved a 30-day update streak',
      achievedAt: new Date(),
      type: 'streak'
    });
  }

  // Score achievements
  if (metrics.averageProgressScore >= 8) {
    achievements.push({
      id: 'high-performer',
      title: 'High Performer',
      description: 'Maintained an average progress score of 8+',
      achievedAt: new Date(),
      type: 'score'
    });
  }

  // Consistency achievements
  if (metrics.updateConsistency >= 90) {
    achievements.push({
      id: 'consistent-performer',
      title: 'Consistent Performer',
      description: 'Achieved 90%+ update consistency',
      achievedAt: new Date(),
      type: 'consistency'
    });
  }

  // Interview achievements
  if (interviews.length >= 3) {
    achievements.push({
      id: 'interview-veteran',
      title: 'Interview Veteran',
      description: 'Completed 3+ mock interviews',
      achievedAt: new Date(),
      type: 'interview'
    });
  }

  return achievements;
}

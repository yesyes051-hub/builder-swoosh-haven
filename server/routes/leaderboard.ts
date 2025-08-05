import { RequestHandler } from 'express';
import { db } from '../db/memory';
import { AuthRequest } from '../middleware/auth';
import { 
  LeaderboardResponse,
  LeaderboardEntry,
  ApiResponse 
} from '@shared/api';

export const getLeaderboard: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const user = authReq.user!;
    const period = (req.query.period as 'weekly' | 'monthly' | 'quarterly') || 'monthly';

    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'weekly':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarterly':
        startDate.setMonth(now.getMonth() - 3);
        break;
    }

    // Get all users and their performance data
    const allUsers = await db.getAllUsers();
    const activeUsers = allUsers.filter(u => u.isActive && u.role === 'employee');

    const entries: LeaderboardEntry[] = [];

    for (const empUser of activeUsers) {
      // Get daily updates for the period
      const userUpdates = await db.getDailyUpdatesByUser(empUser.id, 100);
      const periodUpdates = userUpdates.filter(update => 
        new Date(update.date) >= startDate && new Date(update.date) <= now
      );

      // Calculate metrics
      const totalUpdates = periodUpdates.length;
      const avgProgressScore = totalUpdates > 0 
        ? periodUpdates.reduce((sum, update) => sum + update.progressScore, 0) / totalUpdates
        : 0;

      // Calculate expected updates (assuming workdays only)
      const workDays = getWorkDaysInPeriod(startDate, now);
      const updateConsistency = workDays > 0 ? (totalUpdates / workDays) * 100 : 0;

      // Get interview performance (placeholder for now)
      const interviews = await db.getInterviewsByUser(empUser.id);
      const completedInterviews = interviews.filter(i => i.status === 'completed');
      let interviewPerformance = 0;
      
      for (const interview of completedInterviews) {
        const feedback = await db.getFeedbackByInterview(interview.id);
        if (feedback) {
          interviewPerformance = feedback.overallRating;
          break; // Use most recent for now
        }
      }

      // Calculate project contributions (simplified)
      const projects = await db.getProjectsByUser(empUser.id);
      const activeProjects = projects.filter(p => p.status === 'active').length;
      const projectContributions = Math.min(activeProjects * 2, 10); // Cap at 10

      // Calculate total score (weighted average)
      const totalScore = (
        avgProgressScore * 0.4 +          // 40% weight on daily progress
        (updateConsistency / 10) * 0.3 +   // 30% weight on consistency
        interviewPerformance * 0.2 +       // 20% weight on interviews
        projectContributions * 0.1         // 10% weight on projects
      );

      entries.push({
        userId: empUser.id,
        user: {
          firstName: empUser.firstName,
          lastName: empUser.lastName,
          department: empUser.department || 'Unknown'
        },
        totalScore: Math.round(totalScore * 10) / 10,
        rank: 0, // Will be set after sorting
        updateConsistency: Math.round(updateConsistency * 10) / 10,
        averageProgressScore: Math.round(avgProgressScore * 10) / 10,
        interviewPerformance: Math.round(interviewPerformance * 10) / 10,
        projectContributions: Math.round(projectContributions * 10) / 10,
        lastUpdated: new Date()
      });
    }

    // Sort by total score and assign ranks
    entries.sort((a, b) => b.totalScore - a.totalScore);
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    const leaderboard: LeaderboardResponse = {
      entries,
      period,
      generatedAt: new Date()
    };

    res.json({
      success: true,
      data: leaderboard
    } as ApiResponse<LeaderboardResponse>);
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
};

export const getUserRank: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const user = authReq.user!;
    const period = (req.query.period as 'weekly' | 'monthly' | 'quarterly') || 'monthly';

    // Get the full leaderboard
    const mockReq = { ...req, query: { period } };
    const mockRes = {
      json: (data: any) => data,
      status: () => mockRes
    };

    // This is a bit hacky - in a real app you'd extract the logic into a shared function
    const response = await new Promise<ApiResponse<LeaderboardResponse>>((resolve) => {
      const originalJson = mockRes.json;
      mockRes.json = (data: any) => {
        resolve(data);
        return originalJson(data);
      };
      
      getLeaderboard(mockReq as any, mockRes as any, () => {});
    });

    if (!response.success || !response.data) {
      throw new Error('Failed to get leaderboard data');
    }

    const userEntry = response.data.entries.find(entry => entry.userId === user.id);

    if (!userEntry) {
      return res.status(404).json({
        success: false,
        error: 'User not found in leaderboard'
      } as ApiResponse<never>);
    }

    res.json({
      success: true,
      data: userEntry
    } as ApiResponse<LeaderboardEntry>);
  } catch (error) {
    console.error('Get user rank error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    } as ApiResponse<never>);
  }
};

// Helper function to calculate work days (excluding weekends)
function getWorkDaysInPeriod(startDate: Date, endDate: Date): number {
  let workDays = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
      workDays++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return workDays;
}

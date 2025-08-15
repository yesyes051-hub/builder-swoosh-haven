import { connectToDatabase } from './mongodb';
import { 
  ProjectDetail, 
  Ticket, 
  StandupCall, 
  Timesheet, 
  Accessory, 
  Birthday,
  InterviewFeedbackEnhanced 
} from '../models/pms';

export async function seedPMSData() {
  try {
    await connectToDatabase();
    
    // Check if data already exists
    const existingProjects = await ProjectDetail.countDocuments();
    if (existingProjects > 0) {
      console.log('✅ PMS data already seeded');
      return;
    }

    // Seed Projects
    const sampleProjects = [
      {
        projectName: 'TrackZen Enhancement',
        projectManager: 'manager-001',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-06-15'),
        status: 'In Progress',
        priority: 'High',
        description: 'Enhancing the TrackZen platform with new PMS features and improved user experience',
        teamMembers: ['emp-001', 'emp-002', 'emp-003'],
        budget: 50000
      },
      {
        projectName: 'Mobile App Development',
        projectManager: 'manager-002',
        startDate: new Date('2024-02-01'),
        status: 'Planning',
        priority: 'Medium',
        description: 'Developing a mobile application for the TrackZen platform',
        teamMembers: ['emp-004', 'emp-005'],
        budget: 75000
      },
      {
        projectName: 'Security Audit',
        projectManager: 'manager-001',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-03-01'),
        status: 'Completed',
        priority: 'Critical',
        description: 'Comprehensive security audit and vulnerability assessment',
        teamMembers: ['emp-006'],
        budget: 25000
      }
    ];

    await ProjectDetail.insertMany(sampleProjects);

    // Seed Tickets
    const sampleTickets = [
      {
        ticketId: 'TKT-0001',
        projectId: 'project-001',
        title: 'Implement user authentication',
        description: 'Add JWT-based authentication system for secure user login',
        assignedTo: 'emp-001',
        reportedBy: 'manager-001',
        status: 'In Progress',
        priority: 'High',
        type: 'Feature',
        estimatedHours: 16,
        actualHours: 12,
        dueDate: new Date('2024-02-15')
      },
      {
        ticketId: 'TKT-0002',
        projectId: 'project-001',
        title: 'Fix dashboard loading issue',
        description: 'Dashboard takes too long to load on slower connections',
        assignedTo: 'emp-002',
        reportedBy: 'emp-003',
        status: 'Pending',
        priority: 'Medium',
        type: 'Bug',
        estimatedHours: 8,
        dueDate: new Date('2024-02-10')
      },
      {
        ticketId: 'TKT-0003',
        projectId: 'project-002',
        title: 'Design mobile UI components',
        description: 'Create reusable UI components for mobile application',
        assignedTo: 'emp-004',
        reportedBy: 'manager-002',
        status: 'In Review',
        priority: 'High',
        type: 'Task',
        estimatedHours: 24,
        actualHours: 20
      }
    ];

    await Ticket.insertMany(sampleTickets);

    // Seed Birthdays
    const sampleBirthdays = [
      {
        userId: 'emp-001',
        name: 'Alice Johnson',
        department: 'Engineering',
        role: 'Software Engineer',
        birthday: new Date('1990-02-14'), // Valentine's Day
        email: 'alice.johnson@company.com',
        wishSent: false
      },
      {
        userId: 'emp-002',
        name: 'Bob Smith',
        department: 'Engineering',
        role: 'Senior Software Engineer',
        birthday: new Date('1988-12-25'), // Christmas
        email: 'bob.smith@company.com',
        wishSent: false
      },
      {
        userId: 'emp-003',
        name: 'Carol Davis',
        department: 'Design',
        role: 'UI/UX Designer',
        birthday: new Date('1992-01-01'), // New Year
        email: 'carol.davis@company.com',
        wishSent: false
      },
      {
        userId: 'manager-001',
        name: 'David Wilson',
        department: 'Engineering',
        role: 'Engineering Manager',
        birthday: new Date('1985-03-15'),
        email: 'david.wilson@company.com',
        wishSent: false
      },
      {
        userId: 'hr-001',
        name: 'Emma Brown',
        department: 'Human Resources',
        role: 'HR Manager',
        birthday: new Date('1987-07-20'),
        email: 'emma.brown@company.com',
        wishSent: false
      }
    ];

    await Birthday.insertMany(sampleBirthdays);

    // Seed Timesheets
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const sampleTimesheets = [
      {
        userId: 'emp-001',
        projectId: 'project-001',
        date: today,
        hoursWorked: 8,
        taskDescription: 'Implemented user authentication module',
        status: 'Submitted',
        billable: true
      },
      {
        userId: 'emp-002',
        projectId: 'project-001',
        date: yesterday,
        hoursWorked: 7.5,
        taskDescription: 'Fixed dashboard performance issues',
        status: 'Approved',
        billable: true
      },
      {
        userId: 'emp-003',
        projectId: 'project-001',
        date: today,
        hoursWorked: 6,
        taskDescription: 'Code review and testing',
        status: 'Draft',
        billable: true
      }
    ];

    await Timesheet.insertMany(sampleTimesheets);

    // Seed Accessories
    const sampleAccessories = [
      {
        userId: 'emp-001',
        itemName: 'MacBook Pro 16"',
        itemType: 'Laptop',
        serialNumber: 'MBP-001-2024',
        assignedDate: new Date('2024-01-01'),
        status: 'Assigned',
        condition: 'New',
        cost: 2500,
        vendor: 'Apple Inc.'
      },
      {
        userId: 'emp-002',
        itemName: 'Dell Monitor 27"',
        itemType: 'Monitor',
        serialNumber: 'DELL-MON-002',
        assignedDate: new Date('2024-01-05'),
        status: 'Assigned',
        condition: 'Good',
        cost: 300,
        vendor: 'Dell Technologies'
      },
      {
        userId: 'emp-003',
        itemName: 'Wireless Keyboard',
        itemType: 'Keyboard',
        assignedDate: new Date('2024-01-10'),
        status: 'Assigned',
        condition: 'New',
        cost: 150,
        vendor: 'Logitech'
      }
    ];

    await Accessory.insertMany(sampleAccessories);

    console.log('✅ PMS data seeded successfully');
    
    return {
      projects: sampleProjects.length,
      tickets: sampleTickets.length,
      birthdays: sampleBirthdays.length,
      timesheets: sampleTimesheets.length,
      accessories: sampleAccessories.length
    };
  } catch (error) {
    console.error('❌ Error seeding PMS data:', error);
    throw error;
  }
}

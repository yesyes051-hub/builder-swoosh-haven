import bcrypt from 'bcryptjs';
import { EmployeeUser } from '../models/employeeManagement';

export async function seedEmployeeManagementData() {
  try {
    // Check if users already exist
    const existingUsers = await EmployeeUser.countDocuments();
    if (existingUsers > 0) {
      console.log('✅ Employee Management users already exist');
      return;
    }

    console.log('🌱 Seeding Employee Management data...');

    // Demo users with hashed passwords
    const demoUsers = [
      {
        firstName: 'Admin',
        lastName: 'User',
        gender: 'Male' as const,
        email: 'admin@trackzen.com',
        contactNumber: '1234567890',
        jobStatus: 'Full-Time' as const,
        role: 'HR' as const, // Note: Using HR as the admin equivalent since our new schema doesn't have admin
        password: await bcrypt.hash('admin123', 12)
      },
      {
        firstName: 'Sarah',
        lastName: 'Johnson',
        gender: 'Female' as const,
        email: 'hr@trackzen.com',
        contactNumber: '1234567891',
        jobStatus: 'Full-Time' as const,
        role: 'HR' as const,
        password: await bcrypt.hash('hr123', 12)
      },
      {
        firstName: 'Mike',
        lastName: 'Wilson',
        gender: 'Male' as const,
        email: 'manager@trackzen.com',
        contactNumber: '1234567892',
        jobStatus: 'Full-Time' as const,
        role: 'Manager' as const,
        password: await bcrypt.hash('manager123', 12)
      },
      {
        firstName: 'Emily',
        lastName: 'Davis',
        gender: 'Female' as const,
        email: 'employee@trackzen.com',
        contactNumber: '1234567893',
        jobStatus: 'Full-Time' as const,
        role: 'Employee' as const,
        password: await bcrypt.hash('employee123', 12)
      }
    ];

    // Insert demo users
    await EmployeeUser.insertMany(demoUsers);

    console.log('✅ Employee Management demo users created successfully');
    console.log('Demo credentials:');
    console.log('- admin@trackzen.com / admin123 (HR)');
    console.log('- hr@trackzen.com / hr123 (HR)');
    console.log('- manager@trackzen.com / manager123 (Manager)');
    console.log('- employee@trackzen.com / employee123 (Employee)');

  } catch (error) {
    console.error('❌ Error seeding Employee Management data:', error);
  }
}

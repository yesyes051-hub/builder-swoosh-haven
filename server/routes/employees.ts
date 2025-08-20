import { RequestHandler } from 'express';
import { EmployeeUser } from '../models/employeeManagement';
import { ApiResponse } from '@shared/api';

export interface EmployeeOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department?: string;
  role: string;
  jobStatus: string;
}

export interface EmployeeCount {
  totalEmployees: number;
}

// Get total employee count
export const getEmployeeCount: RequestHandler = async (req, res) => {
  try {
    console.log('📊 Fetching total employee count...');
    
    const totalEmployees = await EmployeeUser.countDocuments();
    
    console.log('✅ Employee count retrieved:', totalEmployees);
    
    res.json({
      success: true,
      data: { totalEmployees }
    } as ApiResponse<EmployeeCount>);

  } catch (error) {
    console.error('Get employee count error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch employee count'
    } as ApiResponse<never>);
  }
};

// Get all employees for dropdown selection
export const getAllEmployees: RequestHandler = async (req, res) => {
  try {
    console.log('👥 Fetching all employees for dropdown...');
    
    const employees = await EmployeeUser.find({})
      .select('firstName lastName email role jobStatus')
      .sort({ firstName: 1, lastName: 1 });

    const formattedEmployees: EmployeeOption[] = employees.map(employee => ({
      id: employee._id.toString(),
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      role: employee.role.toLowerCase(),
      jobStatus: employee.jobStatus,
      department: 'General' // Default department since it's not in current schema
    }));

    console.log('✅ Employees retrieved:', formattedEmployees.length);
    
    res.json({
      success: true,
      data: formattedEmployees
    } as ApiResponse<EmployeeOption[]>);

  } catch (error) {
    console.error('Get all employees error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch employees'
    } as ApiResponse<never>);
  }
};

// Get employees by role (for filtering candidates vs interviewers)
export const getEmployeesByRole: RequestHandler = async (req, res) => {
  try {
    const { role } = req.params;
    console.log(`👥 Fetching employees with role: ${role}...`);
    
    const employees = await EmployeeUser.find({ role: new RegExp(role, 'i') })
      .select('firstName lastName email role jobStatus')
      .sort({ firstName: 1, lastName: 1 });

    const formattedEmployees: EmployeeOption[] = employees.map(employee => ({
      id: employee._id.toString(),
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      role: employee.role.toLowerCase(),
      jobStatus: employee.jobStatus,
      department: 'General'
    }));

    console.log('✅ Employees by role retrieved:', formattedEmployees.length);
    
    res.json({
      success: true,
      data: formattedEmployees
    } as ApiResponse<EmployeeOption[]>);

  } catch (error) {
    console.error('Get employees by role error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch employees by role'
    } as ApiResponse<never>);
  }
};

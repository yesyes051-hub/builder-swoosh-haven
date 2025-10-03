import mongoose, { Document, Schema } from 'mongoose';

// Employee Management User Schema for ROLES collection
export interface IEmployeeUser extends Document {
  firstName: string;
  lastName: string;
  gender: 'Male' | 'Female' | 'Other';
  email: string;
  contactNumber?: string;
  jobStatus: 'Intern' | 'Full-Time' | 'On-Job Training' | 'Part-Time';
  role: 'HR' | 'Manager' | 'Employee';
  password: string;
  createdAt: Date;
}

const EmployeeUserSchema = new Schema<IEmployeeUser>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  gender: { 
    type: String, 
    enum: ['Male', 'Female', 'Other'], 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true 
  },
  contactNumber: { type: String },
  jobStatus: { 
    type: String, 
    enum: ['Intern', 'Full-Time', 'On-Job Training', 'Part-Time'], 
    required: true 
  },
  role: { 
    type: String, 
    enum: ['HR', 'Manager', 'Employee'], 
    required: true 
  },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Create connection to trackzen database
const EMP_URI = process.env.EMP_MONGO_URI || process.env.MONGODB_URI;
if (!EMP_URI) {
  console.warn('EMP_MONGO_URI/MONGODB_URI is not set. Employee management DB connection will fail until configured.');
}
const employeeManagementConnection = mongoose.createConnection(
  EMP_URI || ''
);

// Add connection event listeners
employeeManagementConnection.on('connected', () => {
  console.log('✅ Connected to Employee Management MongoDB database');
});

employeeManagementConnection.on('error', (err) => {
  console.error('❌ Employee Management MongoDB connection error:', err);
});

employeeManagementConnection.on('disconnected', () => {
  console.log('🔌 Employee Management MongoDB disconnected');
});

// Export the model using the specific connection and collection name
export const EmployeeUser = employeeManagementConnection.model<IEmployeeUser>('ROLES', EmployeeUserSchema);

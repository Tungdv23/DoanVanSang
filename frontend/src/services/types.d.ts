export type DepartmentStatus = 'active' | 'inactive';

export interface Department {
  id: string;
  code: string;
  name: string;
  foundedYear: number;
  status: DepartmentStatus;
}

export interface Position {
  id: string;
  code: string;
  name: string;
  description?: string;
}

export interface Employee {
  id: string;
  employeeCode: string;
  fullName: string;
  email: string;
  phone?: string;
  departmentId: string;
  positionId: string;
  baseSalary: number;
  status: 'active' | 'inactive';
  joinedAt: string;
}

export interface SalaryBaseHistory {
  employeeId: string;
  baseSalary: number;
  effectiveFromMonth: string;
}

export interface WorkSession {
  id: string;
  employeeId: string;
  startAt: string;
  endAt?: string;
  source: string;
  confidence?: number;
  liveness?: string;
  note?: string;
}

export interface MonthlyPayroll {
  employeeId: string;
  year: number;
  month: number;
  totalHours: number;
  overtimeHours: number;
  baseSalary: number;
  overtimePay: number;
  totalPay: number;
  status: 'draft' | 'approved' | 'paid';
}

export type AttendanceType = 'checkin' | 'checkout';

export interface FaceEmbeddingRow {
  employeeId: string;
  embedding: number[];
  createdAt: string;
}

export interface EnrollFacePayload {
  employeeId: string;
  embedding: number[];
  snapshot?: string;
}

export interface EnrollFaceResponse {
  employeeId: string;
  createdAt: string;
  source: 'remote' | 'local';
}

export interface FaceCheckPayload {
  embedding: number[];
  type: AttendanceType;
  threshold?: number;
}

export interface FaceCheckResponse {
  employeeId: string;
  type: AttendanceType;
  timestamp: string;
  distance: number;
  threshold: number;
  source: 'remote' | 'local';
}

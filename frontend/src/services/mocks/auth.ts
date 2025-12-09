export const adminAccount = {
  id: 'admin-001',
  email: 'admin@hrpro.vn',
  password: 'Admin@12345',
  fullName: 'Quản Trị Viên HR Pro',
  role: 'admin' as const,
};

export const verifyAdminLogin = (email: string, password: string) => {
  return email === adminAccount.email && password === adminAccount.password;
};

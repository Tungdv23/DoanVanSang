import type { Employee } from '../components/ui/EmployeePage';
import type { NewEmployeeData } from '../components/ui/AddEmployeeModal';
import type { EmployeeEditData } from '../components/ui/EditEmployeeModal';
import { apiFetch, buildApiUrl } from './api';
import { extractJoinOrderFromCode } from '../utils/employeeCode';

const STORAGE_KEY = 'employeesData';

type ApiEmployeeRow = {
  id: string | number;
  code?: string;
  name: string;
  dept?: string;
  position?: string;
  dept_id?: string | number | null;
  position_id?: string | number | null;
  salary?: number | string;
  status?: 'active' | 'inactive';
  photo?: string | null;
  tai_khoan?: string;
  mat_khau?: string;
  created_at?: string;
  updated_at?: string;
};

const getLocal = (): Employee[] => {
  if (typeof localStorage === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Employee[];
  } catch (error) {
    console.warn('Không đọc được employeesData:', error);
    return [];
  }
};

const saveLocal = (rows: Employee[]) => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
};

const generateId = () => (crypto.randomUUID?.() ?? `${Date.now()}`);

const toViewModel = (employee: ApiEmployeeRow, previous?: Employee): Employee => {
  const joinOrder = extractJoinOrderFromCode(employee.code ?? '') ?? previous?.joinOrder;
  return {
    id: String(employee.id),
    code: employee.code ?? previous?.code ?? '',
    name: employee.name,
    dept: employee.dept ?? previous?.dept ?? '',
    departmentId: employee.dept_id ? String(employee.dept_id) : previous?.departmentId ?? null,
    position: employee.position ?? previous?.position ?? '',
    positionId: employee.position_id ? String(employee.position_id) : previous?.positionId ?? null,
    baseSalary: Number(employee.salary ?? previous?.baseSalary ?? 0),
    level: previous?.level ?? "STAFF",
    status: (employee.status as Employee["status"]) ?? previous?.status ?? 'active',
    visible: previous?.visible ?? true,
    photo: employee.photo ?? undefined,
    joinOrder,
    joinedAt: employee.created_at
      ? new Date(employee.created_at).toISOString()
      : previous?.joinedAt ?? new Date().toISOString(),
    taiKhoan: employee.tai_khoan ?? previous?.taiKhoan ?? '',
    matKhau: employee.mat_khau ?? previous?.matKhau ?? '',
    account: employee.tai_khoan ?? previous?.account ?? '',
    password: employee.mat_khau ?? previous?.password ?? '',
    createdAt: employee.created_at ?? previous?.createdAt ?? new Date().toISOString(),
    updatedAt: employee.updated_at ?? previous?.updatedAt ?? new Date().toISOString(),
  };
};

export const employeesService = {
  getLocalSnapshot: getLocal,
  saveLocalSnapshot: saveLocal,
  async authenticate(account: string, password: string): Promise<Employee | null> {
    try {
      await apiFetch(buildApiUrl('/employees/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taiKhoan: account, matKhau: password }),
      });
      const employees = await employeesService.list();
      const matched =
        employees.find((emp) => emp.account === account && emp.password === password) ?? null;
      if (matched) return matched;
    } catch (error) {
      console.warn('Không xác thực được nhân viên trên backend.', error);
    }
    const local = getLocal();
    return local.find((emp) => emp.taiKhoan === account && emp.matKhau === password) ?? null;
  },
  async list(): Promise<Employee[]> {
    try {
      const cached = getLocal();
      const data = await apiFetch<ApiEmployeeRow[]>(buildApiUrl('/employees'));
      const mapped = (data ?? []).map((row) => {
        const previous = cached.find((item) => item.id === String(row.id));
        return toViewModel(row, previous);
      });
      saveLocal(mapped);
      return mapped;
    } catch (error) {
      console.warn('Không tải được danh sách nhân viên từ backend, dùng dữ liệu offline.', error);
      return getLocal();
    }
  },
  async create(payload: NewEmployeeData): Promise<Employee | null> {
    try {
      const response = await apiFetch<{ id: string; code: string }>(buildApiUrl('/employees'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: payload.name,
          dept: payload.dept,
          position: payload.position,
          salary: payload.baseSalary,
          taiKhoan: payload.taiKhoan,
          matKhau: payload.matKhau,
          photo: payload.photo,
          status: payload.status,
        }),
      });
      const now = new Date().toISOString();
      const viewModel: Employee = {
        id: response.id ?? generateId(),
        code: response.code ?? payload.code,
        name: payload.name,
        dept: payload.dept,
        departmentId: payload.departmentId ?? null,
        position: payload.position,
        positionId: payload.positionId ?? null,
        baseSalary: payload.baseSalary,
        level: payload.level,
        status: payload.status,
        visible: true,
        photo: payload.photo ?? undefined,
        joinOrder: extractJoinOrderFromCode(response.code ?? payload.code) ?? undefined,
        joinedAt: new Date(payload.joinedAt).toISOString(),
        taiKhoan: payload.taiKhoan,
        matKhau: payload.matKhau,
        account: payload.taiKhoan,
        password: payload.matKhau,
        createdAt: now,
        updatedAt: now,
      };
      const local = getLocal();
      saveLocal([viewModel, ...local.filter((row) => row.id !== viewModel.id)]);
      return viewModel;
    } catch (error) {
      console.warn('Không thể tạo nhân viên trên backend, dùng chế độ offline.', error);
      const viewModel: Employee = {
        id: generateId(),
        code: payload.code,
        name: payload.name,
        dept: payload.dept,
        departmentId: payload.departmentId,
        position: payload.position,
        positionId: payload.positionId,
        baseSalary: payload.baseSalary,
        level: payload.level,
        status: payload.status,
        visible: true,
        photo: payload.photo ?? undefined,
        joinOrder: extractJoinOrderFromCode(payload.code) ?? undefined,
        joinedAt: new Date(payload.joinedAt).toISOString(),
        taiKhoan: payload.taiKhoan,
        matKhau: payload.matKhau,
        account: payload.taiKhoan,
        password: payload.matKhau,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const local = getLocal();
      saveLocal([viewModel, ...local.filter((row) => row.id !== viewModel.id)]);
      return viewModel;
    }
  },
  async update(employeeId: string, payload: EmployeeEditData): Promise<Employee | null> {
    try {
      await apiFetch(buildApiUrl(`/employees/${employeeId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: payload.name,
          dept: payload.dept,
          position: payload.position,
          salary: payload.baseSalary,
          status: payload.status,
          taiKhoan: payload.taiKhoan,
          matKhau: payload.matKhau,
        }),
      });
      const localBefore = getLocal();
      const existing = localBefore.find((row) => row.id === employeeId);
      const viewModel = existing
        ? {
            ...existing,
            name: payload.name,
            dept: payload.dept,
            position: payload.position,
            baseSalary: payload.baseSalary,
            status: payload.status,
            taiKhoan: payload.taiKhoan,
            matKhau: payload.matKhau ?? existing.matKhau,
            account: payload.taiKhoan,
            password: payload.matKhau ?? existing.password,
            photo: payload.photo ?? existing.photo,
            updatedAt: new Date().toISOString(),
            level: payload.level ?? existing.level,
          }
        : {
            id: employeeId,
            code: payload.code ?? '',
            name: payload.name,
            dept: payload.dept,
            departmentId: payload.departmentId ?? null,
            position: payload.position,
            positionId: payload.positionId ?? null,
            baseSalary: payload.baseSalary,
            level: payload.level ?? "STAFF",
            status: payload.status,
            visible: true,
            photo: payload.photo ?? undefined,
            joinOrder: extractJoinOrderFromCode(payload.code ?? '') ?? undefined,
            joinedAt: new Date(payload.joinedAt ?? new Date().toISOString()).toISOString(),
            taiKhoan: payload.taiKhoan ?? '',
            matKhau: payload.matKhau ?? '',
            account: payload.taiKhoan ?? '',
            password: payload.matKhau ?? '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
      const local = getLocal().map((row) => (row.id === employeeId ? viewModel : row));
      saveLocal(local);
      return viewModel;
    } catch (error) {
      console.warn('Không cập nhật được nhân viên trên backend.', error);
      const local = getLocal().map((row) =>
        row.id === employeeId
          ? {
              ...row,
              name: payload.name,
              baseSalary: payload.baseSalary,
              status: payload.status,
              account: payload.taiKhoan ?? row.account,
              taiKhoan: payload.taiKhoan ?? row.taiKhoan,
              matKhau: payload.matKhau ?? row.matKhau,
              password: payload.matKhau ?? row.password,
              positionId: payload.positionId ?? row.positionId,
              departmentId: payload.departmentId ?? row.departmentId,
              position: payload.position ?? row.position,
              dept: payload.dept ?? row.dept,
              code: payload.code ?? row.code,
              photo: payload.photo ?? row.photo,
              joinedAt: payload.joinedAt ?? row.joinedAt,
              level: payload.level ?? row.level,
              updatedAt: new Date().toISOString(),
            }
          : row
      );
      saveLocal(local);
      return local.find((r) => r.id === employeeId) ?? null;
    }
  },
  async remove(employeeId: string): Promise<boolean> {
    try {
      await apiFetch(buildApiUrl(`/employees/${employeeId}`), { method: 'DELETE' });
      const local = getLocal().filter((row) => row.id !== employeeId);
      saveLocal(local);
      return true;
    } catch (error) {
      console.warn('Không xóa được nhân viên trên backend.', error);
      return false;
    }
  },
};

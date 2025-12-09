import type { Employee } from '../components/ui/EmployeePage';
import type { NewEmployeeData } from '../components/ui/AddEmployeeModal';
import type { EmployeeEditData } from '../components/ui/EditEmployeeModal';
import { supabase } from '@/lib/supabaseClient';
import { extractJoinOrderFromCode } from '../utils/employeeCode';

const STORAGE_KEY = 'employeesData';

type RelationRow = { id: string; name: string | null };

type SupabaseEmployeeRow = {
  id: string;
  employee_code: string;
  full_name: string;
  department_id: string;
  position_id: string;
  departments?: RelationRow | RelationRow[] | null;
  positions?: RelationRow | RelationRow[] | null;
  base_salary: number;
  status: 'active' | 'inactive';
  joined_at: string;
  photo_url?: string | null;
  account: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
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

const resolveRelation = (relation?: RelationRow | RelationRow[] | null) => {
  if (!relation) return null;
  return Array.isArray(relation) ? relation[0] ?? null : relation;
};

const toViewModel = (employee: SupabaseEmployeeRow, previous?: Employee): Employee => {
  const joinOrder = extractJoinOrderFromCode(employee.employee_code) ?? undefined;
  const department = resolveRelation(employee.departments);
  const position = resolveRelation(employee.positions);
  return {
    id: employee.id,
    code: employee.employee_code,
    name: employee.full_name,
    dept: department?.name ?? '',
    departmentId: employee.department_id,
    position: position?.name ?? '',
    positionId: employee.position_id,
    baseSalary: Number(employee.base_salary),
    level: previous?.level ?? "STAFF",
    status: employee.status,
    visible: true,
    photo: employee.photo_url ?? undefined,
    joinOrder,
    joinedAt: new Date(employee.joined_at).toISOString(),
    taiKhoan: employee.account,
    matKhau: employee.password_hash,
    account: employee.account,
    password: employee.password_hash,
    createdAt: employee.created_at,
    updatedAt: employee.updated_at,
  };
};

export const employeesService = {
  getLocalSnapshot: getLocal,
  saveLocalSnapshot: saveLocal,
  async authenticate(account: string, password: string): Promise<Employee | null> {
    try {
      const cached = getLocal();
      const { data, error } = await supabase
        .from('employees')
        .select(`
          id,
          employee_code,
          full_name,
          department_id,
          position_id,
          base_salary,
          status,
          joined_at,
          account,
          password_hash,
          photo_url,
          created_at,
          updated_at,
          departments:department_id ( id, name ),
          positions:position_id ( id, name )
        `)
        .eq('account', account)
        .eq('password_hash', password)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const viewModel = toViewModel(
        data as SupabaseEmployeeRow,
        cached.find((row) => row.id === (data as SupabaseEmployeeRow).id)
      );
      const local = cached;
      const next = [viewModel, ...local.filter((row) => row.id !== viewModel.id)];
      saveLocal(next);
      return viewModel;
    } catch (error) {
      console.warn('Không xác thực được nhân viên trên backend.', error);
      const local = getLocal();
      return (
        local.find((emp) => emp.taiKhoan === account && emp.matKhau === password) ?? null
      );
    }
  },
  async list(): Promise<Employee[]> {
    try {
      const cached = getLocal();
      const { data, error } = await supabase
        .from('employees')
        .select(`
          id,
          employee_code,
          full_name,
          department_id,
          position_id,
          base_salary,
          status,
          joined_at,
          account,
          password_hash,
          photo_url,
          created_at,
          updated_at,
          departments:department_id ( id, name ),
          positions:position_id ( id, name )
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const mapped = (data ?? []).map((row: Record<string, unknown>) => {
        const typed = row as SupabaseEmployeeRow;
        const previous = cached.find((item) => item.id === typed.id);
        return toViewModel(typed, previous);
      });
      saveLocal(mapped);
      return mapped;
    } catch (error) {
      console.warn('Không tải được danh sách nhân viên từ backend, dùng dữ liệu offline.', error);
      return getLocal();
    }
  },
  async create(payload: NewEmployeeData): Promise<Employee | null> {
    if (!payload.departmentId || !payload.positionId) {
      console.warn('Thiếu phòng ban hoặc chức vụ khi tạo nhân viên.');
      return null;
    }

    if (!supabase) {
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

    const { data, error } = await supabase
      .from('employees')
      .insert({
        employee_code: payload.code,
        full_name: payload.name,
        department_id: payload.departmentId,
        position_id: payload.positionId,
        base_salary: payload.baseSalary,
        status: payload.status,
        joined_at: payload.joinedAt,
        account: payload.taiKhoan,
        password_hash: payload.matKhau,
        photo_url: payload.photo ?? null,
      })
      .select(`
        id,
        employee_code,
        full_name,
        department_id,
        position_id,
        base_salary,
        status,
        joined_at,
        account,
        password_hash,
        photo_url,
        created_at,
        updated_at,
        departments:department_id ( id, name ),
        positions:position_id ( id, name )
      `)
      .single();
    if (error || !data) {
      throw error ?? new Error('Không thể tạo nhân viên.');
    }
    const viewModel = {
      ...toViewModel(data as SupabaseEmployeeRow),
      level: payload.level,
    };
    const local = getLocal();
    saveLocal([viewModel, ...local.filter((row) => row.id !== viewModel.id)]);
    return viewModel;
  },
  async update(employeeId: string, payload: EmployeeEditData): Promise<Employee | null> {
    if (!supabase) {
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
    const updatePayload: Record<string, unknown> = {
      full_name: payload.name,
      base_salary: payload.baseSalary,
      status: payload.status,
      account: payload.taiKhoan,
      joined_at: payload.joinedAt,
      photo_url: payload.photo ?? null,
    };
    if (payload.code) updatePayload.employee_code = payload.code;
    if (payload.departmentId) updatePayload.department_id = payload.departmentId;
    if (payload.positionId) updatePayload.position_id = payload.positionId;
    if (payload.matKhau) updatePayload.password_hash = payload.matKhau;
    try {
      const { data, error } = await supabase
        .from('employees')
        .update(updatePayload)
        .eq('id', employeeId)
        .select(`
          id,
          employee_code,
          full_name,
          department_id,
          position_id,
          base_salary,
          status,
          joined_at,
          account,
          password_hash,
          photo_url,
          created_at,
          updated_at,
          departments:department_id ( id, name ),
          positions:position_id ( id, name )
        `)
        .single();
      if (error || !data) {
        throw error ?? new Error('Không thể cập nhật nhân viên.');
      }
      const viewModel = {
        ...toViewModel(data as SupabaseEmployeeRow),
        level: payload.level,
      };
      const local = getLocal().map((row) => (row.id === viewModel.id ? viewModel : row));
      saveLocal(local);
      return viewModel;
    } catch (error) {
      console.warn('Không cập nhật được nhân viên trên backend.', error);
      return null;
    }
  },
  async remove(employeeId: string): Promise<boolean> {
    try {
      if (!supabase) {
        const local = getLocal().filter((row) => row.id !== employeeId);
        saveLocal(local);
        return true;
      }
      const { error } = await supabase.from('employees').delete().eq('id', employeeId);
      if (error) throw error;
      const local = getLocal().filter((row) => row.id !== employeeId);
      saveLocal(local);
      return true;
    } catch (error) {
      console.warn('Không xóa được nhân viên trên backend.', error);
      return false;
    }
  },
};

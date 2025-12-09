import type { DepartmentStatus } from './types';
import { supabase } from '@/lib/supabaseClient';

const STORAGE_KEY = 'departmentsData';

type SupabaseDepartmentRow = {
  id: string;
  code: string;
  name: string;
  founded_year?: number | null;
  status: DepartmentStatus;
};

export type DepartmentPayload = {
  maPhong: string;
  tenPhong: string;
  namThanhLap: number;
  trangThai: DepartmentStatus;
};

export type DepartmentViewModel = DepartmentPayload & {
  id: string;
  visible: boolean;
  truongPhong?: string;
};

const toViewModel = (dept: SupabaseDepartmentRow): DepartmentViewModel => ({
  id: dept.id,
  maPhong: dept.code,
  tenPhong: dept.name,
  namThanhLap: dept.founded_year ?? new Date().getFullYear(),
  trangThai: dept.status,
  visible: true,
});

const toBackendPayload = (payload: Partial<DepartmentPayload>) => {
  const body: Record<string, unknown> = {};
  if (payload.maPhong !== undefined) body.code = payload.maPhong;
  if (payload.tenPhong !== undefined) body.name = payload.tenPhong;
  if (payload.namThanhLap !== undefined) body.founded_year = payload.namThanhLap;
  if (payload.trangThai !== undefined) body.status = payload.trangThai;
  return body;
};

const getLocalDepartments = (): DepartmentViewModel[] => {
  if (typeof localStorage === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as DepartmentViewModel[];
  } catch (error) {
    console.warn('Không thể đọc dữ liệu departmentsData:', error);
    return [];
  }
};

const saveLocalDepartments = (rows: DepartmentViewModel[]) => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
};

const ensureSeedData = (seed: DepartmentViewModel[] = []) => {
  const existing = getLocalDepartments();
  if (existing.length) return existing;
  saveLocalDepartments(seed);
  return seed;
};

const mergeVisibility = (
  remoteRows: DepartmentViewModel[],
  cachedRows: DepartmentViewModel[]
) => {
  const visibilityMap = cachedRows.reduce<Record<string, boolean>>((acc, row) => {
    acc[row.id] = row.visible;
    acc[row.maPhong] = row.visible;
    return acc;
  }, {});

  return remoteRows.map((row) => ({
    ...row,
    visible: visibilityMap[row.id] ?? visibilityMap[row.maPhong] ?? true,
  }));
};

export const departmentsService = {
  loadLocal(seed?: DepartmentViewModel[]) {
    return ensureSeedData(seed);
  },
  saveLocal: saveLocalDepartments,
  createLocalRecord(payload: DepartmentPayload, idGenerator: () => string): DepartmentViewModel {
    return {
      id: idGenerator(),
      maPhong: payload.maPhong,
      tenPhong: payload.tenPhong,
      namThanhLap: payload.namThanhLap,
      trangThai: payload.trangThai,
      visible: true,
    };
  },
  async list(seed?: DepartmentViewModel[]): Promise<DepartmentViewModel[]> {
    const cached = ensureSeedData(seed);
    try {
      if (!supabase) {
        // Không có Supabase: trả cache/local seed
        return cached;
      }
      const { data, error } = await supabase
        .from('departments')
        .select('id, code, name, founded_year, status')
        .order('name', { ascending: true });
      if (error) throw error;
      const mapped = mergeVisibility((data ?? []).map(toViewModel), cached);
      saveLocalDepartments(mapped);
      return mapped;
    } catch (error) {
      console.warn('Không thể tải danh sách phòng ban từ backend, sử dụng cache local.', error);
      return cached;
    }
  },
  async create(payload: DepartmentPayload): Promise<DepartmentViewModel> {
    if (!supabase) {
      // Fallback local-only khi thiếu Supabase
      const record = this.createLocalRecord(payload, () => crypto.randomUUID?.() ?? Date.now().toString());
      const existing = getLocalDepartments().filter((row) => row.id !== record.id);
      const next = [...existing, record];
      saveLocalDepartments(next);
      return record;
    }
    const body = toBackendPayload(payload);
    const { data, error } = await supabase
      .from('departments')
      .insert(body)
      .select('id, code, name, founded_year, status')
      .single();
    if (error || !data) {
      throw error ?? new Error('Không thể tạo phòng ban.');
    }
    return toViewModel(data);
  },
  async update(
    departmentId: string,
    payload: Partial<DepartmentPayload>
  ): Promise<DepartmentViewModel> {
    if (!supabase) {
      const cached = getLocalDepartments();
      const updated = cached.map((row) =>
        row.id === departmentId
          ? { ...row, ...payload, maPhong: payload.maPhong ?? row.maPhong, tenPhong: payload.tenPhong ?? row.tenPhong }
          : row
      );
      saveLocalDepartments(updated);
      const found = updated.find((r) => r.id === departmentId);
      if (!found) throw new Error('Không tìm thấy phòng ban để cập nhật (local).');
      return found;
    }
    const body = toBackendPayload(payload);
    const { data, error } = await supabase
      .from('departments')
      .update(body)
      .eq('id', departmentId)
      .select('id, code, name, founded_year, status')
      .single();
    if (error || !data) {
      throw error ?? new Error('Không thể cập nhật phòng ban.');
    }
    return toViewModel(data);
  },
  async remove(departmentId: string): Promise<void> {
    if (!supabase) {
      const next = getLocalDepartments().filter((row) => row.id !== departmentId);
      saveLocalDepartments(next);
      return;
    }
    const { error } = await supabase.from('departments').delete().eq('id', departmentId);
    if (error) {
      throw error;
    }
  },
};

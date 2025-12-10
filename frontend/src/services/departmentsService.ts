import type { DepartmentStatus } from './types';
import { apiFetch, buildApiUrl } from './api';

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
      const data = await apiFetch<Array<SupabaseDepartmentRow & {
        ma_phong?: string;
        ten_phong?: string;
        nam_thanh_lap?: number;
        trang_thai?: DepartmentStatus;
      }>>(buildApiUrl('/departments'));
      const mapped = mergeVisibility(
        (data ?? []).map((row) =>
          row.code || row.ma_phong
            ? toViewModel({
                id: String(row.id),
                code: row.code ?? (row.ma_phong as string),
                name: row.name ?? (row.ten_phong as string),
                founded_year: row.founded_year ?? row.nam_thanh_lap,
                status: row.status ?? row.trang_thai ?? 'active',
              })
            : toViewModel(row)
        ),
        cached
      );
      saveLocalDepartments(mapped);
      return mapped;
    } catch (error) {
      console.warn('Không thể tải danh sách phòng ban từ backend, sử dụng cache local.', error);
      return cached;
    }
  },
  async create(payload: DepartmentPayload): Promise<DepartmentViewModel> {
    try {
      const { id } = await apiFetch<{ id: string }>(buildApiUrl('/departments'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maPhong: payload.maPhong,
          tenPhong: payload.tenPhong,
          namThanhLap: payload.namThanhLap,
          trangThai: payload.trangThai,
        }),
      });
      return {
        id: id ?? crypto.randomUUID?.() ?? Date.now().toString(),
        maPhong: payload.maPhong,
        tenPhong: payload.tenPhong,
        namThanhLap: payload.namThanhLap,
        trangThai: payload.trangThai,
        visible: true,
      };
    } catch (error) {
      console.warn('Không thể tạo phòng ban trên backend, lưu local.', error);
      const record = this.createLocalRecord(
        payload,
        () => crypto.randomUUID?.() ?? Date.now().toString()
      );
      const existing = getLocalDepartments().filter((row) => row.id !== record.id);
      const next = [...existing, record];
      saveLocalDepartments(next);
      return record;
    }
  },
  async update(
    departmentId: string,
    payload: Partial<DepartmentPayload>
  ): Promise<DepartmentViewModel> {
    try {
      await apiFetch(buildApiUrl(`/departments/${departmentId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maPhong: payload.maPhong,
          tenPhong: payload.tenPhong,
          namThanhLap: payload.namThanhLap,
          trangThai: payload.trangThai,
        }),
      });
      const cached = getLocalDepartments();
      const updated = cached.map((row) =>
        row.id === departmentId
          ? {
              ...row,
              maPhong: payload.maPhong ?? row.maPhong,
              tenPhong: payload.tenPhong ?? row.tenPhong,
              namThanhLap: payload.namThanhLap ?? row.namThanhLap,
              trangThai: payload.trangThai ?? row.trangThai,
            }
          : row
      );
      saveLocalDepartments(updated);
      const found = updated.find((r) => r.id === departmentId);
      if (!found) throw new Error('Không tìm thấy phòng ban để cập nhật (local).');
      return found;
    } catch (error) {
      console.warn('Không thể cập nhật phòng ban trên backend, lưu local.', error);
      const cached = getLocalDepartments();
      const updated = cached.map((row) =>
        row.id === departmentId
          ? {
              ...row,
              maPhong: payload.maPhong ?? row.maPhong,
              tenPhong: payload.tenPhong ?? row.tenPhong,
              namThanhLap: payload.namThanhLap ?? row.namThanhLap,
              trangThai: payload.trangThai ?? row.trangThai,
            }
          : row
      );
      saveLocalDepartments(updated);
      const found = updated.find((r) => r.id === departmentId);
      if (!found) throw new Error('Không tìm thấy phòng ban để cập nhật (local).');
      return found;
    }
  },
  async remove(departmentId: string): Promise<void> {
    try {
      await apiFetch(buildApiUrl(`/departments/${departmentId}`), { method: 'DELETE' });
      const next = getLocalDepartments().filter((row) => row.id !== departmentId);
      saveLocalDepartments(next);
    } catch (error) {
      console.warn('Không xóa được phòng ban trên backend, lưu local.', error);
      const next = getLocalDepartments().filter((row) => row.id !== departmentId);
      saveLocalDepartments(next);
    }
  },
};

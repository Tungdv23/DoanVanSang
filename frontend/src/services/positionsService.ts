import { apiFetch, buildApiUrl } from './api';

const STORAGE_KEY = 'positionsData';

type SupabasePositionRow = {
  id: string | number;
  code?: string;
  name?: string;
  description?: string | null;
  ma_chuc_vu?: string;
  ten_chuc_vu?: string;
  mo_ta?: string | null;
  trang_thai?: string;
};

export type PositionViewModel = {
  id: string;
  maChucVu: string;
  tenChucVu: string;
  moTa?: string;
  visible: boolean;
};

const getLocal = (): PositionViewModel[] => {
  if (typeof localStorage === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as PositionViewModel[];
  } catch (error) {
    console.warn('Không đọc được positionsData:', error);
    return [];
  }
};

const saveLocal = (rows: PositionViewModel[]) => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
};

const ensureSeed = (seed: PositionViewModel[] = []) => {
  const existing = getLocal();
  if (existing.length) return existing;
  saveLocal(seed);
  return seed;
};

const toViewModel = (pos: SupabasePositionRow): PositionViewModel => ({
  id: pos.id,
  maChucVu: pos.code,
  tenChucVu: pos.name,
  moTa: pos.description ?? '',
  visible: true,
});

const mergeVisibility = (
  remote: PositionViewModel[],
  cached: PositionViewModel[]
) => {
  const visibilityById = cached.reduce<Record<string, boolean>>((acc, row) => {
    acc[row.id] = row.visible;
    acc[row.maChucVu] = row.visible;
    return acc;
  }, {});
  return remote.map((row) => ({
    ...row,
    visible: visibilityById[row.id] ?? visibilityById[row.maChucVu] ?? true,
  }));
};

export const positionsService = {
  loadLocal(seed?: PositionViewModel[]) {
    return ensureSeed(seed);
  },
  saveLocal,
  async list(seed?: PositionViewModel[]): Promise<PositionViewModel[]> {
    const cached = ensureSeed(seed);
    try {
      const data = await apiFetch<SupabasePositionRow[]>(buildApiUrl('/positions'));
      const mapped = mergeVisibility(
        (data ?? []).map((row) =>
          toViewModel({
            id: String(row.id),
            code: row.code ?? (row.ma_chuc_vu as string),
            name: row.name ?? (row.ten_chuc_vu as string),
            description: row.description ?? row.mo_ta ?? '',
          })
        ),
        cached
      );
      saveLocal(mapped);
      return mapped;
    } catch (error) {
      console.warn('Không thể tải danh sách chức vụ từ backend, dùng dữ liệu cache.', error);
      return cached;
    }
  },
  async create(payload: { maChucVu: string; tenChucVu: string; moTa?: string }): Promise<PositionViewModel> {
    try {
      const { id } = await apiFetch<{ id: string }>(buildApiUrl('/positions'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maChucVu: payload.maChucVu,
          tenChucVu: payload.tenChucVu,
          moTa: payload.moTa,
          trangThai: 'active',
        }),
      });
      const record: PositionViewModel = {
        id: id ?? crypto.randomUUID?.() ?? Date.now().toString(),
        maChucVu: payload.maChucVu,
        tenChucVu: payload.tenChucVu,
        moTa: payload.moTa ?? '',
        visible: true,
      };
      const next = [...getLocal(), record];
      saveLocal(next);
      return record;
    } catch (error) {
      console.warn('Không thể tạo chức vụ trên backend, lưu local.', error);
      const record: PositionViewModel = {
        id: crypto.randomUUID?.() ?? Date.now().toString(),
        maChucVu: payload.maChucVu,
        tenChucVu: payload.tenChucVu,
        moTa: payload.moTa ?? '',
        visible: true,
      };
      const next = [...getLocal(), record];
      saveLocal(next);
      return record;
    }
  },
  async update(
    positionId: string,
    payload: Partial<{ maChucVu: string; tenChucVu: string; moTa?: string }>
  ): Promise<PositionViewModel> {
    try {
      await apiFetch(buildApiUrl(`/positions/${positionId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maChucVu: payload.maChucVu,
          tenChucVu: payload.tenChucVu,
          moTa: payload.moTa,
        }),
      });
      const updated = getLocal().map((row) =>
        row.id === positionId
          ? {
              ...row,
              maChucVu: payload.maChucVu ?? row.maChucVu,
              tenChucVu: payload.tenChucVu ?? row.tenChucVu,
              moTa: payload.moTa ?? row.moTa,
            }
          : row
      );
      saveLocal(updated);
      const found = updated.find((r) => r.id === positionId);
      if (!found) throw new Error('Không tìm thấy chức vụ để cập nhật (local).');
      return found;
    } catch (error) {
      console.warn('Không thể cập nhật chức vụ trên backend, lưu local.', error);
      const updated = getLocal().map((row) =>
        row.id === positionId
          ? {
              ...row,
              maChucVu: payload.maChucVu ?? row.maChucVu,
              tenChucVu: payload.tenChucVu ?? row.tenChucVu,
              moTa: payload.moTa ?? row.moTa,
            }
          : row
      );
      saveLocal(updated);
      const found = updated.find((r) => r.id === positionId);
      if (!found) throw new Error('Không tìm thấy chức vụ để cập nhật (local).');
      return found;
    }
  },
  async remove(positionId: string): Promise<void> {
    try {
      await apiFetch(buildApiUrl(`/positions/${positionId}`), { method: 'DELETE' });
      const next = getLocal().filter((row) => row.id !== positionId);
      saveLocal(next);
    } catch (error) {
      console.warn('Không thể xóa chức vụ trên backend, lưu local.', error);
      const next = getLocal().filter((row) => row.id !== positionId);
      saveLocal(next);
    }
  },
};

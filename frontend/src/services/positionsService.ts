import { supabase } from '@/lib/supabaseClient';

const STORAGE_KEY = 'positionsData';

type SupabasePositionRow = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
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
      if (!supabase) {
        return cached;
      }
      const { data, error } = await supabase
        .from('positions')
        .select('id, code, name, description')
        .order('name', { ascending: true });
      if (error) throw error;
      const mapped = mergeVisibility((data ?? []).map(toViewModel), cached);
      saveLocal(mapped);
      return mapped;
    } catch (error) {
      console.warn('Không thể tải danh sách chức vụ từ backend, dùng dữ liệu cache.', error);
      return cached;
    }
  },
  async create(payload: { maChucVu: string; tenChucVu: string; moTa?: string }): Promise<PositionViewModel> {
    if (!supabase) {
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
    const { data, error } = await supabase
      .from('positions')
      .insert({
        code: payload.maChucVu,
        name: payload.tenChucVu,
        description: payload.moTa ?? null,
      })
      .select('id, code, name, description')
      .single();
    if (error || !data) {
      throw error ?? new Error('Không thể tạo chức vụ.');
    }
    return toViewModel(data);
  },
  async update(
    positionId: string,
    payload: Partial<{ maChucVu: string; tenChucVu: string; moTa?: string }>
  ): Promise<PositionViewModel> {
    if (!supabase) {
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
    const body: Record<string, unknown> = {};
    if (payload.maChucVu !== undefined) body.code = payload.maChucVu;
    if (payload.tenChucVu !== undefined) body.name = payload.tenChucVu;
    if (payload.moTa !== undefined) body.description = payload.moTa;
    const { data, error } = await supabase
      .from('positions')
      .update(body)
      .eq('id', positionId)
      .select('id, code, name, description')
      .single();
    if (error || !data) {
      throw error ?? new Error('Không thể cập nhật chức vụ.');
    }
    return toViewModel(data);
  },
  async remove(positionId: string): Promise<void> {
    if (!supabase) {
      const next = getLocal().filter((row) => row.id !== positionId);
      saveLocal(next);
      return;
    }
    const { error } = await supabase.from('positions').delete().eq('id', positionId);
    if (error) throw error;
  },
};

import { apiFetch, buildApiUrl } from './api';
import { supabase } from '@/lib/supabaseClient';
import type {
  AttendanceType,
  EnrollFacePayload,
  EnrollFaceResponse,
  FaceCheckPayload,
  FaceCheckResponse,
  FaceEmbeddingRow,
} from './types';
import type { AttendanceEvent } from '@/lib/attendanceHistory';

const LOCAL_EMBEDDINGS_KEY = 'faceEmbeddings';

const getLocalEmbeddings = (): FaceEmbeddingRow[] => {
  if (typeof localStorage === 'undefined') return [];
  const raw = localStorage.getItem(LOCAL_EMBEDDINGS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as FaceEmbeddingRow[];
  } catch (error) {
    console.warn('Không đọc được dữ liệu faceEmbeddings:', error);
    return [];
  }
};

const saveLocalEmbeddings = (rows: FaceEmbeddingRow[]) => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(LOCAL_EMBEDDINGS_KEY, JSON.stringify(rows));
};

const euclideanDistance = (a: number[], b: number[]) => {
  if (!a.length || !b.length || a.length !== b.length) return Number.POSITIVE_INFINITY;
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
};

const storeLocalEmbedding = (payload: EnrollFacePayload): FaceEmbeddingRow => {
  const rows = getLocalEmbeddings().filter((row) => row.employeeId !== payload.employeeId);
  const record: FaceEmbeddingRow = {
    employeeId: payload.employeeId,
    embedding: payload.embedding,
    createdAt: new Date().toISOString(),
  };
  rows.push(record);
  saveLocalEmbeddings(rows);
  return record;
};

const fallbackEnroll = (payload: EnrollFacePayload): EnrollFaceResponse => {
  const { createdAt } = storeLocalEmbedding(payload);
  return {
    employeeId: payload.employeeId,
    createdAt,
    source: 'local',
  };
};

const fallbackCheck = ({
  embedding,
  type,
  threshold = 0.5,
}: FaceCheckPayload): FaceCheckResponse => {
  const rows = getLocalEmbeddings();
  if (!rows.length) {
    throw new Error('Chưa có dữ liệu khuôn mặt nào trong hệ thống.');
  }

  let match: FaceEmbeddingRow | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  rows.forEach((row) => {
    const distance = euclideanDistance(row.embedding, embedding);
    if (distance < bestDistance) {
      bestDistance = distance;
      match = row;
    }
  });

  if (!match || bestDistance > threshold) {
    throw new Error('Không nhận diện được khuôn mặt trong cơ sở dữ liệu.');
  }
  const confirmedMatch = match as FaceEmbeddingRow;

  return {
    employeeId: confirmedMatch.employeeId,
    type,
    timestamp: new Date().toISOString(),
    distance: bestDistance,
    threshold,
    source: 'local',
  };
};

const postJson = async <T>(path: string, body: unknown) =>
  apiFetch<T>(buildApiUrl(path), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

const getJson = async <T>(path: string) => apiFetch<T>(buildApiUrl(path));

type SupabaseFaceEmbeddingRow = {
  employee_id: string;
  embedding: unknown;
  created_at: string | null;
};

type SupabaseAttendanceRecordRow = {
  id: string;
  employee_id: string;
  type: AttendanceType;
  timestamp: string;
  distance?: number | null;
  threshold?: number | null;
};

const toNumberArray = (input: unknown): number[] => {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => Number(item))
    .filter((num): num is number => Number.isFinite(num));
};

const normalizeEmbedding = (value: unknown): number[] => {
  if (Array.isArray(value)) {
    return toNumberArray(value);
  }
  if (typeof value === 'string' && value.trim().length) {
    try {
      const parsed = JSON.parse(value) as unknown;
      return toNumberArray(parsed);
    } catch (error) {
      console.warn('Không parse được embedding dạng chuỗi.', error);
      return [];
    }
  }
  return [];
};

const fetchRemoteEmbeddings = async (employeeId?: string) => {
  try {
    let query = supabase
      .from('face_embeddings')
      .select('employee_id, embedding, created_at');
    if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }
    const { data, error } = await query;
    if (error || !data) {
      if (error) throw error;
      return [];
    }
    return (data as SupabaseFaceEmbeddingRow[])
      .map((row) => ({
        employeeId: row.employee_id,
        embedding: normalizeEmbedding(row.embedding),
        createdAt: row.created_at ?? new Date().toISOString(),
      }))
      .filter((row) => row.embedding.length);
  } catch (error) {
    console.warn('Không lấy được dữ liệu face_embeddings từ Supabase.', error);
    return [];
  }
};

const saveRemoteEmbedding = async (payload: EnrollFacePayload) => {
  const { data, error } = await supabase
    .from('face_embeddings')
    .upsert(
      {
        employee_id: payload.employeeId,
        embedding: payload.embedding,
        snapshot: payload.snapshot ?? null,
      },
      { onConflict: 'employee_id' }
    )
    .select('created_at')
    .single();
  if (error) throw error;
  return data?.created_at ?? new Date().toISOString();
};

const buildCheckResponse = (
  rows: FaceEmbeddingRow[],
  payload: FaceCheckPayload,
  source: FaceCheckResponse['source']
): FaceCheckResponse => {
  if (!rows.length) {
    throw new Error('Chưa có dữ liệu khuôn mặt nào trong hệ thống.');
  }

  let match: FaceEmbeddingRow | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  rows.forEach((row) => {
    const distance = euclideanDistance(row.embedding, payload.embedding);
    if (distance < bestDistance) {
      bestDistance = distance;
      match = row;
    }
  });

  const threshold = payload.threshold ?? 0.5;
  if (!match || bestDistance > threshold) {
    throw new Error('Không nhận diện được khuôn mặt trong cơ sở dữ liệu.');
  }

  const confirmedMatch = match as FaceEmbeddingRow;

  return {
    employeeId: confirmedMatch.employeeId,
    type: payload.type,
    timestamp: new Date().toISOString(),
    distance: bestDistance,
    threshold,
    source,
  };
};

export const attendanceService = {
  list: async () => [],
  enrollFace: async (payload: EnrollFacePayload) => {
    try {
      const createdAt = await saveRemoteEmbedding(payload);
      storeLocalEmbedding(payload);
      return {
        employeeId: payload.employeeId,
        createdAt,
        source: 'remote' as const,
      };
    } catch (error) {
      console.warn('Không thể lưu face_embeddings lên Supabase, thử API backend.', error);
      try {
        const response = await postJson<EnrollFaceResponse>('/api/enroll-face', payload);
        storeLocalEmbedding(payload);
        return { ...response, source: 'remote' as const };
      } catch (apiError) {
        console.warn('Gọi API enroll-face thất bại, dùng local storage.', apiError);
        return fallbackEnroll(payload);
      }
    }
  },
  checkInWithFace: async (payload: FaceCheckPayload) => {
    try {
      const remoteRows = await fetchRemoteEmbeddings();
      if (remoteRows.length) {
        return buildCheckResponse(remoteRows, payload, 'remote');
      }
      throw new Error('Không có dữ liệu khuôn mặt trên Supabase.');
    } catch (error) {
      console.warn('Không kiểm tra được khuôn mặt bằng Supabase, thử API backend.', error);
      try {
        const response = await postJson<FaceCheckResponse>('/api/checkin', payload);
        return { ...response, source: 'remote' as const };
      } catch (apiError) {
        console.warn('Gọi API checkin thất bại, dùng local storage.', apiError);
        return fallbackCheck(payload);
      }
    }
  },
  hasFaceEnrollment: async (employeeId: string) => {
    try {
      const remote = await fetchRemoteEmbeddings(employeeId);
      if (remote.length) return true;
    } catch (error) {
      console.warn('Không kiểm tra được dữ liệu khuôn mặt từ Supabase.', error);
    }
    try {
      const response = await getJson<{ registered: boolean }>(
        `/api/employees/${employeeId}/face`
      );
      if (response?.registered) return true;
    } catch (error) {
      console.warn('Không kiểm tra được trạng thái khuôn mặt từ backend.', error);
    }
    return getLocalEmbeddings().some((row) => row.employeeId === employeeId);
  },
  saveLocalEmbedding: storeLocalEmbedding,
  clearLocalEmbedding: (employeeId: string) => {
    const next = getLocalEmbeddings().filter((row) => row.employeeId !== employeeId);
    saveLocalEmbeddings(next);
    void supabase.from('face_embeddings').delete().eq('employee_id', employeeId);
  },
  getLocalEmbeddings,
  computeDistance: euclideanDistance,
  buildAttendanceRecord: (
    employeeId: string,
    type: AttendanceType,
    timestamp: string,
    distance: number,
    threshold: number
  ): FaceCheckResponse => ({
    employeeId,
    type,
    timestamp,
    distance,
    threshold,
    source: 'local',
  }),
  saveAttendanceEvent: async ({
    employeeId,
    type,
    timestamp,
    distance,
    threshold,
    source,
  }: FaceCheckResponse) => {
    try {
      const { error } = await supabase.from('attendance_records').insert({
        employee_id: employeeId,
        type,
        timestamp,
        distance,
        threshold,
        source,
      });
      if (error) throw error;
    } catch (error) {
      console.warn('Không lưu được attendance_records lên Supabase.', error);
    }
  },
  fetchAttendanceHistory: async (employeeId: string, limit = 200): Promise<AttendanceEvent[]> => {
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('id, employee_id, type, timestamp')
        .eq('employee_id', employeeId)
        .order('timestamp', { ascending: false })
        .limit(limit);
      if (error || !data) {
        if (error) throw error;
        return [];
      }
      return (data as SupabaseAttendanceRecordRow[]).map((row) => ({
        id: row.id,
        type: row.type,
        timestamp: row.timestamp,
      }));
    } catch (error) {
      console.warn('Không tải được attendance_records từ Supabase.', error);
      return [];
    }
  },
};

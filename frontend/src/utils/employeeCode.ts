type DepartmentLike = {
  id: string;
  tenPhong: string;
  maPhong?: string;
  visible?: boolean;
};

type PositionLike = {
  id: string;
  tenChucVu: string;
  maChucVu?: string;
  visible?: boolean;
};

const normalizeForCode = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9\s]/g, "")
    .toUpperCase()
    .trim();

const getInitialsCode = (text: string, maxLength = 3) => {
  if (!text) {
    return "";
  }
  const normalized = normalizeForCode(text);
  if (!normalized) return "";
  const initials = normalized
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0))
    .join("");
  const fallback = normalized.replace(/\s+/g, "");
  const source = initials || fallback;
  return source.slice(0, maxLength);
};

export const generatePositionShortCode = (positionName: string) =>
  getInitialsCode(positionName, 1);

export const generateDepartmentCode = (departmentName: string) =>
  getInitialsCode(departmentName, 3);

export const getDepartmentCode = (
  deptName: string,
  departments?: DepartmentLike[]
) => {
  const match = departments?.find((dept) => dept.tenPhong === deptName);
  return match?.maPhong || generateDepartmentCode(deptName);
};

export const getPositionCode = (
  positionName: string,
  positions?: PositionLike[]
) => {
  const match = positions?.find((pos) => pos.tenChucVu === positionName);
  return match?.maChucVu || getInitialsCode(positionName, 1);
};

export const formatJoinOrder = (order: number) => {
  const safeOrder = Math.max(1, order);
  const padded = safeOrder.toString().padStart(4, "0");
  return padded.slice(-4);
};

export const buildEmployeeCode = ({
  deptName,
  positionName,
  joinOrder,
  departments,
  positions,
}: {
  deptName: string;
  positionName: string;
  joinOrder: number;
  departments?: DepartmentLike[];
  positions?: PositionLike[];
}) => {
  const deptCode = getDepartmentCode(deptName, departments);
  const positionCode = getPositionCode(positionName, positions);
  return `${deptCode}${positionCode}${formatJoinOrder(joinOrder)}`;
};

export const extractJoinOrderFromCode = (code: string) => {
  if (!code) return null;
  const match = code.match(/(\d{1,4})$/);
  if (!match) return null;
  const value = parseInt(match[1], 10);
  return Number.isNaN(value) ? null : value;
};

export const normalizeEmployeesJoinOrder = <T extends { code: string; joinOrder?: number }>(
  employees: T[]
) => {
  return employees.map((emp, index) => {
    const currentOrder =
      emp.joinOrder ??
      extractJoinOrderFromCode(emp.code) ??
      index + 1;
    return { ...emp, joinOrder: currentOrder };
  });
};

export const getNextJoinOrder = (employees: { code: string; joinOrder?: number }[]) => {
  const highest = employees.reduce((max, emp) => {
    const order = emp.joinOrder ?? extractJoinOrderFromCode(emp.code);
    if (order && order > max) {
      return order;
    }
    return max;
  }, 0);

  if (highest === 0) {
    return employees.length + 1;
  }

  return highest + 1;
};

export const loadStoredDepartments = () => {
  try {
    if (typeof window === "undefined") return [] as DepartmentLike[];
    const raw = localStorage.getItem("departmentsData");
    if (!raw) return [] as DepartmentLike[];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed as DepartmentLike[];
    }
    return [] as DepartmentLike[];
  } catch (error) {
    console.warn("Không đọc được departmentsData:", error);
    return [] as DepartmentLike[];
  }
};

export const loadStoredPositions = () => {
  try {
    if (typeof window === "undefined") return [] as PositionLike[];
    const raw = localStorage.getItem("positionsData");
    if (!raw) return [] as PositionLike[];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed as PositionLike[];
    }
    return [] as PositionLike[];
  } catch (error) {
    console.warn("Không đọc được positionsData:", error);
    return [] as PositionLike[];
  }
};

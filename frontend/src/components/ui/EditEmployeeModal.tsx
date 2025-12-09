
import { useState, useEffect, type FormEvent } from "react";
import { Modal } from "./Modal";
import { Input } from "./Input";
import { Select } from "./Select";
import { Button } from "./Button";
import type { Employee } from "./EmployeePage";
import { buildEmployeeCode, extractJoinOrderFromCode } from "../../utils/employeeCode";

export type EmployeeEditData = {
  code: string;
  name: string;
  dept: string;
  departmentId?: string | null;
  position: string;
  positionId?: string | null;
  photo?: string | null;
  baseSalary: number;
  level: "STAFF" | "INTERN";
  status: "active" | "inactive";
  taiKhoan: string;
  matKhau: string;
  joinedAt: string;
};

type StoredDepartment = {
  id: string;
  tenPhong: string;
  maPhong?: string;
  visible?: boolean;
};

type StoredPosition = {
  id: string;
  tenChucVu: string;
  maChucVu?: string;
  visible?: boolean;
};

const defaultDepartments: StoredDepartment[] = [
  { id: "dept-1", tenPhong: "Phòng Kinh Doanh", maPhong: "PKD", visible: true },
  { id: "dept-2", tenPhong: "Phòng Nhân Sự", maPhong: "PNS", visible: true },
  { id: "dept-3", tenPhong: "Phòng Kế Toán", maPhong: "PKT", visible: true },
];

const defaultPositions: StoredPosition[] = [
  { id: "pos-1", tenChucVu: "Nhân viên", maChucVu: "N", visible: true },
  { id: "pos-2", tenChucVu: "Trưởng phòng", maChucVu: "T", visible: true },
  { id: "pos-3", tenChucVu: "Giám đốc", maChucVu: "G", visible: true },
];

const EMPLOYEE_LEVELS = [
  { label: "Nhân viên chính thức", value: "STAFF" },
  { label: "Thực tập sinh", value: "INTERN" },
];

const loadCollection = <T,>(key: string, fallback: T[]): T[] => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed as T[];
    }
    return fallback;
  } catch (error) {
    console.warn(`Không đọc được dữ liệu ${key}:`, error);
    return fallback;
  }
};

export function EditEmployeeModal({
  open,
  onClose,
  onSave,
  employee,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: EmployeeEditData) => void;
  employee: Employee | null;
}) {
  const [formData, setFormData] = useState<EmployeeEditData>({
    code: '',
    name: '',
    dept: '',
    departmentId: null,
    position: '',
    positionId: null,
    photo: null,
    baseSalary: 0,
    level: "STAFF",
    status: 'active',
    taiKhoan: '',
    matKhau: '',
    joinedAt: new Date().toISOString().slice(0, 10),
  });
  const [departments, setDepartments] = useState<StoredDepartment[]>([]);
  const [positions, setPositions] = useState<StoredPosition[]>([]);
  const [joinOrder, setJoinOrder] = useState<number>(1);

  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name,
        dept: employee.dept,
        position: employee.position,
        departmentId: employee.departmentId ?? null,
        positionId: employee.positionId ?? null,
        photo: employee.photo ?? null,
        baseSalary: employee.baseSalary,
        level: employee.level ?? "STAFF",
        code: employee.code,
        status: employee.status,
        taiKhoan: employee.taiKhoan,
        matKhau: employee.matKhau,
        joinedAt: employee.joinedAt?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
      });
      const order = employee.joinOrder ?? extractJoinOrderFromCode(employee.code) ?? 1;
      setJoinOrder(order);
    }
  }, [employee]);

  useEffect(() => {
    if (!open) return;
    const departmentList = loadCollection<StoredDepartment>("departmentsData", defaultDepartments);
    const positionList = loadCollection<StoredPosition>("positionsData", defaultPositions);
    const visibleDepartments = departmentList.filter((dept) => dept.visible ?? true);
    const visiblePositions = positionList.filter((pos) => pos.visible ?? true);

    if (employee) {
      const hasDept = visibleDepartments.some((dept) => dept.tenPhong === employee.dept);
      if (!hasDept) {
        const currentDept = departmentList.find((dept) => dept.tenPhong === employee.dept);
        if (currentDept) visibleDepartments.push(currentDept);
      }
      const hasPos = visiblePositions.some((pos) => pos.tenChucVu === employee.position);
      if (!hasPos) {
        const currentPos = positionList.find((pos) => pos.tenChucVu === employee.position);
        if (currentPos) visiblePositions.push(currentPos);
      }
    }

    setDepartments(visibleDepartments);
    setPositions(visiblePositions);
  }, [open, employee]);

  useEffect(() => {
    if (!employee) return;
    if (!formData.dept || !formData.position) return;
    const nextCode = buildEmployeeCode({
      deptName: formData.dept,
      positionName: formData.position,
      joinOrder,
      departments,
      positions,
    });
    setFormData((prev) => (prev.code === nextCode ? prev : { ...prev, code: nextCode }));
  }, [formData.dept, formData.position, joinOrder, departments, positions, employee]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      if (name === 'dept') {
        const selected = departments.find((dept) => dept.tenPhong === value);
        return { ...prev, dept: value, departmentId: selected?.id ?? null };
      }
      if (name === 'position') {
        const selected = positions.find((pos) => pos.tenChucVu === value);
        return { ...prev, position: value, positionId: selected?.id ?? null };
      }
      if (name === 'baseSalary') {
        return { ...prev, baseSalary: parseFloat(value) || 0 };
      }
      return { ...prev, [name]: value };
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name) return alert("Tên không được để trống");
    if (!formData.taiKhoan || !formData.matKhau) return alert("Cần nhập tài khoản và mật khẩu.");
    onSave(formData);
  };

  if (!employee) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Chỉnh sửa nhân viên"
      titleClassName="text-black"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-black mb-2">Mã nhân viên</label>
          <Input name="code" value={formData.code} readOnly className="bg-slate-50" placeholder="Mã tự động" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-black mb-2">Họ tên</label>
          <Input name="name" value={formData.name} onChange={handleChange} required placeholder="Nhập họ tên" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-black mb-2">Phòng ban</label>
          <Select name="dept" value={formData.dept} onChange={handleChange} required>
            {departments.length === 0 ? (
              <option value="">Chưa có phòng ban khả dụng</option>
            ) : (
              departments.map((dept) => (
                <option key={dept.id} value={dept.tenPhong}>
                  {dept.tenPhong}
                </option>
              ))
            )}
          </Select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-black mb-2">Chức vụ</label>
          <Select name="position" value={formData.position} onChange={handleChange} required>
            {positions.length === 0 ? (
              <option value="">Chưa có chức vụ khả dụng</option>
            ) : (
              positions.map((pos) => (
                <option key={pos.id} value={pos.tenChucVu}>
                  {pos.tenChucVu}
                </option>
              ))
            )}
          </Select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-black mb-2">Cấp độ nhân viên</label>
          <Select name="level" value={formData.level} onChange={handleChange}>
            {EMPLOYEE_LEVELS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-black mb-2">Lương cơ bản</label>
            <Input
              name="baseSalary"
              type="number"
              value={formData.baseSalary}
              onChange={handleChange}
              required
              placeholder="VD: 15000000"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-black mb-2">Ngày vào công ty</label>
            <Input
              name="joinedAt"
              type="date"
              value={formData.joinedAt}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-black mb-2">Tài khoản đăng nhập</label>
          <Input name="taiKhoan" value={formData.taiKhoan} onChange={handleChange} required placeholder="VD: dao.nhat" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-black mb-2">Mật khẩu</label>
          <Input name="matKhau" type="password" value={formData.matKhau} onChange={handleChange} required placeholder="Ít nhất 6 ký tự" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Trạng thái</label>
          <Select name="status" value={formData.status} onChange={handleChange}>
            <option value="active">Hoạt động</option>
            <option value="inactive">Ngưng</option>
          </Select>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="ghost" type="button" onClick={onClose}>
            Huỷ
          </Button>
          <Button type="submit">Lưu thay đổi</Button>
        </div>
      </form>
    </Modal>
  );
}

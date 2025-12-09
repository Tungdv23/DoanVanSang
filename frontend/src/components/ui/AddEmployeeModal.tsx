
import { useState, type FormEvent, useEffect } from "react";
import { Modal } from "./Modal";
import { Input } from "./Input";
import { Button } from "./Button";
import { Select } from "./Select";
import { buildEmployeeCode } from "../../utils/employeeCode";

export type NewEmployeeData = {
  name: string;
  code: string;
  dept: string;
  departmentId?: string | null;
  position: string;
  positionId?: string | null;
  baseSalary: number;
  level: "STAFF" | "INTERN";
  status: "active" | "inactive";
  photo?: string;
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

export function AddEmployeeModal({
  open,
  onClose,
  onSave,
  nextJoinOrder,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: NewEmployeeData) => void;
  nextJoinOrder: number;
}) {
  const createInitialFormData = (): NewEmployeeData => ({
    name: '',
    code: '',
    dept: '',
    departmentId: null,
    position: '',
    positionId: null,
    baseSalary: 0,
    level: "STAFF",
    status: 'active',
    photo: '',
    taiKhoan: '',
    matKhau: '',
    joinedAt: new Date().toISOString().slice(0, 10),
  });
  const [formData, setFormData] = useState<NewEmployeeData>(createInitialFormData);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [departments, setDepartments] = useState<StoredDepartment[]>([]);
  const [positions, setPositions] = useState<StoredPosition[]>([]);

  useEffect(() => {
    if (!open) return;
    setFormData(createInitialFormData());
    setPhotoPreview(null);
    const departmentList = loadCollection<StoredDepartment>("departmentsData", defaultDepartments);
    const positionList = loadCollection<StoredPosition>("positionsData", defaultPositions);
    setDepartments(departmentList.filter((dept) => dept.visible ?? true));
    setPositions(positionList.filter((pos) => pos.visible ?? true));
  }, [open]);

  useEffect(() => {
    if (departments.length > 0 && !formData.dept) {
      setFormData((prev) => ({
        ...prev,
        dept: departments[0].tenPhong,
        departmentId: departments[0].id,
      }));
    }
  }, [departments, formData.dept]);

  useEffect(() => {
    if (positions.length > 0 && !formData.position) {
      setFormData((prev) => ({
        ...prev,
        position: positions[0].tenChucVu,
        positionId: positions[0].id,
      }));
    }
  }, [positions, formData.position]);

  useEffect(() => {
    if (!formData.dept || !formData.position || !nextJoinOrder) return;
    const newCode = buildEmployeeCode({
      deptName: formData.dept,
      positionName: formData.position,
      joinOrder: nextJoinOrder,
      departments,
      positions,
    });
    setFormData((prev) => (prev.code === newCode ? prev : { ...prev, code: newCode }));
  }, [formData.dept, formData.position, nextJoinOrder, departments, positions]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      if (name === 'dept') {
        const selectedDept = departments.find((dept) => dept.tenPhong === value);
        return { ...prev, dept: value, departmentId: selectedDept?.id ?? null };
      }
      if (name === 'position') {
        const selectedPos = positions.find((pos) => pos.tenChucVu === value);
        return { ...prev, position: value, positionId: selectedPos?.id ?? null };
      }
      if (name === 'baseSalary') {
        return { ...prev, baseSalary: parseFloat(value) || 0 };
      }
      return { ...prev, [name]: value };
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setFormData(prev => ({ ...prev, photo: result }));
      setPhotoPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      alert("Vui lòng nhập họ tên.");
      return;
    }
    if (!formData.taiKhoan || !formData.matKhau) {
      alert("Vui lòng nhập tài khoản và mật khẩu chấm công.");
      return;
    }
    onSave(formData);
  };

  return (
    <Modal open={open} onClose={onClose} title="Thêm nhân viên">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-500 mb-3">
            Thông tin cơ bản
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Mã nhân viên
              </label>
              <Input
                name="code"
                value={formData.code}
                readOnly
                className="bg-slate-50"
              />
             
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Họ và tên đầy đủ
              </label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="VD: Nguyễn Minh Anh"
                required
              />
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-500 mb-3">
            Thông tin công việc
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Phòng ban
              </label>
              <Select
                name="dept"
                value={formData.dept}
                onChange={handleChange}
                required
              >
                {departments.length === 0 ? (
                  <option value="">
                    Chưa có phòng ban nào. Vui lòng tạo trước ở trang Phòng ban.
                  </option>
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
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Chức vụ
              </label>
              <Select
                name="position"
                value={formData.position}
                onChange={handleChange}
                required
              >
                {positions.length === 0 ? (
                  <option value="">
                    Chưa có chức vụ nào. Vui lòng tạo trước ở trang Chức vụ.
                  </option>
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
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Cấp độ nhân viên
              </label>
              <Select
                name="level"
                value={formData.level}
                onChange={handleChange}
                required
              >
                {EMPLOYEE_LEVELS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Lương cơ bản (VNĐ)
              </label>
              <Input
                name="baseSalary"
                type="number"
                value={formData.baseSalary}
                onChange={handleChange}
                placeholder="VD: 15000000"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Ngày vào công ty
              </label>
              <Input
                name="joinedAt"
                type="date"
                value={formData.joinedAt}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Trạng thái
              </label>
              <Select name="status" value={formData.status} onChange={handleChange}>
                <option value="active">Hoạt động</option>
                <option value="inactive">Ngưng</option>
              </Select>
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-500 mb-3">
            Tài khoản nhân viên
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">
                Tài khoản đăng nhập
              </label>
              <Input
                name="taiKhoan"
                value={formData.taiKhoan}
                onChange={handleChange}
                placeholder="VD: minh.anh"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-2">
                Mật khẩu
              </label>
              <Input
                name="matKhau"
                type="password"
                value={formData.matKhau}
                onChange={handleChange}
                placeholder="Ít nhất 6 ký tự"
                required
              />
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-500 mb-3">
            Ảnh nhận diện
          </p>
          <label className="block text-sm font-semibold text-slate-900 mb-2">
            Chọn ảnh nhân viên
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
          />
          <div className="mt-3">
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Xem trước"
                className="w-24 h-24 rounded-xl object-cover border border-gray-200 shadow-sm"
              />
            ) : (
              <p className="text-xs text-gray-500">
                
              </p>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="ghost" type="button" onClick={onClose}>
            Huỷ
          </Button>
          <Button type="submit">Lưu</Button>
        </div>
      </form>
    </Modal>
  );
}

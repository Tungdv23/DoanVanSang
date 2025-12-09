
import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from 'uuid';
import { Button } from "./Button";
import { EmployeeTable } from "./EmployeeTable";
import { AddEmployeeModal } from "./AddEmployeeModal";
import { EditEmployeeModal, type EmployeeEditData } from "./EditEmployeeModal";
import { FilterBar } from "./FilterBar"; // Đảm bảo import đúng component
import type { NewEmployeeData } from './AddEmployeeModal';
import { EmployeeDetailModal } from "./EmployeeDetailModal";
import { FaceRegistrationModal } from "./FaceRegistrationModal";
import { AttendanceHistoryModal } from "./AttendanceHistoryModal";
import { buildEmployeeCode, getNextJoinOrder, loadStoredDepartments, loadStoredPositions, normalizeEmployeesJoinOrder } from "../../utils/employeeCode";
import { employeesService } from "../../services/employeesService";
import { departmentsService } from "../../services/departmentsService";
import { positionsService } from "../../services/positionsService";
import { payrollService } from "../../services/payrollService";

export type Employee = {
  id: string;
  code: string;
  name: string;
  dept: string;
  departmentId?: string | null;
  position: string;
  positionId?: string | null;
  baseSalary: number;
  level: "STAFF" | "INTERN";
  status: "active" | "inactive";
  visible: boolean;
  photo?: string;
  joinOrder?: number;
  joinedAt: string;
  taiKhoan: string;
  matKhau: string;
  account: string;
  password: string;
  createdAt: string;
  updatedAt: string;
};

type Toast = {
  id: string;
  message: string;
};

export default function EmployeePage() {
  const navigate = useNavigate();
  const PAGE_SIZE = 4;
  const iso = (value: string) => new Date(value).toISOString();
  const seed: Employee[] = [
    {
      id: "1",
      code: "PKDN0001",
      name: "Nguyễn Minh Anh",
      dept: "Phòng Kinh Doanh",
      departmentId: "dept-1",
      position: "Nhân viên",
      positionId: "pos-1",
      baseSalary: 10000000,
      level: "STAFF",
      status: "active",
      visible: true,
      photo: "https://i.pravatar.cc/150?img=3",
      joinOrder: 1,
      joinedAt: iso("2023-01-10"),
      taiKhoan: "minhanh",
      matKhau: "123456",
      account: "minhanh",
      password: "123456",
      createdAt: iso("2023-01-10"),
      updatedAt: iso("2023-01-10"),
    },
    {
      id: "2",
      code: "PTPT0002",
      name: "Nguyễn Minh Tạo",
      dept: "Trưởng phòng",
      departmentId: "dept-2",
      position: "Trưởng phòng",
      positionId: "pos-2",
      baseSalary: 20000000,
      level: "STAFF",
      status: "active",
      visible: true,
      photo: "https://i.pravatar.cc/150?img=15",
      joinOrder: 2,
      joinedAt: iso("2023-03-05"),
      taiKhoan: "taonguyen",
      matKhau: "123456",
      account: "taonguyen",
      password: "123456",
      createdAt: iso("2023-03-05"),
      updatedAt: iso("2023-03-05"),
    },
    {
      id: "3",
      code: "PCKN0003",
      name: "Trần Quỳnh",
      dept: "Chăm sóc KH",
      departmentId: "dept-3",
      position: "Nhân viên",
      positionId: "pos-1",
      baseSalary: 12000000,
      level: "INTERN",
      status: "inactive",
      visible: true,
      photo: "https://i.pravatar.cc/150?img=32",
      joinOrder: 3,
      joinedAt: iso("2023-06-18"),
      taiKhoan: "quynhtran",
      matKhau: "123456",
      account: "quynhtran",
      password: "123456",
      createdAt: iso("2023-06-18"),
      updatedAt: iso("2023-06-18"),
    },
  ];

  type LegacyEmployee = Partial<Employee> & Record<string, unknown>;

  const ensureEmployeeSchema = (employees: LegacyEmployee[]) => {
    const departments = loadStoredDepartments();
    const positions = loadStoredPositions();
    const normalizedInput = normalizeEmployeesJoinOrder(
      employees.map((emp) => ({
        ...emp,
        code: emp.code ?? "",
      })) as Array<LegacyEmployee & { code: string }>
    );
    return normalizedInput.map((emp, index) => {
      const now = new Date().toISOString();
      const deptRecord = departments.find((dept) => dept.tenPhong === emp.dept);
      const posRecord = positions.find((pos) => pos.tenChucVu === emp.position);
      const rawJoinDate =
        typeof emp.joinedAt === "string"
          ? emp.joinedAt
          : typeof (emp as Record<string, unknown>).createdAt === "string"
          ? (emp as Record<string, string>).createdAt
          : now;
      const safeJoinDate = new Date(rawJoinDate);
      const joinedAt = Number.isNaN(safeJoinDate.getTime()) ? now : safeJoinDate.toISOString();
      const createdAt =
        typeof emp.createdAt === "string" && !Number.isNaN(new Date(emp.createdAt).getTime())
          ? new Date(emp.createdAt).toISOString()
          : joinedAt;
      const updatedAt =
        typeof emp.updatedAt === "string" && !Number.isNaN(new Date(emp.updatedAt).getTime())
          ? new Date(emp.updatedAt).toISOString()
          : createdAt;
      const legacySalary = Number((emp as Record<string, unknown>)["salary"]) || 0;
      const resolvedBaseSalary =
        typeof emp.baseSalary === "number"
          ? emp.baseSalary
          : legacySalary;
      const account = (emp.taiKhoan as string | undefined) ?? (emp.account as string) ?? "";
      const password = (emp.matKhau as string | undefined) ?? (emp.password as string) ?? "";
      return {
        id: emp.id ?? `legacy-${index}`,
        code: emp.code ?? "",
        name: emp.name ?? "",
        dept: emp.dept ?? deptRecord?.tenPhong ?? "",
        departmentId: emp.departmentId ?? deptRecord?.id ?? null,
        position: emp.position ?? posRecord?.tenChucVu ?? "",
        positionId: emp.positionId ?? posRecord?.id ?? null,
        baseSalary: resolvedBaseSalary,
        level: (emp.level as Employee["level"]) ?? "STAFF",
        status: (emp.status as Employee["status"]) ?? "active",
        visible: typeof emp.visible === "boolean" ? emp.visible : true,
        photo: emp.photo as string | undefined,
        joinOrder: emp.joinOrder,
        joinedAt,
        taiKhoan: account,
        matKhau: password,
        account,
        password,
        createdAt,
        updatedAt,
      } satisfies Employee;
    });
  };

  const [data, setData] = useState<Employee[]>(() => {
    const stored = localStorage.getItem("employeesData");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Employee[];
        return ensureEmployeeSchema(parsed);
      } catch (error) {
        console.warn("Không đọc được employeesData:", error);
      }
    }
    const normalizedSeed = ensureEmployeeSchema(seed);
    localStorage.setItem("employeesData", JSON.stringify(normalizedSeed));
    return normalizedSeed;
  });
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("all");
  const [status, setStatus] = useState("all");
  const [openAdd, setOpenAdd] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [detailEmployee, setDetailEmployee] = useState<Employee | null>(null);
  const [faceEmployee, setFaceEmployee] = useState<Employee | null>(null);
  const [attendanceEmployee, setAttendanceEmployee] = useState<Employee | null>(null);
  const [showHiddenEmployees, setShowHiddenEmployees] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    void departmentsService.list();
    void positionsService.list();
  }, []);

  useEffect(() => {
    let active = true;
    const synchronizeEmployees = async () => {
      try {
        const remoteEmployees = await employeesService.list();
        if (active && remoteEmployees.length) {
          setData(ensureEmployeeSchema(remoteEmployees));
        }
      } catch (error) {
        console.warn("Không thể đồng bộ danh sách nhân viên từ backend.", error);
      }
    };
    synchronizeEmployees();
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const matches = data.filter((d) => {
      if (dept !== "all" && d.dept !== dept) return false;
      if (status !== "all" && d.status !== status) return false;
      if (q && !(d.name.toLowerCase().includes(q.toLowerCase())))
        return false;
      return true;
    });
    return showHiddenEmployees ? matches : matches.filter((emp) => emp.visible);
  }, [data, q, dept, status, showHiddenEmployees]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    setPage((prev) => Math.min(prev, maxPage));
  }, [filtered.length]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const handleQueryChange = (value: string) => {
    setPage(1);
    setQ(value);
  };

  const handleDeptChange = (value: string) => {
    setPage(1);
    setDept(value);
  };

  const handleStatusChange = (value: string) => {
    setPage(1);
    setStatus(value);
  };

  const nextJoinOrder = useMemo(() => getNextJoinOrder(data), [data]);

  const addEmployee = async (emp: NewEmployeeData) => {
    try {
      const remoteEmployee = await employeesService.create(emp);
      if (remoteEmployee) {
        setData((s) => [remoteEmployee, ...s]);
        showToast("Đã thêm nhân viên");
        setOpenAdd(false);
        return;
      }
    } catch (error) {
      console.warn("Không thể thêm nhân viên trên backend, dùng chế độ offline.", error);
    }

    const departments = loadStoredDepartments();
    const positions = loadStoredPositions();
    const joinOrder = nextJoinOrder;
    const finalCode = buildEmployeeCode({
      deptName: emp.dept,
      positionName: emp.position,
      joinOrder,
      departments,
      positions,
    });
    const timestamp = new Date().toISOString();
    const resolvedDeptId =
      emp.departmentId ?? departments.find((dept) => dept.tenPhong === emp.dept)?.id ?? null;
    const resolvedPosId =
      emp.positionId ?? positions.find((pos) => pos.tenChucVu === emp.position)?.id ?? null;
    const fallbackEmployee: Employee = {
      ...emp,
      id: uuidv4(),
      code: finalCode,
      departmentId: resolvedDeptId,
      positionId: resolvedPosId,
      baseSalary: emp.baseSalary,
      level: emp.level,
      joinOrder,
      joinedAt: new Date(emp.joinedAt).toISOString(),
      visible: true,
      account: emp.taiKhoan,
      password: emp.matKhau,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    setData((s) => {
      const next = [fallbackEmployee, ...s];
      employeesService.saveLocalSnapshot(next);
      return next;
    });
    showToast("Đã thêm nhân viên (chỉ lưu cục bộ)");
    setOpenAdd(false);
  };

  const updateEmployee = async (updatedData: EmployeeEditData) => {
    if (!editingEmployee) return;
    try {
      const updated = await employeesService.update(editingEmployee.id, updatedData);
      if (updated) {
        setData((s) => s.map((emp) => (emp.id === updated.id ? updated : emp)));
        showToast("Đã cập nhật nhân viên");
        setEditingEmployee(null);
        return;
      }
    } catch (error) {
      console.warn("Không thể cập nhật nhân viên trên backend, dùng dữ liệu offline.", error);
    }

    const departments = loadStoredDepartments();
    const positions = loadStoredPositions();
    const joinOrder =
      editingEmployee.joinOrder ??
      data.find((emp) => emp.id === editingEmployee.id)?.joinOrder ??
      1;
    const shouldRegenerateCode =
      updatedData.dept !== editingEmployee.dept ||
      updatedData.position !== editingEmployee.position;

    setData((s) => {
      const next = s.map((emp) => {
        if (emp.id !== editingEmployee.id) return emp;
        const nextCode = shouldRegenerateCode
          ? buildEmployeeCode({
              deptName: updatedData.dept,
              positionName: updatedData.position,
              joinOrder,
              departments,
              positions,
            })
          : emp.code;
        const resolvedDeptId =
          updatedData.departmentId ??
          departments.find((dept) => dept.tenPhong === updatedData.dept)?.id ??
          emp.departmentId ??
          null;
        const resolvedPosId =
          updatedData.positionId ??
          positions.find((pos) => pos.tenChucVu === updatedData.position)?.id ??
          emp.positionId ??
          null;
        const resolvedPassword = updatedData.matKhau || emp.matKhau;
        return {
          ...emp,
          code: nextCode,
          name: updatedData.name,
          dept: updatedData.dept,
          departmentId: resolvedDeptId,
          position: updatedData.position,
          positionId: resolvedPosId,
          baseSalary: updatedData.baseSalary,
          level: updatedData.level,
          status: updatedData.status,
          taiKhoan: updatedData.taiKhoan,
          matKhau: resolvedPassword,
          account: updatedData.taiKhoan,
          password: resolvedPassword,
          photo: updatedData.photo ?? emp.photo,
          joinedAt: new Date(updatedData.joinedAt).toISOString(),
          joinOrder,
          updatedAt: new Date().toISOString(),
        };
      });
      employeesService.saveLocalSnapshot(next);
      return next;
    });
    showToast("Đã cập nhật nhân viên (chỉ lưu cục bộ)");
    setEditingEmployee(null);
  };

  const deleteEmployee = async (id: string) => {
    const confirmed = window.confirm("Bạn có chắc chắn muốn xoá nhân viên này?");
    if (!confirmed) return;
    setData((s) => {
      const next = s.filter((emp) => emp.id !== id);
      employeesService.saveLocalSnapshot(next);
      return next;
    });
    const removed = await employeesService.remove(id);
    showToast(removed ? "Đã xóa nhân viên" : "Đã xóa nhân viên (chỉ trên thiết bị này)");
  };

  const showToast = (message: string) => {
    const toastId = uuidv4();
    setToasts((prevToasts) => [...prevToasts, { id: toastId, message }]);
    setTimeout(() => {
      setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== toastId));
    }, 3000);
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
  };

  const handleRegisterFace = (employee: Employee) => {
    setFaceEmployee(employee);
  };

  const handleViewDetail = (employee: Employee) => {
    setDetailEmployee(employee);
  };

  const handleViewAttendance = (employee: Employee) => {
    setAttendanceEmployee(employee);
  };

  const toggleEmployeeVisibility = (employeeId: string) => {
    setData((current) => {
      const next = current.map((emp) =>
        emp.id === employeeId ? { ...emp, visible: !emp.visible } : emp
      );
      employeesService.saveLocalSnapshot(next);
      return next;
    });
    showToast("Đã cập nhật trạng thái hiển thị nhân viên");
  };

  const getLocalMonthlyHours = (employeeId: string) => {
    const workingHours = localStorage.getItem(`workingHours:${employeeId}`);
    if (!workingHours) return "0";
    try {
      const parsed = JSON.parse(workingHours) as {
        year: number;
        month: number;
        hours: number;
      };
      const now = new Date();
      if (
        parsed &&
        parsed.year === now.getFullYear() &&
        parsed.month === now.getMonth() + 1 &&
        typeof parsed.hours === "number"
      ) {
        return String(parsed.hours);
      }
    } catch (error) {
      console.warn("Không đọc được dữ liệu workingHours:", error);
    }
    return "0";
  };

  const handleViewPayroll = async (employee: Employee) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    let monthlyHours = getLocalMonthlyHours(employee.id);
    let salaryValue = employee.baseSalary;

    try {
      const payrollRows = await payrollService.fetchMonthlyPayrolls(employee.id, currentYear);
      const currentRecord = payrollRows.find((row) => row.month === currentMonth);
      if (currentRecord) {
        monthlyHours = String(currentRecord.total_hours ?? 0);
        salaryValue = currentRecord.base_salary ?? salaryValue;
      }
    } catch (error) {
      console.warn("Không lấy được dữ liệu lương từ Supabase.", error);
    }

    const query = new URLSearchParams({
      employeeId: employee.id,
      code: employee.code,
      name: employee.name,
      dept: employee.dept,
      position: employee.position,
      salary: String(salaryValue ?? 0),
      hours: monthlyHours,
    });
    navigate(`/admin/payroll?${query.toString()}`);
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div
          className="flex items-center gap-2 text-slate-500 text-sm font-medium cursor-pointer w-max hover:text-slate-700 transition"
          onClick={() => navigate("/")}
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm border border-slate-200">
            ←
          </span>
          Quay lại
        </div>

        <div className="rounded-[32px] bg-white/90 p-8 shadow-[0_25px_60px_rgba(15,23,42,0.08)] border border-slate-100">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-blue-500 uppercase tracking-wide">Quản trị nhân sự</p>
              <h1 className="mt-2 text-4xl font-bold text-slate-900">Nhân viên</h1>
              <p className="mt-1 text-base text-slate-500">
                Quản lý danh sách và thông tin nhân sự
              </p>
            </div>
            <div className="flex flex-col items-end gap-4">
              <Button
                className="rounded-full px-5 py-2 text-base shadow-lg shadow-blue-200"
                onClick={() => setOpenAdd(true)}
              >
                + Thêm nhân viên
              </Button>
            </div>
          </div>

          <div className="mt-8">
            <FilterBar
              q={q}
              onQueryChange={handleQueryChange}
              dept={dept}
              onDeptChange={handleDeptChange}
              status={status}
              onStatusChange={handleStatusChange}
            />
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHiddenEmployees((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
              >
                {showHiddenEmployees ? "Ẩn danh sách bị ẩn" : "Hiện cả nhân viên đã ẩn"}
              </button>
            </div>
          </div>

          <div className="mt-6">
        <EmployeeTable
          data={paginatedData}
          totalCount={filtered.length}
          page={page}
          pageSize={PAGE_SIZE}
          pageCount={Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))}
          onPageChange={setPage}
          onDelete={(id) => {
            void deleteEmployee(id);
          }}
          onEdit={handleEdit}
          onRegisterFace={handleRegisterFace}
          onViewPayroll={handleViewPayroll}
          onViewDetail={handleViewDetail}
          onViewAttendance={handleViewAttendance}
          onToggleVisibility={toggleEmployeeVisibility}
          showHidden={showHiddenEmployees}
        />
          </div>
        </div>

        <div className="fixed bottom-4 right-4 space-y-2 z-50">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className="bg-gray-800 text-white py-2 px-4 rounded-lg shadow-lg animate-fade-in-out"
            >
              {toast.message}
            </div>
          ))}
        </div>

        <AddEmployeeModal
          open={openAdd}
          onClose={() => setOpenAdd(false)}
          onSave={(payload) => {
            void addEmployee(payload);
          }}
          nextJoinOrder={nextJoinOrder}
        />

        <EditEmployeeModal
          open={!!editingEmployee}
          onClose={() => setEditingEmployee(null)}
          employee={editingEmployee}
          onSave={(payload) => {
            void updateEmployee(payload);
          }}
        />

        <EmployeeDetailModal
          open={!!detailEmployee}
          onClose={() => setDetailEmployee(null)}
          employee={detailEmployee}
        />

        <FaceRegistrationModal
          open={!!faceEmployee}
          onClose={() => setFaceEmployee(null)}
          employee={faceEmployee}
          onSaved={() => {
            showToast("Đã lưu khuôn mặt nhân viên");
            setFaceEmployee(null);
          }}
        />
        <AttendanceHistoryModal
          open={!!attendanceEmployee}
          onClose={() => setAttendanceEmployee(null)}
          employee={attendanceEmployee}
        />

      </div>
    </div>
  );
}

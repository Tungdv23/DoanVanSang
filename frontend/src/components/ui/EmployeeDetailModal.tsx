import { useEffect, useState } from "react";
import type { Employee } from "./EmployeePage";
import { Modal } from "./Modal";
import { attendanceService } from "../../services/attendanceService";
import {
  loadLocalAttendanceHistory,
  summarizeAttendanceRecords,
  calculateSalaryProjection,
  type AttendanceEvent,
} from "../../lib/attendanceHistory";

type EmployeeDetailModalProps = {
  open: boolean;
  onClose: () => void;
  employee: Employee | null;
};

export function EmployeeDetailModal({
  open,
  onClose,
  employee,
}: EmployeeDetailModalProps) {
  if (!employee) return null;
  const [attendanceState, setAttendanceState] = useState<{
    history: AttendanceEvent[];
    monthlyHours: number;
    loading: boolean;
  }>({
    history: [],
    monthlyHours: 0,
    loading: false,
  });

  useEffect(() => {
    if (!open || !employee) return;
    let active = true;
    setAttendanceState((prev) => ({ ...prev, loading: true }));
    (async () => {
      try {
        const remote = await attendanceService.fetchAttendanceHistory(employee.id, 50);
        const sourceRecords = remote.length ? remote : loadLocalAttendanceHistory(employee.id);
        const summary = summarizeAttendanceRecords(sourceRecords);
        if (active) {
          setAttendanceState({
            history: summary.history,
            monthlyHours: summary.monthlyHours,
            loading: false,
          });
        }
      } catch (error) {
        console.warn("Không tải được lịch sử chấm công của nhân viên.", error);
        if (active) {
          const summary = summarizeAttendanceRecords(loadLocalAttendanceHistory(employee.id));
          setAttendanceState({
            history: summary.history,
            monthlyHours: summary.monthlyHours,
            loading: false,
          });
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [employee, open]);

  const formatMoney = (value: number) =>
    Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  const formatDate = (value?: string) => {
    if (!value) return "—";
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime())
      ? "—"
      : new Intl.DateTimeFormat("vi-VN").format(parsed);
  };

  const initials = employee.name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const salaryInfo = calculateSalaryProjection(attendanceState.monthlyHours, employee.baseSalary);
  const recentHistory = attendanceState.history.slice(0, 5);

  return (
    <Modal open={open} onClose={onClose} title="Thông tin nhân viên">
      <div className="space-y-5 text-sm text-gray-700">
        <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-gradient-to-r from-blue-50 to-white p-4">
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white shadow-inner flex items-center justify-center text-lg font-semibold text-blue-600">
            {employee.photo ? (
              <img
                src={employee.photo}
                alt={employee.name}
                className="w-full h-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-blue-500">
              Nhân viên
            </p>
            <p className="text-xl font-semibold text-gray-900">
              {employee.name}
            </p>
            <p className="text-sm text-gray-500">{employee.position}</p>
          </div>
          <span
            className={`ml-auto rounded-full px-3 py-1 text-xs font-semibold ${
              employee.status === "active"
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {employee.status === "active" ? "Hoạt động" : "Ngưng"}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Mã nhân viên</span>
            <span className="font-medium text-gray-900">{employee.code}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Phòng ban</span>
            <span className="font-medium text-gray-900">{employee.dept}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Chức vụ</span>
            <span className="font-medium text-gray-900">
              {employee.position}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Cấp độ</span>
            <span className="font-medium text-gray-900">
              {employee.level === "INTERN" ? "Thực tập sinh" : "Nhân viên chính thức"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Lương cơ bản</span>
            <span className="font-semibold text-gray-900">
              {formatMoney(employee.baseSalary)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Ngày vào công ty</span>
            <span className="font-medium text-gray-900">{formatDate(employee.joinedAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Tài khoản</span>
            <span className="font-medium text-gray-900">
              {employee.taiKhoan || "Chưa thiết lập"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Mật khẩu</span>
            <span className="font-medium text-gray-900">
              {employee.matKhau || "Chưa thiết lập"}
            </span>
          </div>
        </div>

        <div className="space-y-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-gray-800">Chấm công & lương tháng này</p>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Tổng số giờ đã làm
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {attendanceState.monthlyHours.toFixed(2)}h
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Lương dự kiến
              </p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                {salaryInfo.projectedSalary.toLocaleString("vi-VN")}₫
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                {salaryInfo.hasBaseSalary
                  ? salaryInfo.overtimeHours > 0
                    ? `Gồm ${salaryInfo.overtimeHours.toFixed(2)}h làm thêm (+${salaryInfo.overtimePay.toLocaleString("vi-VN")}₫)`
                    : "Đã đủ 40 giờ, hiển thị lương cơ bản"
                  : "Chưa đủ 40 giờ để nhận lương cơ bản"}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Số lần chấm công
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {attendanceState.history.length}
              </p>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-3">Lịch sử gần đây</p>
            {attendanceState.loading ? (
              <p className="text-sm text-slate-500">Đang tải dữ liệu...</p>
            ) : recentHistory.length === 0 ? (
              <p className="text-sm text-slate-500">Chưa có dữ liệu chấm công.</p>
            ) : (
              <ul className="space-y-2">
                {recentHistory.map((record) => {
                  const time = new Date(record.timestamp);
                  return (
                    <li
                      key={record.id}
                      className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">
                          {record.type === "checkin" ? "Check-in" : "Check-out"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {time.toLocaleDateString("vi-VN")} • {time.toLocaleTimeString("vi-VN")}
                        </p>
                      </div>
                      {typeof record.durationHours === "number" && record.durationHours > 0 && (
                        <span className="text-xs font-semibold text-emerald-600">
                          +{record.durationHours.toFixed(2)}h
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

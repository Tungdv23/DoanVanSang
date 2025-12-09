import { Pencil, Eye, EyeOff, Trash2, User } from "lucide-react";
import type { Employee } from "./EmployeePage";

export type EmployeeTableProps = Employee;

type EmployeeTableComponentProps = {
  data: EmployeeTableProps[];
  totalCount: number;
  page: number;
  pageSize: number;
  pageCount: number;
  onDelete: (id: string) => void;
  onEdit?: (employee: EmployeeTableProps) => void;
  onRegisterFace: (employee: EmployeeTableProps) => void;
  onViewPayroll?: (employee: EmployeeTableProps) => Promise<void> | void;
  onViewDetail?: (employee: EmployeeTableProps) => void;
  onViewAttendance?: (employee: EmployeeTableProps) => void;
  onToggleVisibility?: (id: string) => void;
  showHidden?: boolean;
  onPageChange: (page: number) => void;
};

export function EmployeeTable({
  data,
  totalCount,
  page,
  pageSize,
  pageCount,
  onDelete,
  onEdit,
  onRegisterFace,
  onViewPayroll,
  onViewDetail,
  onViewAttendance,
  onToggleVisibility,
  showHidden = false,
  onPageChange,
}: EmployeeTableComponentProps) {
  const visibleRows = showHidden ? data : data.filter((item) => item.visible);

  const startIndex = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex =
    totalCount === 0 ? 0 : Math.min(page * pageSize, totalCount);

  const buildPageNumbers = () => {
    if (pageCount <= 5) {
      return Array.from({ length: pageCount }, (_, idx) => idx + 1);
    }
    const pages: (number | string)[] = [1];
    let start = Math.max(2, page - 1);
    let end = Math.min(pageCount - 1, page + 1);
    if (start > 2) pages.push("dots-start");
    for (let i = start; i <= end; i += 1) {
      pages.push(i);
    }
    if (end < pageCount - 1) pages.push("dots-end");
    pages.push(pageCount);
    return pages;
  };

  const pageButtons = buildPageNumbers();

  const renderAvatar = (employee: EmployeeTableProps) => {
    if (employee.photo) {
      return (
        <img
          src={employee.photo}
          alt={employee.name}
          className="h-11 w-11 rounded-full object-cover"
        />
      );
    }
    const initials = employee.name
      .split(" ")
      .slice(-2)
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase();
    return (
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-500">
        {initials}
      </div>
    );
  };

  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-100 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100 text-left">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              {[
                "Mã NV",
                "Họ và tên",
                "Phòng ban",
                "Chức vụ",
                "Lương",
                "Trạng thái",
                "Hành động",
              ].map((title) => (
                <th key={title} className="px-6 py-4">
                  {title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white text-sm text-slate-600">
            {visibleRows.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-10 text-center text-slate-400"
                >
                  Không có nhân viên phù hợp với bộ lọc
                </td>
              </tr>
            )}

            {visibleRows.map((employee) => (
              <tr
                key={employee.id}
                className={`border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60 ${
                  employee.visible ? "" : "bg-slate-50/70"
                }`}
              >
                <td className="px-6 py-4">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {employee.code}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {renderAvatar(employee)}
                    <div>
                      <p className="font-semibold text-slate-900">
                        {employee.name}
                      </p>
                      {!employee.visible && (
                        <p className="text-[11px] font-semibold text-rose-500">
                          Đang bị ẩn
                        </p>
                      )}
                      <p className="text-xs text-slate-500">
                        {LEVEL_LABELS[employee.level] ?? "—"}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-700">{employee.dept}</td>
                <td className="px-6 py-4">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {employee.position}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (onViewPayroll) void onViewPayroll(employee);
                      }}
                      className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-xs font-semibold text-blue-600 shadow-sm transition hover:bg-blue-100"
                    >
                      💰 Xem lương
                    </button>
                    <button
                      type="button"
                      onClick={() => onViewAttendance && onViewAttendance(employee)}
                      className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-4 py-1.5 text-xs font-semibold text-violet-600 shadow-sm transition hover:bg-violet-100"
                    >
                      🕒 Lịch sử công
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs font-semibold ${
                      employee.status === "active"
                        ? "bg-green-50 text-green-600"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full bg-current" />
                    {employee.status === "active" ? "Hoạt động" : "Ngưng"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      title="Sửa"
                      onClick={() => onEdit && onEdit(employee)}
                      className="rounded-full border border-blue-100 bg-blue-50 p-2 text-blue-600 shadow-sm transition hover:bg-blue-100"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      title="Xoá"
                      onClick={() => onDelete(employee.id)}
                      className="rounded-full border border-red-100 bg-red-50 p-2 text-red-500 shadow-sm transition hover:bg-red-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      title={employee.visible ? "Ẩn nhân viên" : "Bỏ ẩn nhân viên"}
                      onClick={() => onToggleVisibility && onToggleVisibility(employee.id)}
                      className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:bg-slate-50"
                    >
                      {employee.visible ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      title="Đăng ký khuôn mặt"
                      onClick={() => onRegisterFace(employee)}
                      className="rounded-full border border-emerald-100 bg-emerald-50 p-2 text-emerald-600 shadow-sm transition hover:bg-emerald-100"
                    >
                      <User className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-white px-6 py-4 text-sm text-slate-500">
        <p>
          Hiển thị {totalCount === 0 ? 0 : startIndex}-{endIndex} trong{" "}
          {totalCount} nhân viên
        </p>
        <div className="flex items-center gap-2">
          <button
            className="rounded-full border border-slate-200 px-3 py-1 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
            disabled={page === 1}
            onClick={() => onPageChange(Math.max(1, page - 1))}
          >
            ←
          </button>
          {pageButtons.map((item, idx) =>
            typeof item === "number" ? (
              <button
                key={item}
                onClick={() => onPageChange(item)}
                className={`rounded-full px-3 py-1 ${
                  item === page
                    ? "bg-blue-600 text-white shadow-md"
                    : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {item}
              </button>
            ) : (
              <span key={`${item}-${idx}`} className="px-2">
                ...
              </span>
            )
          )}
          <button
            className="rounded-full border border-slate-200 px-3 py-1 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
            disabled={page === pageCount}
            onClick={() => onPageChange(Math.min(pageCount, page + 1))}
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}
const LEVEL_LABELS: Record<Employee["level"], string> = {
  STAFF: "Nhân viên chính thức",
  INTERN: "Thực tập sinh",
};

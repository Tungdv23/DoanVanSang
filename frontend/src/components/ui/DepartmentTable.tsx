import { Pencil, Trash2 } from "lucide-react";

export type DepartmentTableProps = {
  id: string;
  maPhong: string;
  tenPhong: string;
  namThanhLap: number;
  trangThai: "active" | "inactive";
  visible: boolean;
  truongPhong?: string;
  nhanSu?: number;
};

type DepartmentTableComponentProps = {
  data: DepartmentTableProps[];
  totalCount: number;
  page: number;
  pageSize: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  onDelete: (id: string) => void;
  onEdit?: (department: DepartmentTableProps) => void;
  onViewEmployees?: (department: DepartmentTableProps) => void;
};

const avatarColors = [
  "bg-indigo-100 text-indigo-600",
  "bg-sky-100 text-sky-600",
  "bg-emerald-100 text-emerald-600",
  "bg-violet-100 text-violet-600",
  "bg-amber-100 text-amber-600",
];

const getInitials = (text: string | undefined) => {
  if (!text) return "?";
  return text
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

const buildPageNumbers = (page: number, pageCount: number) => {
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

export function DepartmentTable({
  data,
  totalCount,
  page,
  pageSize,
  pageCount,
  onPageChange,
  onDelete,
  onEdit,
  onViewEmployees,
}: DepartmentTableComponentProps) {
  const visibleRows = data;
  const startIndex = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex =
    totalCount === 0 ? 0 : Math.min(page * pageSize, totalCount);
  const pageButtons = buildPageNumbers(page, pageCount);
  const employeeCounts = data.reduce<Record<string, number>>((acc, dept) => {
    if (typeof dept.nhanSu === "number") {
      acc[dept.id] = dept.nhanSu;
    }
    return acc;
  }, {});

  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-100 shadow-[0_18px_45px_rgba(15,23,42,0.08)] bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100 text-left">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              {[
                "Mã phòng",
                "Tên phòng",
                "Trưởng phòng",
                "Năm thành lập",
                "Nhân sự",
                "Trạng thái",
                "Hành động",
              ].map((title) => (
                <th key={title} className="px-6 py-4">
                  {title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white text-sm text-slate-700">
            {visibleRows.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-8 text-center text-slate-400"
                >
                  Không có phòng ban nào phù hợp với bộ lọc
                </td>
              </tr>
            )}

            {visibleRows.map((dept, index) => (
              <tr
                key={dept.id}
                className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/70"
              >
                <td className="px-6 py-4">
                  <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-600">
                    {dept.maPhong}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                      🏢
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">
                        {dept.tenPhong}
                      </p>
                      <p className="text-xs text-slate-500">Phòng ban</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                        avatarColors[index % avatarColors.length]
                      }`}
                    >
                      {getInitials(dept.truongPhong || dept.tenPhong)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        {dept.truongPhong || "Chưa phân công"}
                      </p>
                      <p className="text-xs text-slate-500">Trưởng phòng</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-700">
                  {dept.namThanhLap}
                </td>
                <td className="px-6 py-4">
                  <button
                    type="button"
                    title="Xem danh sách nhân sự"
                    onClick={() => onViewEmployees?.(dept)}
                    className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                  >
                    <div className="flex -space-x-2">
                      {[0, 1, 2].map((num) => (
                        <div
                          key={num}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-white bg-slate-100 text-slate-500"
                        >
                          👤
                        </div>
                      ))}
                    </div>
                    <span>+{dept.nhanSu ?? 0}</span>
                  </button>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs font-semibold ${
                      dept.trangThai === "active"
                        ? "bg-green-50 text-green-600"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full bg-current" />
                    {dept.trangThai === "active" ? "Hoạt động" : "Ngưng"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      title="Sửa"
                      onClick={() => onEdit && onEdit(dept)}
                      className="rounded-full border border-blue-100 bg-blue-50 p-2 text-blue-600 shadow-sm transition hover:bg-blue-100"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      title="Xoá"
                      onClick={() => onDelete(dept.id)}
                      className="rounded-full border border-red-100 bg-red-50 p-2 text-red-500 shadow-sm transition hover:bg-red-100"
                    >
                      <Trash2 className="h-4 w-4" />
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
          {totalCount} kết quả
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

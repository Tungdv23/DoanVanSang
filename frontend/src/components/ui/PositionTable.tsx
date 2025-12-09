import { ShieldCheck, Pencil, Trash2 } from "lucide-react";
import type { Position } from "./PositionPage";

type PositionTableProps = {
  data: Position[];
  totalCount: number;
  page: number;
  pageSize: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  onDelete: (id: string) => void;
  onEdit?: (position: Position) => void;
  onViewEmployees?: (position: Position) => void;
};

export function PositionTable({
  data,
  totalCount,
  page,
  pageSize,
  pageCount,
  onPageChange,
  onDelete,
  onEdit,
  onViewEmployees,
}: PositionTableProps) {
  const startIndex = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex = totalCount === 0 ? 0 : Math.min(page * pageSize, totalCount);

  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-100 shadow-[0_18px_45px_rgba(15,23,42,0.08)] bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100 text-left">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-6 py-4">Chức vụ</th>
              <th className="px-6 py-4">Mô tả & cấp độ</th>
              <th className="px-6 py-4">Quyền hạn</th>
              <th className="px-6 py-4">Nhân sự</th>
              <th className="px-6 py-4">Trạng thái</th>
              <th className="px-6 py-4">Hành động</th>
            </tr>
          </thead>
          <tbody className="bg-white text-sm text-slate-700">
            {data.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-slate-400">
                  Không có chức vụ nào phù hợp
                </td>
              </tr>
            )}

            {data.map((position) => (
              <tr
                key={position.id}
                className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/70"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-indigo-50 text-indigo-600 shadow-inner">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">
                        {position.tenChucVu}
                      </p>
                      <p className="text-xs text-slate-500">
                        {position.maChucVu}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-slate-700">
                    {position.moTa || "Mô tả đang cập nhật"}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-2">
                    {position.quyenHan?.length ? (
                      position.quyenHan.map((permission) => (
                        <span
                          key={permission}
                          className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600"
                        >
                          {permission}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">
                        Chưa gán quyền
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <button
                    type="button"
                    title="Xem nhân sự theo chức vụ"
                    onClick={() => onViewEmployees?.(position)}
                    className="flex items-center gap-3 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                  >
                    <div className="flex -space-x-2">
                      {[...Array(3)].map((_, idx) => (
                        <div
                          key={idx}
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-white bg-slate-100 text-xs font-semibold text-slate-500"
                        >
                          {position.tenChucVu.charAt(0)}
                        </div>
                      ))}
                    </div>
                    <span>{position.soNhanSu ?? 0} người</span>
                  </button>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs font-semibold ${
                      position.trangThai === "active"
                        ? "bg-green-50 text-green-600"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full bg-current" />
                    {position.trangThai === "active" ? "Hoạt động" : "Ngưng"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      title="Sửa"
                      onClick={() => onEdit?.(position)}
                      className="rounded-full border border-blue-100 bg-blue-50 p-2 text-blue-600 shadow-sm transition hover:bg-blue-100"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      title="Xoá"
                      onClick={() => onDelete(position.id)}
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
          Hiển thị {totalCount === 0 ? 0 : startIndex}-{endIndex} trong {totalCount} chức vụ
        </p>
        <div className="flex items-center gap-2">
          <button
            className="rounded-full border border-slate-200 px-3 py-1 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
            disabled={page === 1}
            onClick={() => onPageChange(Math.max(1, page - 1))}
          >
            ←
          </button>
          {Array.from({ length: pageCount }, (_, idx) => (
            <button
              key={idx}
              onClick={() => onPageChange(idx + 1)}
              className={`rounded-full px-3 py-1 ${
                page === idx + 1
                  ? "bg-blue-600 text-white shadow-md"
                  : "border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {idx + 1}
            </button>
          ))}
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

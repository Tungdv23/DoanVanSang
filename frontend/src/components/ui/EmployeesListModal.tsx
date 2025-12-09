import type { Employee } from "./EmployeePage";
import { Modal } from "./Modal";

type EmployeesListModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  employees: Employee[];
  description?: string;
  emptyDescription?: string;
};

export function EmployeesListModal({
  open,
  onClose,
  title,
  employees,
  description,
  emptyDescription,
}: EmployeesListModalProps) {
  const hasEmployees = employees.length > 0;
  const defaultDescription = hasEmployees
    ? `Có ${employees.length} nhân viên trong danh sách này.`
    : "Chưa có nhân viên nào.";

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-4">
        <p className="text-sm text-slate-500">
          {hasEmployees ? description ?? defaultDescription : emptyDescription ?? defaultDescription}
        </p>
        {hasEmployees && (
          <div className="max-h-80 overflow-y-auto rounded-2xl border border-slate-100">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Mã NV</th>
                  <th className="px-4 py-3 text-left">Họ tên</th>
                  <th className="px-4 py-3 text-left">Phòng ban</th>
                  <th className="px-4 py-3 text-left">Chức vụ</th>
                  <th className="px-4 py-3 text-left">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                {employees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-semibold text-slate-900">{employee.code}</td>
                    <td className="px-4 py-3">{employee.name}</td>
                    <td className="px-4 py-3">{employee.dept}</td>
                    <td className="px-4 py-3">{employee.position}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                          employee.status === "active"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {employee.status === "active" ? "Hoạt động" : "Ngưng"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Đóng
          </button>
        </div>
      </div>
    </Modal>
  );
}

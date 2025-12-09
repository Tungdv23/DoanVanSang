import { Link } from "react-router-dom";

type PayrollCalculatorProps = {
  employeeName?: string | null;
  employeeCode?: string | null;
  employeeId?: string | null;
  dept?: string | null;
  position?: string | null;
  salary?: number;
  totalHours?: number;
};


export const PayrollCalculator = ({
  employeeName,
  employeeCode,
  employeeId,
  dept,
  position,
  salary,
  totalHours,
}: PayrollCalculatorProps) => {
  const formatMoney = (value: number) =>
    Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);

  const baseSalary = typeof salary === "number" ? salary : 0;
  const hoursThisMonth = typeof totalHours === "number" ? totalHours : 0;
  const standardHours = 40;
  const overtimeHours = Math.max(0, hoursThisMonth - standardHours);
  const overtimePay =
    overtimeHours > 0 ? (baseSalary / standardHours) * overtimeHours * 1.5 : 0;
  const totalSalary = baseSalary + overtimePay;

  const detailRows = [
    { label: "Nhân viên", value: employeeName ?? "Chưa chọn" },
    { label: "Mã nhân viên", value: employeeCode ?? "—" },
    { label: "ID hệ thống", value: employeeId ?? "—" },
    { label: "Phòng ban", value: dept ?? "—" },
    { label: "Chức vụ", value: position ?? "—" },
    {
      label: "Giờ làm tháng này",
      value: typeof totalHours === "number" ? `${totalHours} giờ` : "—",
    },
  ];

  const summaryCards = [
    {
      title: "Lương cơ bản",
      value: baseSalary > 0 ? formatMoney(baseSalary) : "—",
      description: "Theo hợp đồng lao động",
    },
    {
      title: "Giờ làm thêm",
      value: `${overtimeHours}h`,
      description: "Áp dụng sau 40h/tuần",
    },
    {
      title: "Lương làm thêm",
      value: overtimePay > 0 ? formatMoney(overtimePay) : "—",
      description: "Nhân hệ số 150%",
    },
    {
      title: "Tổng lương dự kiến",
      value: totalSalary > 0 ? formatMoney(totalSalary) : "—",
      description: "Bao gồm lương cơ bản + OT",
      highlight: true,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            Hồ sơ lương
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Thông tin lương nhân viên
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Tổng hợp thu nhập dựa trên dữ liệu chấm công và cấu hình hệ số.
          </p>
        </div>
        <Link
          to="/admin"
          className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:border-blue-400 hover:text-blue-700"
        >
          ← Quay lại bảng điều khiển
        </Link>
      </div>

      <section className="grid gap-6 lg:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-xl font-semibold text-blue-500">
              {employeeName ? employeeName.charAt(0) : "?"}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Nhân sự
              </p>
              <p className="text-lg font-semibold text-slate-900">
                {employeeName ?? "Chưa chọn"}
              </p>
              <p className="text-sm text-slate-500">
                {position ?? "Chưa cập nhật"} • {dept ?? "—"}
              </p>
            </div>
          </div>

          <dl className="mt-6 space-y-3 text-sm text-slate-600">
            {detailRows.map(({ label, value }) => (
              <div
                key={label}
                className="flex items-center justify-between border-b border-dashed border-slate-100 pb-2 last:border-none"
              >
                <dt>{label}</dt>
                <dd className="font-semibold text-slate-900">{value}</dd>
              </div>
            ))}
          </dl>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900">
            Tóm tắt thu nhập tháng này
          </h2>
          <p className="text-sm text-slate-500">
            Dựa trên dữ liệu chấm công thực tế và hệ số làm thêm.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {summaryCards.map(({ title, value, description, highlight }) => (
              <div
                key={title}
                className={`rounded-xl border p-4 ${
                  highlight
                    ? "border-blue-200 bg-white shadow-md"
                    : "border-slate-100 bg-white/80"
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {title}
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {value}
                </p>
                <p className="mt-1 text-xs text-slate-500">{description}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-blue-100 bg-white/90 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-800">Ghi chú</p>
            <p>
              Lương làm thêm mặc định áp dụng hệ số 150%. Có thể điều chỉnh hệ số
              và ngưỡng giờ trong phần cấu hình của phòng nhân sự để phù hợp
              chính sách công ty.
            </p>
          </div>
        </article>
      </section>
    </div>
  );
};

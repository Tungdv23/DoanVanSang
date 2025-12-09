
import Card from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { formatCurrency } from "@/lib/money";
import { useEffect, useMemo, useState } from "react";
import { employeesService } from "@/services/employeesService";
import { payrollService, type MonthlyPayrollRow } from "@/services/payrollService";
import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

type IncomeRow = {
  month: number;
  basicSalary: number;
  netSalary: number;
  difference: number;
};

const IncomeReport = () => {
  const now = useMemo(() => new Date(), []);
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const [year, setYear] = useState(currentYear);
  const [employee, setEmployee] = useState<string>("");
  const [employeeDetail, setEmployeeDetail] = useState<{ id: string; name: string; baseSalary: number } | null>(null);
  const [employees, setEmployees] = useState<{ id: string; name: string; baseSalary: number }[]>([]);
  const [payrollRows, setPayrollRows] = useState<MonthlyPayrollRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [previousYearIncome, setPreviousYearIncome] = useState(0);

  useEffect(() => {
    if (year > currentYear) {
      setYear(currentYear);
    }
  }, [year, currentYear]);

  useEffect(() => {
    void payrollService.removeFuturePayrolls(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const list = await employeesService.list();
        if (!active) return;
        const mapped = list.map((emp) => ({
          id: emp.id,
          name: emp.name,
          baseSalary: typeof emp.baseSalary === "number" ? emp.baseSalary : Number(emp.baseSalary ?? 0),
        }));
        setEmployees(mapped);
        if (!employee && mapped.length) {
          setEmployee(mapped[0].id);
          setEmployeeDetail(mapped[0]);
        } else if (employee) {
          const selected = mapped.find((item) => item.id === employee);
          setEmployeeDetail(selected ?? null);
        }
      } catch (error) {
        console.warn("Không tải được danh sách nhân viên cho báo cáo lương.", error);
      }
    })();
    return () => {
      active = false;
    };
  }, []); // load employees once

  useEffect(() => {
    if (!employee) {
      setEmployeeDetail(null);
      return;
    }
    const detail = employees.find((item) => item.id === employee) ?? null;
    setEmployeeDetail(detail);
  }, [employee, employees]);

  useEffect(() => {
    if (!employee) {
      setPayrollRows([]);
      return;
    }
    if (year > currentYear) {
      setYear(currentYear);
      return;
    }
    let active = true;
    setLoading(true);
    (async () => {
      try {
        const rows = await payrollService.fetchMonthlyPayrolls(employee, year);
        if (!active) return;
        setPayrollRows(rows);
      } catch (error) {
        console.warn("Không tải được dữ liệu bảng lương.", error);
        if (active) setPayrollRows([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [employee, year]);

  useEffect(() => {
    if (!employee) {
      setPreviousYearIncome(0);
      return;
    }
    let active = true;
    (async () => {
      try {
        const rows = await payrollService.fetchMonthlyPayrolls(employee, year - 1);
        if (!active) return;
        const limit = year === currentYear ? currentMonth : 12;
        const total = rows
          .filter((row) => row.month <= limit)
          .reduce((sum, row) => sum + row.total_pay, 0);
        setPreviousYearIncome(total);
      } catch (error) {
        console.warn("Không tải được dữ liệu năm trước.", error);
        if (active) setPreviousYearIncome(0);
      }
    })();
    return () => {
      active = false;
    };
  }, [employee, year]);

  const activeMonthLimit = year === currentYear ? currentMonth : 12;

  const visibleRows = useMemo(() => {
    return payrollRows
      .filter((row) => row.month <= activeMonthLimit)
      .sort((a, b) => a.month - b.month);
  }, [payrollRows, activeMonthLimit]);

  const baseSalaryFallback = useMemo(() => {
    if (employeeDetail) return employeeDetail.baseSalary;
    const nonZeroRow = visibleRows.find((row) => row.base_salary > 0);
    return nonZeroRow ? nonZeroRow.base_salary : 0;
  }, [employeeDetail, visibleRows]);

  const data = useMemo<IncomeRow[]>(() => {
    return visibleRows.map((row) => {
      const baseSalary = row.base_salary > 0 ? row.base_salary : baseSalaryFallback;
      const netSalary =
        row.total_pay > 0
          ? row.total_pay
          : row.base_salary > 0
          ? row.base_salary
          : baseSalaryFallback;
      return {
        month: row.month,
        basicSalary: baseSalary,
        netSalary,
        difference: netSalary - baseSalary,
      };
    });
  }, [visibleRows, baseSalaryFallback, activeMonthLimit]);

  const totalIncome = useMemo(() => {
    return visibleRows.reduce(
      (acc, item) => acc + (item.total_pay || item.base_salary || 0),
      0
    );
  }, [visibleRows]);

  const incomeChange = totalIncome - previousYearIncome;
  const changePercent = previousYearIncome > 0 ? (incomeChange / previousYearIncome) * 100 : 0;
  const chartData = useMemo(
    () =>
      data.map((row) => ({
        month: row.month,
        netSalary: row.netSalary,
      })),
    [data]
  );
  const yearOptions = useMemo(() => {
    const years: number[] = [];
    const start = Math.max(2019, currentYear - 5);
    for (let option = currentYear; option >= start; option -= 1) {
      years.push(option);
    }
    return years;
  }, [currentYear]);

  const hasData = data.length > 0;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Báo cáo thu nhập năm</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Năm</label>
            <Select value={String(year)} onChange={(e) => setYear(parseInt(e.target.value, 10))}>
              {yearOptions.map((option) => (
                <option key={option} value={option}>
                  Năm {option}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Nhân viên</label>
            <Select
              value={employee}
              onChange={(e) => setEmployee(e.target.value)}
              disabled={!employees.length}
            >
              {!employees.length && <option value="">Đang tải nhân viên...</option>}
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {employee ? (
          <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">Lương thực nhận hàng tháng</h2>
                    <span className="text-xs text-gray-500">
                      Dữ liệu đến tháng {activeMonthLimit}/{year}
                    </span>
                  </div>
                  <div style={{ width: "100%", height: 320 }}>
                    {loading ? (
                      <div className="flex h-full items-center justify-center text-sm text-slate-500">
                        Đang tải dữ liệu...
                      </div>
                    ) : chartData.length === 0 ? (
                      <div className="flex h-full items-center justify-center text-sm text-slate-400">
                        Chưa có dữ liệu bảng lương cho nhân viên này.
                      </div>
                    ) : (
                      <ResponsiveContainer>
                        <RechartsBarChart
                          data={chartData}
                          margin={{ top: 10, right: 24, left: 0, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="month" tickFormatter={(tick) => `T${tick}`} />
                          <YAxis tickFormatter={(value) => `${Math.round(value / 1_000_000)}tr`} />
                          <Tooltip
                            formatter={(value: number) => [formatCurrency(value), "Thực nhận"]}
                            labelFormatter={(label) => `Tháng ${label}`}
                          />
                          <Bar dataKey="netSalary" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </Card>

              <Card>
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">Bảng thống kê</h2>
                    <span className="text-xs text-gray-500">
                      Tới tháng {activeMonthLimit}/{year}
                    </span>
                  </div>
                  {loading ? (
                    <p className="text-sm text-slate-500">Đang tải dữ liệu...</p>
                  ) : data.length === 0 ? (
                    <p className="text-sm text-slate-500">Chưa có dữ liệu bảng lương để hiển thị.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-left">
                        <thead>
                          <tr className="bg-gray-50 text-sm text-gray-600">
                            <th className="px-4 py-3 font-medium">Tháng</th>
                            <th className="px-4 py-3 font-medium">Lương cơ bản</th>
                            <th className="px-4 py-3 font-medium">Lương thực nhận</th>
                            <th className="px-4 py-3 font-medium">Chênh lệch</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.map((row) => (
                            <tr key={row.month} className="border-t text-sm text-gray-700">
                              <td className="px-4 py-3 font-semibold">Tháng {row.month}</td>
                              <td className="px-4 py-3">{formatCurrency(row.basicSalary)}</td>
                              <td className="px-4 py-3 font-semibold">{formatCurrency(row.netSalary)}</td>
                              <td
                                className={`px-4 py-3 font-semibold ${
                                  row.difference >= 0 ? "text-green-600" : "text-red-600"
                                }`}
                              >
                                {formatCurrency(row.difference)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card>
                <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
                  <h2 className="text-xl font-semibold text-gray-800">Tổng thu nhập năm {year}</h2>
                  <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalIncome)}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <span
                      className={`px-2 py-1 rounded-full font-semibold ${
                        incomeChange >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {previousYearIncome > 0 ? `${changePercent.toFixed(1)}%` : "0%"}
                    </span>
                    <span className="text-gray-500">
                      {incomeChange >= 0 ? "Tăng" : "Giảm"} so với năm trước
                    </span>
                  </div>
                  <div className="rounded-lg border border-dashed border-gray-200 text-center text-xs text-gray-500 py-6">
                    Biểu đồ xu hướng (Chưa triển khai)
                  </div>
                  {!hasData && (
                    <p className="text-sm text-gray-500">
                      Chưa có dữ liệu lương. Vui lòng nhập thủ công vào bảng monthly_payrolls trên Supabase.
                    </p>
                  )}
                </div>
              </Card>
            </div>
          </main>
        ) : (
          <div className="text-sm text-slate-500">Chọn nhân viên để xem báo cáo lương.</div>
        )}
      </div>
    </div>
  );
};

export default IncomeReport;

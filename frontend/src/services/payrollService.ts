import { supabase } from '@/lib/supabaseClient';
import { apiFetch, buildApiUrl } from './api';

export type MonthlyPayrollRow = {
  id: string;
  employee_id: string;
  year: number;
  month: number;
  total_hours: number;
  overtime_hours: number;
  base_salary: number;
  overtime_pay: number;
  total_pay: number;
  status: 'draft' | 'approved' | 'paid';
  created_at?: string;
  updated_at?: string;
};

export type MonthlyPayrollUpsert = {
  employeeId: string;
  year: number;
  month: number;
  totalHours: number;
  overtimeHours: number;
  baseSalary: number;
  overtimePay: number;
  totalPay: number;
  status?: 'draft' | 'approved' | 'paid';
};

export const payrollService = {
  async upsertMonthlySummary(payload: MonthlyPayrollUpsert) {
    try {
      if (!supabase) {
        // Không có Supabase: bỏ qua ghi nhận từ xa
        return;
      }
      const { error } = await supabase
        .from('monthly_payrolls')
        .upsert(
          {
            employee_id: payload.employeeId,
            year: payload.year,
            month: payload.month,
            total_hours: payload.totalHours,
            overtime_hours: payload.overtimeHours,
            base_salary: payload.baseSalary,
            overtime_pay: payload.overtimePay,
            total_pay: payload.totalPay,
            status: payload.status ?? (payload.totalHours >= 40 ? 'approved' : 'draft'),
          },
          { onConflict: 'employee_id,year,month' }
        );
      if (error) throw error;
    } catch (error) {
      console.warn('Không thể cập nhật monthly_payrolls trên Supabase.', error);
    }
  },
  async fetchMonthlyPayrolls(employeeId: string, year: number) {
    // Supabase path
    if (supabase) {
      const { data, error } = await supabase
        .from('monthly_payrolls')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('year', year)
        .order('month', { ascending: true });
      if (error) {
        console.warn('Không lấy được monthly_payrolls.', error);
        return [] as MonthlyPayrollRow[];
      }
      return (data as MonthlyPayrollRow[]) ?? [];
    }

    // REST fallback: gọi backend /api/payroll-report cho từng tháng và map về MonthlyPayrollRow
    try {
      const months = Array.from({ length: 12 }, (_, idx) => idx + 1);
      const rows = await Promise.all(
        months.map(async (month) => {
          const payload = await apiFetch<
            Array<{
              employeeId: string | number;
              code: string;
              name: string;
              baseSalary: number;
              totalHours: number;
              overtimeHours: number;
              overtimePay: number;
              finalSalary: number;
            }>
          >(buildApiUrl(`/payroll-report?month=${month}&year=${year}`));
          const matched = payload.find((row) => String(row.employeeId) === String(employeeId));
          if (!matched) return null;
          return {
            id: `${employeeId}-${year}-${month}`,
            employee_id: String(employeeId),
            year,
            month,
            total_hours: Number(matched.totalHours ?? 0),
            overtime_hours: Number(matched.overtimeHours ?? 0),
            base_salary: Number(matched.baseSalary ?? 0),
            overtime_pay: Number(matched.overtimePay ?? 0),
            total_pay: Number(
              matched.finalSalary ??
                matched.baseSalary ??
                matched.totalHours ??
                0
            ),
            status: 'approved',
          } as MonthlyPayrollRow;
        })
      );
      return rows.filter((row): row is MonthlyPayrollRow => Boolean(row));
    } catch (error) {
      console.warn('Không lấy được dữ liệu payroll từ backend REST.', error);
      return [] as MonthlyPayrollRow[];
    }
  },
  async removeFuturePayrolls(cutoffYear: number, cutoffMonth?: number) {
    try {
      if (!supabase) return;
      const futureYearResult = await supabase.from('monthly_payrolls').delete().gt('year', cutoffYear);
      if (futureYearResult.error) throw futureYearResult.error;
      if (typeof cutoffMonth === 'number') {
        const futureMonthResult = await supabase
          .from('monthly_payrolls')
          .delete()
          .eq('year', cutoffYear)
          .gt('month', cutoffMonth);
        if (futureMonthResult.error) throw futureMonthResult.error;
      }
    } catch (error) {
      console.warn('Không thể xóa dữ liệu lương tương lai.', error);
    }
  },
  async fetchYearOverview(year: number, month?: number) {
    if (!supabase) return [] as MonthlyPayrollRow[];
    let query = supabase
      .from('monthly_payrolls')
      .select('*, employees!inner(id, full_name)')
      .eq('year', year);
    if (typeof month === 'number') {
      query = query.eq('month', month);
    }
    const { data, error } = await query;
    if (error) {
      console.warn('Không lấy được báo cáo lương từ Supabase.', error);
      return [] as MonthlyPayrollRow[];
    }
    return (data as MonthlyPayrollRow[]) ?? [];
  },
};

import { supabase } from '@/lib/supabaseClient';

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
    if (!supabase) return [] as MonthlyPayrollRow[];
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

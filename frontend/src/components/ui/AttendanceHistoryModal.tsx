import { useEffect, useMemo, useState } from "react";
import { Modal } from "./Modal";
import type { Employee } from "./EmployeePage";
import { attendanceService } from "../../services/attendanceService";
import {
  loadLocalAttendanceHistory,
  summarizeAttendanceRecords,
  resolveAttendanceReferenceDate,
  loadAttendanceSummary,
  saveAttendanceSummary,
  type AttendanceEvent,
} from "../../lib/attendanceHistory";

export function AttendanceHistoryModal({
  open,
  onClose,
  employee,
}: {
  open: boolean;
  onClose: () => void;
  employee: Employee | null;
}) {
  const [records, setRecords] = useState<AttendanceEvent[]>([]);
  const [monthlyHours, setMonthlyHours] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<"remote" | "local">("local");
  const [referenceContext, setReferenceContext] = useState<{ year: number; month: number } | null>(
    null
  );

  useEffect(() => {
    if (!employee) return;
    const cached = loadAttendanceSummary(employee.id);
    if (cached) {
      setMonthlyHours(cached.hours);
      setReferenceContext({ year: cached.year, month: cached.month });
    } else {
      setMonthlyHours(0);
      setReferenceContext(null);
    }
  }, [employee]);

  useEffect(() => {
    if (!open || !employee) return;
    let active = true;

    const applySummary = (events: AttendanceEvent[], source: "remote" | "local") => {
      const reference = resolveAttendanceReferenceDate(events, new Date());
      const summary = summarizeAttendanceRecords(events, reference);
      if (!active) return;
      setRecords(summary.history);
      setMonthlyHours(summary.monthlyHours);
      setReferenceContext({ year: reference.getFullYear(), month: reference.getMonth() + 1 });
      saveAttendanceSummary(employee.id, {
        year: reference.getFullYear(),
        month: reference.getMonth() + 1,
        hours: summary.monthlyHours,
        updatedAt: new Date().toISOString(),
      });
      setDataSource(source);
    };

    const loadHistory = async () => {
      setLoading(true);
      try {
        const remoteRecords = await attendanceService.fetchAttendanceHistory(employee.id);
        if (remoteRecords.length) {
          applySummary(remoteRecords, "remote");
          return;
        }
      } catch (error) {
        console.warn("Không tải được lịch sử chấm công của nhân viên.", error);
      }
      const localRecords = loadLocalAttendanceHistory(employee.id);
      applySummary(localRecords, "local");
    };

    void loadHistory();

    return () => {
      active = false;
    };
  }, [open, employee]);

  const currentMonthCount = useMemo(() => {
    if (!records.length || !referenceContext) return 0;
    return records.filter((record) => {
      const time = new Date(record.timestamp);
      return (
        time.getFullYear() === referenceContext.year &&
        time.getMonth() === referenceContext.month - 1
      );
    }).length;
  }, [records, referenceContext]);

  if (!employee) return null;

  const formatter = new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });

  const orderedRecords = [...records].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Lịch sử chấm công - ${employee.name}`}
      titleClassName="text-slate-900"
    >
      <div className="space-y-5">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {referenceContext
              ? `Tổng giờ tháng ${referenceContext.month}/${referenceContext.year}`
              : "Tổng giờ tháng này"}
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{monthlyHours.toFixed(2)}h</p>
          <p className="text-sm text-slate-500">
            Số lần chấm công trong tháng: {currentMonthCount}
            {dataSource === "remote" ? "" : " • Dữ liệu trên thiết bị"}
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-3">
            {loading ? "Đang tải lịch sử..." : "Lịch sử gần đây"}
          </p>
          {orderedRecords.length === 0 ? (
            <p className="text-sm text-slate-500">Chưa có dữ liệu chấm công.</p>
          ) : (
            <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {orderedRecords.map((record) => (
                <li
                  key={record.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-2 shadow-sm"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {record.type === "checkin" ? "Check-in" : "Check-out"}
                    </p>
                    <p className="text-xs text-slate-500">{formatter.format(new Date(record.timestamp))}</p>
                  </div>
                  {typeof record.durationHours === "number" && (
                    <span className="text-sm font-semibold text-emerald-600">
                      +{record.durationHours.toFixed(2)}h
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}

import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FaceAttendanceShell, {
  type FaceAttendanceShellHandle,
} from './components/FaceAttendanceShell';
import './attendance.css';
import { captureFaceDescriptor, descriptorToArray } from '../../lib/faceRecognition';
import { attendanceService } from '../../services/attendanceService';
import { payrollService } from '../../services/payrollService';
import type { Employee } from '../../components/ui/EmployeePage';
import {
  appendLocalAttendanceRecord,
  loadLocalAttendanceHistory,
  summarizeAttendanceRecords,
  calculateSalaryProjection,
  calculateSimulatedHours,
  resolveAttendanceReferenceDate,
  saveAttendanceSummary,
  type AttendanceEvent,
} from '../../lib/attendanceHistory';

const loadEmployees = () => {
  const stored = localStorage.getItem("employeesData");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed.map((emp) => {
          const baseSalary =
            typeof (emp as Record<string, unknown>).baseSalary === "number"
              ? (emp as Record<string, number>).baseSalary
              : Number((emp as Record<string, unknown>)["salary"]) || 0;
          return { ...emp, baseSalary };
        });
      }
    } catch (error) {
      console.warn("Không đọc được employeesData:", error);
    }
  }
  return [
    { id: "1", code: "PKDN0001", name: "Nguyễn Minh Anh", dept: "Phòng Kinh Doanh", position: "Nhân viên", baseSalary: 10000000, status: "active", visible: true },
    { id: "2", code: "PTPT0002", name: "Nguyễn Minh Tạo", dept: "Trưởng phòng", position: "Trưởng phòng", baseSalary: 20000000, status: "active", visible: true },
    { id: "3", code: "PCKN0003", name: "Trần Quỳnh", dept: "Chăm sóc KH", position: "Nhân viên", baseSalary: 12000000, status: "inactive", visible: true },
  ];
};

const buildActiveCheckInKey = (employeeId: string) => `activeCheckIn:${employeeId}`;

const FaceAttendancePage = () => {
  const navigate = useNavigate();
  const [employees] = useState(loadEmployees);
  const [employee, setEmployee] = useState<any>(null);
  const [thongBao, setThongBao] = useState<string | null>(null);
  const [loaiThongBao, setLoaiThongBao] = useState<'in' | 'out' | null>(null);
  const [hasRegisteredFace, setHasRegisteredFace] = useState(false);
  const [dangChamCong, setDangChamCong] = useState(false);
  const shellRef = useRef<FaceAttendanceShellHandle | null>(null);
  const [historyRecords, setHistoryRecords] = useState<AttendanceEvent[]>([]);
  const [monthlyHours, setMonthlyHours] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const refreshAttendanceData = useCallback(async (target: Employee, salaryInput?: number) => {
    try {
      const remoteRecords = await attendanceService.fetchAttendanceHistory(target.id);
      if (remoteRecords.length) {
        const remoteReference = resolveAttendanceReferenceDate(remoteRecords, new Date());
        const summary = summarizeAttendanceRecords(remoteRecords, remoteReference);
        setHistoryRecords(summary.history);
        setMonthlyHours(summary.monthlyHours);
        saveAttendanceSummary(target.id, {
          year: remoteReference.getFullYear(),
          month: remoteReference.getMonth() + 1,
          hours: summary.monthlyHours,
          updatedAt: new Date().toISOString(),
        });
        const baseValue = salaryInput ?? target.baseSalary ?? 0;
        if (baseValue > 0) {
          const payroll = calculateSalaryProjection(summary.monthlyHours, baseValue);
          void payrollService.upsertMonthlySummary({
            employeeId: target.id,
            year: remoteReference.getFullYear(),
            month: remoteReference.getMonth() + 1,
            totalHours: summary.monthlyHours,
            overtimeHours: payroll.overtimeHours,
            baseSalary: baseValue,
            overtimePay: payroll.overtimePay,
            totalPay: payroll.projectedSalary,
            status: payroll.hasBaseSalary ? 'approved' : 'draft',
          });
        }
        return;
      }
    } catch (error) {
      console.warn('Không tải được lịch sử chấm công từ Supabase.', error);
    }
    const localRecords = loadLocalAttendanceHistory(target.id);
    const localReference = resolveAttendanceReferenceDate(localRecords, new Date());
    const summary = summarizeAttendanceRecords(localRecords, localReference);
    setHistoryRecords(summary.history);
    setMonthlyHours(summary.monthlyHours);
    saveAttendanceSummary(target.id, {
      year: localReference.getFullYear(),
      month: localReference.getMonth() + 1,
      hours: summary.monthlyHours,
      updatedAt: new Date().toISOString(),
    });
    const fallbackSalary = salaryInput ?? target.baseSalary ?? 0;
    if (fallbackSalary > 0) {
      const payroll = calculateSalaryProjection(summary.monthlyHours, fallbackSalary);
      void payrollService.upsertMonthlySummary({
        employeeId: target.id,
        year: localReference.getFullYear(),
        month: localReference.getMonth() + 1,
        totalHours: summary.monthlyHours,
        overtimeHours: payroll.overtimeHours,
        baseSalary: fallbackSalary,
        overtimePay: payroll.overtimePay,
        totalPay: payroll.projectedSalary,
        status: payroll.hasBaseSalary ? 'approved' : 'draft',
      });
    }
  }, []);
  const legacySalary =
    employee && typeof employee === "object"
      ? Number((employee as Record<string, unknown>)["salary"])
      : undefined;
  const baseSalary = employee?.baseSalary ?? legacySalary ?? 0;
  const salaryInfo = calculateSalaryProjection(monthlyHours, baseSalary);

  useEffect(() => {
    const storedId = localStorage.getItem("attendanceEmployeeId");
    if (!storedId) {
      navigate('/', { replace: true });
      return;
    }
    const foundEmployee = employees.find((emp) => emp.id === storedId);
    if (foundEmployee) {
      setEmployee(foundEmployee);
    } else {
      navigate('/', { replace: true });
    }
  }, [employees, navigate]);
  useEffect(() => {
    let active = true;
    if (!employee) {
      setHasRegisteredFace(false);
      setHistoryRecords([]);
      setMonthlyHours(0);
      setShowHistory(false);
      return;
    }
    (async () => {
      const registered = await attendanceService.hasFaceEnrollment(employee.id);
      if (active) setHasRegisteredFace(registered);
    })();
    setShowHistory(false);
    const activeKey = buildActiveCheckInKey(employee.id);
    const savedCheckin = localStorage.getItem(activeKey);
    if (savedCheckin) {
      const parsed = new Date(savedCheckin);
      if (!Number.isNaN(parsed.getTime())) {
        setCheckInTime(parsed);
      }
    }
    void refreshAttendanceData(employee, employee.baseSalary ?? 0);
    return () => {
      active = false;
    };
  }, [employee, refreshAttendanceData]);
const [checkInTime, setCheckInTime] = useState<Date | null>(null);
const [checkOutTime, setCheckOutTime] = useState<Date | null>(null);

  const xuLyChamCong = async (kieu: 'in' | 'out') => {
    if (!employee) {
      setThongBao("Không tồn tại nhân viên để chấm công");
      setLoaiThongBao(null);
      setTimeout(() => setThongBao(null), 4000);
      return;
    }
    if (!hasRegisteredFace) {
      setThongBao("Không tìm thấy dữ liệu khuôn mặt. Vui lòng đăng ký trước.");
      setLoaiThongBao(null);
      setTimeout(() => setThongBao(null), 4000);
      return;
    }
    const videoElement = shellRef.current?.getVideoElement();
    if (!videoElement) {
      setThongBao("Không tìm thấy camera. Vui lòng kiểm tra lại thiết bị.");
      setLoaiThongBao(null);
      setTimeout(() => setThongBao(null), 4000);
      return;
    }
    setDangChamCong(true);
    try {
      const result = await captureFaceDescriptor(videoElement);
      if (!result.descriptor) {
        setThongBao("Không nhận diện được khuôn mặt. Vui lòng đứng gần và thử lại.");
        setLoaiThongBao(null);
        setTimeout(() => setThongBao(null), 4000);
        return;
      }
      const response = await attendanceService.checkInWithFace({
        embedding: descriptorToArray(result.descriptor),
        type: kieu === 'in' ? 'checkin' : 'checkout',
        threshold: 0.5,
      });
      if (response.employeeId !== employee.id) {
        setThongBao("Khuôn mặt không khớp với nhân viên đang chọn.");
        setLoaiThongBao(null);
        setTimeout(() => setThongBao(null), 4000);
        return;
      }
      const eventTime = new Date(response.timestamp);
      const noiDung =
        kieu === 'in'
          ? `Check-in thành công lúc ${eventTime.toLocaleTimeString("vi-VN")} (độ khớp ${response.distance.toFixed(3)})`
          : `Check-out thành công lúc ${eventTime.toLocaleTimeString("vi-VN")} (độ khớp ${response.distance.toFixed(3)})`;
      setThongBao(noiDung);
      setLoaiThongBao(kieu);
      setTimeout(() => setThongBao(null), 4000);
      const lastCheckIn = checkInTime;
      let workedHours: number | undefined;
      const activeKey = buildActiveCheckInKey(employee.id);
      if (kieu === "in") {
        localStorage.setItem(activeKey, eventTime.toISOString());
        setCheckInTime(eventTime);
        setCheckOutTime(null);
      } else {
        if (!lastCheckIn) return;
        setCheckOutTime(eventTime);
        workedHours = calculateSimulatedHours(lastCheckIn, eventTime);
        localStorage.removeItem(activeKey);
        setCheckInTime(null);
      }

      void attendanceService.saveAttendanceEvent({
        employeeId: employee.id,
        type: kieu === 'in' ? 'checkin' : 'checkout',
        timestamp: eventTime.toISOString(),
        distance: response.distance,
        threshold: response.threshold,
        source: response.source,
      });

      appendLocalAttendanceRecord(employee.id, {
        id: `${employee.id}-${eventTime.getTime()}-${kieu}`,
        type: kieu === 'in' ? 'checkin' : 'checkout',
        timestamp: eventTime.toISOString(),
        durationHours: workedHours,
      });
      await refreshAttendanceData(employee, baseSalary);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Không thể chấm công bằng khuôn mặt.";
      setThongBao(message);
      setLoaiThongBao(null);
      setTimeout(() => setThongBao(null), 4000);
    } finally {
      setDangChamCong(false);
    }
  };

  return (
    <div className="trang-cham-cong">
      <div className="khung-noi-dung-cham-cong">
        <header className="phan-dau-cham-cong">
          <h1 className="tieu-de-cham-cong">Chấm công bằng khuôn mặt</h1>
          <button
            type="button"
            className="nut-quay-lai"
            onClick={() => {
              localStorage.removeItem("attendanceEmployeeId");
              navigate('/');
            }}
          >
            Đổi tài khoản
          </button>
        </header>

        <section className="noi-dung-cham-cong">
          <div className="khoi-camera">
            <div className="khung-camera">
              <FaceAttendanceShell ref={shellRef} />
            </div>

            {thongBao && (
              <div
                className={`thong-bao ${loaiThongBao === 'in' ? 'thong-bao-thanh-cong' : 'thong-bao-thong-tin'}`}
              >
                {thongBao}
              </div>
            )}

            <div className="Nut-xac-nhan">
              <button className="nut-check-in" onClick={() => xuLyChamCong('in')} disabled={dangChamCong}>
                 {dangChamCong ? 'Đang xử lý...' : 'Check-in'}
              </button>
              <button className="nut-check-out" onClick={() => xuLyChamCong('out')} disabled={dangChamCong}>
                 {dangChamCong ? 'Đang xử lý...' : 'Check-out'}
              </button>
            </div>
          </div>

          <div className="thong-tin-nhan-vien">
            {employee ? (
              <>
                <div>
                  <p className="nhan-nho">Thông tin nhân viên</p>
                  <h2 className="ten-nhan-vien">{employee.name}</h2>
                  <p className="chuc-vu">{employee.position}</p>
                </div>
                <dl className="bang-thong-tin">
                  <div>
                    <dt>Mã nhân viên</dt>
                    <dd>{employee.code}</dd>
                  </div>
                  <div>
                    <dt>Bộ phận</dt>
                    <dd>{employee.dept}</dd>
                  </div>
                  <div>
                    <dt>Nhận diện khuôn mặt</dt>
                    <dd className={hasRegisteredFace ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                      {hasRegisteredFace ? "Đã đăng ký" : "Chưa đăng ký"}
                    </dd>
                  </div>
                  
                  <div>
                    <dt>Trạng thái</dt>
                    <dd className={loaiThongBao === 'out' ? 'trang-thai-xam' : 'trang-thai-xanh'}>
                      {loaiThongBao === 'out' ? 'Đã check-out' : 'Đang làm việc'}
                    </dd>
                  </div>
                 
                </dl>
                <div className="mt-4">
                  <button
                    type="button"
                    className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition"
                    onClick={() => setShowHistory((prev) => !prev)}
                  >
                    {showHistory
                      ? "Ẩn lịch sử & thống kê"
                      : "Xem lịch sử, chấm công & tổng lương"}
                  </button>
                </div>
                {showHistory && (
                  <div className="mt-4 space-y-4">
                    <div className="grid gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm md:grid-cols-2">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Tổng số giờ đã làm
                        </p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{monthlyHours.toFixed(2)}h</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Tổng lần chấm công
                        </p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{historyRecords.length}</p>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3 md:col-span-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Tổng tiền lương dự kiến
                        </p>
                        <p className="text-3xl font-bold text-emerald-600 mt-1 break-words">
                          {salaryInfo.projectedSalary.toLocaleString('vi-VN')}₫
                        </p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          {salaryInfo.hasBaseSalary
                            ? salaryInfo.overtimeHours > 0
                              ? `Bao gồm ${salaryInfo.overtimeHours.toFixed(2)}h làm thêm (+${salaryInfo.overtimePay.toLocaleString('vi-VN')}₫)`
                              : 'Đã đủ 40 giờ, hiển thị lương cơ bản'
                            : 'Chưa đủ 40 giờ để nhận lương cơ bản'}
                        </p>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                      <p className="text-sm font-semibold text-slate-700 mb-3">Lịch sử chấm công gần đây</p>
                      {historyRecords.length === 0 ? (
                        <p className="text-sm text-slate-500">Chưa có dữ liệu chấm công.</p>
                      ) : (
                        <ul className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          {historyRecords.slice(0, 8).map((record) => {
                            const time = new Date(record.timestamp);
                            return (
                              <li
                                key={record.id}
                                className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2 text-sm"
                              >
                                <div>
                                  <p className="font-semibold text-slate-900">
                                    {record.type === 'checkin' ? 'Check-in' : 'Check-out'}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {time.toLocaleDateString('vi-VN')} • {time.toLocaleTimeString('vi-VN')}
                                  </p>
                                </div>
                                {typeof record.durationHours === 'number' && record.durationHours > 0 && (
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
                )}
              </>
            ) : (
              <p>
                Không tìm thấy thông tin đăng nhập. Vui lòng quay lại trang chủ và đăng nhập lại để chấm công.
              </p>
            )}
          </div>
        </section>

        <footer className="chan-trang-cham-cong">
          <Link to="/" className="nut-quay-lai">
            ← Quay lại trang chủ
          </Link>
         
        </footer>
      </div>
    </div>
  );
};

export default FaceAttendancePage;

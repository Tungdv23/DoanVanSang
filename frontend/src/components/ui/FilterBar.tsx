
import { Input } from "./Input";
import { Select } from "./Select";

type FilterBarProps = {
  q: string;
  onQueryChange: (value: string) => void;
  dept: string;
  onDeptChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
};

export function FilterBar({
  q,
  onQueryChange,
  dept,
  onDeptChange,
  status,
  onStatusChange,
}: FilterBarProps) {
  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1fr)]">
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          🔍
        </span>
        <Input
          placeholder="Tìm theo tên, mã nhân viên..."
          value={q}
          onChange={(e) => onQueryChange(e.target.value)}
          className="rounded-2xl border-slate-200 bg-slate-50 pl-12 py-3 text-sm"
        />
      </div>
      <div>
        <Select
          value={dept}
          onChange={(e) => onDeptChange(e.target.value)}
          className="rounded-2xl border-slate-200 bg-white py-3 text-sm text-slate-600"
        >
          <option value="all">Tất cả phòng ban</option>
          <option value="Phòng Kinh Doanh">Phòng Kinh Doanh</option>
          <option value="Trưởng phòng">Ban Giám Đốc</option>
          <option value="Chăm sóc KH">Chăm sóc KH</option>
        </Select>
      </div>
      <div>
        <Select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="rounded-2xl border-slate-200 bg-white py-3 text-sm text-slate-600"
        >
          <option value="all">Tất cả chức vụ</option>
          <option value="active">Hoạt động</option>
          <option value="inactive">Ngưng</option>
        </Select>
      </div>
    </div>
  );
}


import { Input } from "./Input";
import { Select } from "./Select";

type EmployeeFilterProps = {
  q: string;
  onQueryChange: (value: string) => void;
  dept: string;
  onDeptChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
};

export function EmployeeFilter({ q, onQueryChange, dept, onDeptChange, status, onStatusChange }: EmployeeFilterProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="md:col-span-2">
        <Input
          placeholder="Tìm theo tên, mã nhân viên..."
          value={q}
          onChange={(e) => onQueryChange(e.target.value)}
        />
      </div>
      <div>
        <Select value={dept} onChange={(e) => onDeptChange(e.target.value)}>
          <option value="all">Tất cả phòng ban</option>
          <option value="Phòng Kinh Doanh">Phòng Kinh Doanh</option>
          <option value="Trưởng phòng">Trưởng phòng</option>
          <option value="Chăm sóc KH">Chăm sóc KH</option>
        </Select>
      </div>
      <div>
        <Select value={status} onChange={(e) => onStatusChange(e.target.value)}>
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="inactive">Ngưng</option>
        </Select>
      </div>
    </div>
  );
}
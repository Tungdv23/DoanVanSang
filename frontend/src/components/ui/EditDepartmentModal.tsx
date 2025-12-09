import { useState, useEffect, type FormEvent } from "react";
import { Modal } from "./Modal";
import { Input } from "./Input";
import { Select } from "./Select";
import { Button } from "./Button";
import { generateDepartmentCode } from "../../utils/employeeCode";
import type {
  DepartmentPayload,
  DepartmentViewModel,
} from "../../services/departmentsService";

export type DepartmentEditData = DepartmentPayload;

export function EditDepartmentModal({
  open,
  onClose,
  onSave,
  department,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: DepartmentEditData) => void;
  department: DepartmentViewModel | null;
}) {
  const [duLieuPhongBan, capNhatDuLieuPhongBan] = useState<DepartmentEditData>({
    maPhong: "",
    tenPhong: "",
    namThanhLap: new Date().getFullYear(),
    trangThai: "active",
  });

  useEffect(() => {
    if (department) {
      capNhatDuLieuPhongBan({
        maPhong: department.maPhong,
        tenPhong: department.tenPhong,
        namThanhLap: department.namThanhLap,
        trangThai: department.trangThai,
      });
    }
  }, [department]);

  useEffect(() => {
    capNhatDuLieuPhongBan((truocDo) => {
      if (!truocDo.tenPhong) return truocDo;
      const maTuDong = generateDepartmentCode(truocDo.tenPhong);
      if (maTuDong && truocDo.maPhong !== maTuDong) {
        return { ...truocDo, maPhong: maTuDong };
      }
      return truocDo;
    });
  }, [duLieuPhongBan.tenPhong]);

  const xuLyThayDoi = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    capNhatDuLieuPhongBan((prev) => ({
      ...prev,
      [name]: name === "namThanhLap" ? parseInt(value, 10) || 0 : value,
    }));
  };

  const xuLyGuiForm = (e: FormEvent) => {
    e.preventDefault();
    if (!duLieuPhongBan.tenPhong) {
      alert("Tên phòng không được để trống");
      return;
    }
    if (!duLieuPhongBan.maPhong) {
      alert("Không thể tạo mã phòng ban.");
      return;
    }
    onSave(duLieuPhongBan);
  };

  if (!department) return null;

  return (
    <Modal open={open} onClose={onClose} title="Chỉnh sửa phòng ban">
      <form onSubmit={xuLyGuiForm} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-black mb-2">Mã phòng</label>
          <Input name="maPhong" value={duLieuPhongBan.maPhong} readOnly className="bg-slate-50" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-black mb-2">Tên phòng</label>
          <Input name="tenPhong" value={duLieuPhongBan.tenPhong} onChange={xuLyThayDoi} required />
        </div>
        <div>
          <label className="block text-sm font-semibold text-black mb-2">Năm thành lập</label>
          <Input
            name="namThanhLap"
            type="number"
            value={duLieuPhongBan.namThanhLap}
            onChange={xuLyThayDoi}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-black mb-2">Trạng thái</label>
          <Select name="trangThai" value={duLieuPhongBan.trangThai} onChange={xuLyThayDoi}>
            <option value="active">Hoạt động</option>
            <option value="inactive">Ngưng</option>
          </Select>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="ghost" type="button" onClick={onClose}>Huỷ</Button>
          <Button type="submit">Lưu thay đổi</Button>
        </div>
      </form>
    </Modal>
  );
}

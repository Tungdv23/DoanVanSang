import { useState, type FormEvent, useEffect } from "react";
import { Modal } from "./Modal";
import { Input } from "./Input";
import { Button } from "./Button";
import { Select } from "./Select";
import { generateDepartmentCode } from "../../utils/employeeCode";
import type { DepartmentPayload } from "../../services/departmentsService";

export type NewDepartmentData = DepartmentPayload;

export function AddDepartmentModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: NewDepartmentData) => void;
}) {
  const [duLieuPhongBan, capNhatDuLieuPhongBan] = useState<NewDepartmentData>({
    maPhong: "",
    tenPhong: "",
    namThanhLap: new Date().getFullYear(),
    trangThai: "active",
  });

  useEffect(() => {
    if (open) {
      capNhatDuLieuPhongBan({
        maPhong: "",
        tenPhong: "",
        namThanhLap: new Date().getFullYear(),
        trangThai: "active",
      });
    }
  }, [open]);

  const xuLyThayDoi = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    capNhatDuLieuPhongBan((truocDo) => ({
      ...truocDo,
      [name]: name === "namThanhLap" ? parseInt(value, 10) || 0 : value,
    }));
  };

  useEffect(() => {
    capNhatDuLieuPhongBan((truocDo) => {
      if (!truocDo.tenPhong) {
        return truocDo.maPhong ? { ...truocDo, maPhong: "" } : truocDo;
      }
      const maTuDong = generateDepartmentCode(truocDo.tenPhong);
      if (maTuDong && truocDo.maPhong !== maTuDong) {
        return { ...truocDo, maPhong: maTuDong };
      }
      return truocDo;
    });
  }, [duLieuPhongBan.tenPhong]);

  const xuLyGuiForm = (e: FormEvent) => {
    e.preventDefault();
    if (!duLieuPhongBan.tenPhong) {
      alert("Vui lòng nhập Tên phòng.");
      return;
    }
    if (!duLieuPhongBan.maPhong) {
      alert("Không thể tạo mã phòng ban. Vui lòng kiểm tra tên phòng.");
      return;
    }
    onSave(duLieuPhongBan);
  };

  return (
    <Modal open={open} onClose={onClose} title="Thêm phòng ban">
      <form onSubmit={xuLyGuiForm} className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-500 mb-3">
            Thông tin cơ bản
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Mã phòng ban
              </label>
              <Input
                name="maPhong"
                value={duLieuPhongBan.maPhong}
                readOnly
                className="bg-slate-50"
                placeholder="Sẽ tự tạo từ tên phòng"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Tên phòng ban
              </label>
              <Input
                name="tenPhong"
                value={duLieuPhongBan.tenPhong}
                onChange={xuLyThayDoi}
                placeholder="VD: Phòng Kinh Doanh"
                required
              />
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-500 mb-3">
            Thông tin vận hành
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Năm thành lập
              </label>
              <Input
                name="namThanhLap"
                type="number"
                value={duLieuPhongBan.namThanhLap}
                onChange={xuLyThayDoi}
                placeholder="VD: 2023"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Trạng thái
              </label>
              <Select
                name="trangThai"
                value={duLieuPhongBan.trangThai}
                onChange={xuLyThayDoi}
              >
                <option value="active">Hoạt động</option>
                <option value="inactive">Ngưng</option>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="ghost" type="button" onClick={onClose}>
            Huỷ
          </Button>
          <Button type="submit">Lưu</Button>
        </div>
      </form>
    </Modal>
  );
}

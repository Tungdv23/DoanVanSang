import { useState, useEffect, type FormEvent } from "react";
import { Modal } from "./Modal";
import { Input } from "./Input";
import { Select } from "./Select";
import { Button } from "./Button";
import type { Position } from "./PositionPage";
import { generatePositionShortCode } from "../../utils/employeeCode";

export type PositionEditData = {
  maChucVu: string;
  tenChucVu: string;
  moTa: string;
  quyenHan: string[];
  trangThai: "active" | "inactive";
};

export function EditPositionModal({
  open,
  onClose,
  onSave,
  position,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: PositionEditData) => void;
  position: Position | null;
}) {
  const [formData, setFormData] = useState<PositionEditData>({
    maChucVu: '',
    tenChucVu: '',
    moTa: '',
    quyenHan: [],
    trangThai: 'active',
  });
  const [permissionInput, setPermissionInput] = useState("");

  useEffect(() => {
    if (position) {
      setFormData({
        maChucVu: position.maChucVu,
        tenChucVu: position.tenChucVu,
        moTa: position.moTa ?? "",
        quyenHan: Array.isArray(position.quyenHan) ? position.quyenHan : [],
        trangThai: position.trangThai,
      });
      setPermissionInput("");
    }
  }, [position]);

  useEffect(() => {
    setFormData((prev) => {
      const code = generatePositionShortCode(prev.tenChucVu);
      if (prev.maChucVu === code) return prev;
      return { ...prev, maChucVu: code };
    });
  }, [formData.tenChucVu]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddPermission = () => {
    if (!permissionInput.trim()) return;
    setFormData((prev) => ({
      ...prev,
      quyenHan: [...prev.quyenHan, permissionInput.trim()],
    }));
    setPermissionInput("");
  };

  const handleRemovePermission = (permission: string) => {
    setFormData((prev) => ({
      ...prev,
      quyenHan: prev.quyenHan.filter((item) => item !== permission),
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.tenChucVu) return alert("Tên chức vụ không được để trống");
    if (!formData.maChucVu) return alert("Không thể tạo mã chức vụ. Vui lòng kiểm tra lại tên.");
    onSave(formData);
  };

  if (!position) return null;

  return (
    <Modal open={open} onClose={onClose} title="Chỉnh sửa chức vụ">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-black mb-2">Mã chức vụ</label>
            <Input name="maChucVu" value={formData.maChucVu} readOnly className="bg-slate-50" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-black mb-2">Tên chức vụ</label>
            <Input name="tenChucVu" value={formData.tenChucVu} onChange={handleChange} required />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-black mb-2">Mô tả công việc</label>
          <textarea
            name="moTa"
            value={formData.moTa}
            onChange={handleChange}
            rows={3}
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Cập nhật mô tả trách nhiệm của chức vụ"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-black mb-2">Trạng thái</label>
          <Select name="trangThai" value={formData.trangThai} onChange={handleChange}>
            <option value="active">Hoạt động</option>
            <option value="inactive">Ngưng</option>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-black mb-2">Quyền hạn</label>
          <div className="flex gap-2">
            <Input
              value={permissionInput}
              onChange={(e) => setPermissionInput(e.target.value)}
              placeholder="VD: Duyệt chấm công"
            />
            <Button type="button" onClick={handleAddPermission}>
              Thêm
            </Button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {formData.quyenHan.length ? (
              formData.quyenHan.map((permission) => (
                <span
                  key={permission}
                  className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                >
                  {permission}
                  <button
                    type="button"
                    className="ml-2 text-slate-500 hover:text-slate-700"
                    onClick={() => handleRemovePermission(permission)}
                  >
                    ✕
                  </button>
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400">Chưa có quyền hạn nào</span>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="ghost" type="button" onClick={onClose}>
            Huỷ
          </Button>
          <Button type="submit">Lưu thay đổi</Button>
        </div>
      </form>
    </Modal>
  );
}

import { useState, type FormEvent, useEffect } from "react";
import { Modal } from "./Modal";
import { Input } from "./Input";
import { Button } from "./Button";
import { Select } from "./Select";
import { generatePositionShortCode } from "../../utils/employeeCode";

export type NewPositionData = {
  maChucVu: string;
  tenChucVu: string;
  moTa: string;
  quyenHan: string[];
  trangThai: "active" | "inactive";
};

export function AddPositionModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: NewPositionData) => void;
}) {
  const [formData, setFormData] = useState<NewPositionData>({
    maChucVu: "",
    tenChucVu: "",
    moTa: "",
    quyenHan: [],
    trangThai: "active",
  });
  const [permissionInput, setPermissionInput] = useState("");

  useEffect(() => {
    if (open) {
      setFormData({
        maChucVu: "",
        tenChucVu: "",
        moTa: "",
        quyenHan: [],
        trangThai: "active",
      });
      setPermissionInput("");
    }
  }, [open]);

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
    setFormData((prev) => ({ ...prev, [name]: value }));
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
    if (!formData.tenChucVu) {
      alert("Vui lòng nhập Tên chức vụ.");
      return;
    }
    if (!formData.maChucVu) {
      alert("Không thể tạo mã chức vụ. Vui lòng kiểm tra lại tên chức vụ.");
      return;
    }
    onSave(formData);
  };

  return (
    <Modal open={open} onClose={onClose} title="Thêm chức vụ">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-500 mb-3">
            Thông tin cơ bản
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Mã chức vụ
              </label>
              <Input
                name="maChucVu"
                value={formData.maChucVu}
                readOnly
                className="bg-slate-50"
                placeholder="Sẽ tự động tạo theo tên chức vụ"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Tên chức vụ
              </label>
              <Input
                name="tenChucVu"
                value={formData.tenChucVu}
                onChange={handleChange}
                placeholder="VD: Trưởng phòng"
                required
              />
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-500 mb-3">
            Mô tả
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-black mb-2">
                Mô tả công việc
              </label>
              <textarea
                name="moTa"
                value={formData.moTa}
                onChange={handleChange}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Mô tả ngắn về nhiệm vụ của chức vụ này..."
              />
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-500 mb-3">
            Quyền hạn
          </p>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={permissionInput}
                onChange={(e) => setPermissionInput(e.target.value)}
                placeholder="VD: Thêm nhân viên"
              />
              <Button type="button" onClick={handleAddPermission}>
                Thêm
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.quyenHan.length > 0 ? (
                formData.quyenHan.map((permission) => (
                  <span
                    key={permission}
                    className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700"
                  >
                    {permission}
                    <button
                      type="button"
                      className="ml-2 text-xs text-slate-500 hover:text-slate-700"
                      onClick={() => handleRemovePermission(permission)}
                    >
                      ✕
                    </button>
                  </span>
                ))
              ) : (
                <p className="text-xs text-slate-400">
                  Chưa thêm quyền hạn nào. Nhập quyền hạn và nhấn &quot;Thêm&quot;.
                </p>
              )}
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-500 mb-3">
            Trạng thái
          </p>
          <Select
            name="trangThai"
            value={formData.trangThai}
            onChange={handleChange}
            className="rounded-2xl border-slate-200 bg-white py-3 text-sm text-slate-600"
          >
            <option value="active">Hoạt động</option>
            <option value="inactive">Ngưng</option>
          </Select>
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

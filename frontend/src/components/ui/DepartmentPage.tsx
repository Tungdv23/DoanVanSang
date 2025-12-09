import { useMemo, useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { Button } from "./Button";
import { DepartmentTable } from "./DepartmentTable";
import { AddDepartmentModal, type NewDepartmentData } from "./AddDepartmentModal";
import { EditDepartmentModal, type DepartmentEditData } from "./EditDepartmentModal";
import { Input } from "./Input";
import type { Employee } from "./EmployeePage";
import { EmployeesListModal } from "./EmployeesListModal";
import { generateDepartmentCode } from "../../utils/employeeCode";
import {
  departmentsService,
  type DepartmentViewModel,
  type DepartmentPayload,
} from "../../services/departmentsService";

type ThongBao = {
  id: string;
  noiDung: string;
};

export default function DepartmentPage() {
  const duLieuKhoiTao = useMemo<DepartmentViewModel[]>(
    () => [
      { id: "1", maPhong: "PKD", tenPhong: "Phòng Kinh Doanh", namThanhLap: 2020, trangThai: "active", visible: true },
      { id: "2", maPhong: "PNS", tenPhong: "Phòng Nhân Sự", namThanhLap: 2019, trangThai: "active", visible: true },
      { id: "3", maPhong: "PKT", tenPhong: "Phòng Kế Toán", namThanhLap: 2018, trangThai: "inactive", visible: true },
    ],
    []
  );

  const [danhSachPhongBan, capNhatDanhSachPhongBan] = useState<DepartmentViewModel[]>(() =>
    departmentsService.loadLocal(duLieuKhoiTao)
  );
  const [tuKhoa, capNhatTuKhoa] = useState("");
  const [moThemPhongBan, datMoThemPhongBan] = useState(false);
  const [danhSachThongBao, capNhatThongBao] = useState<ThongBao[]>([]);
  const [phongDangSua, capNhatPhongDangSua] = useState<DepartmentViewModel | null>(null);
  const [trangHienTai, capNhatTrangHienTai] = useState(1);
  const [soNhanSuTheoPhong, capNhatSoNhanSuTheoPhong] = useState<Record<string, number>>({});
  const [moCuaSoNhanSu, datMoCuaSoNhanSu] = useState(false);
  const [nhanSuPhongChon, capNhatNhanSuPhongChon] = useState<Employee[]>([]);
  const [phongDuocChon, capNhatPhongDuocChon] = useState<DepartmentViewModel | null>(null);
  const SO_MUC_MOI_TRANG = 4;

  const capNhatVaLuuLocal = (producer: (rows: DepartmentViewModel[]) => DepartmentViewModel[]) => {
    capNhatDanhSachPhongBan((dsCu) => {
      const next = producer(dsCu);
      departmentsService.saveLocal(next);
      return next;
    });
  };

  useEffect(() => {
    let hoatDong = true;
    const dongBoPhongBan = async () => {
      try {
        const remote = await departmentsService.list(duLieuKhoiTao);
        if (hoatDong) {
          capNhatDanhSachPhongBan(remote);
        }
      } catch (error) {
        console.warn("Không thể đồng bộ phòng ban từ backend:", error);
      }
    };
    dongBoPhongBan();
    return () => {
      hoatDong = false;
    };
  }, [duLieuKhoiTao]);

  useEffect(() => {
    const dongBoNhanSuTheoPhong = () => {
      try {
        const raw = localStorage.getItem("employeesData");
        if (!raw) {
          capNhatSoNhanSuTheoPhong({});
          return;
        }
        const employees = JSON.parse(raw) as { dept: string }[];
        const counts = employees.reduce<Record<string, number>>((acc, emp) => {
          acc[emp.dept] = (acc[emp.dept] || 0) + 1;
          return acc;
        }, {});
        capNhatSoNhanSuTheoPhong(counts);
      } catch (error) {
        console.warn("Không đọc được employeesData:", error);
        capNhatSoNhanSuTheoPhong({});
      }
    };

    dongBoNhanSuTheoPhong();
    window.addEventListener("storage", dongBoNhanSuTheoPhong);
    window.addEventListener("focus", dongBoNhanSuTheoPhong);
    return () => {
      window.removeEventListener("storage", dongBoNhanSuTheoPhong);
      window.removeEventListener("focus", dongBoNhanSuTheoPhong);
    };
  }, []);

  const danhSachDaLoc = useMemo(() => {
    const ketQua = danhSachPhongBan.filter((phong) => {
      if (
        tuKhoa &&
        !(
          phong.tenPhong.toLowerCase().includes(tuKhoa.toLowerCase()) ||
          phong.maPhong.toLowerCase().includes(tuKhoa.toLowerCase())
        )
      )
        return false;
      return true;
    });
    const tongTrang = Math.max(1, Math.ceil(ketQua.length / SO_MUC_MOI_TRANG));
    if (trangHienTai > tongTrang) {
      capNhatTrangHienTai(tongTrang);
    }
    return ketQua;
  }, [danhSachPhongBan, tuKhoa, trangHienTai]);

  const taoMaPhongBan = (tenPhong: string) => generateDepartmentCode(tenPhong);

  const themPhongBan = async (phongMoi: NewDepartmentData) => {
    const maPhong = phongMoi.maPhong || taoMaPhongBan(phongMoi.tenPhong);
    const payload: DepartmentPayload = {
      ...phongMoi,
      maPhong,
    };
    try {
      const created = await departmentsService.create(payload);
      capNhatVaLuuLocal((dsCu) => [created, ...dsCu]);
    } catch (error) {
      console.warn("Không thể tạo phòng ban qua API, lưu local.", error);
      const fallback = departmentsService.createLocalRecord(payload, uuidv4);
      capNhatVaLuuLocal((dsCu) => [fallback, ...dsCu]);
    }
    hienThongBao("Đã thêm phòng ban");
    datMoThemPhongBan(false);
  };

  const capNhatPhongBan = async (duLieuMoi: DepartmentEditData) => {
    if (!phongDangSua) return;
    const payload: DepartmentPayload = {
      ...duLieuMoi,
      maPhong: duLieuMoi.maPhong || taoMaPhongBan(duLieuMoi.tenPhong),
    };
    capNhatVaLuuLocal((dsCu) =>
      dsCu.map((phong) =>
        phong.id === phongDangSua.id ? { ...phong, ...payload } : phong
      )
    );
    try {
      const updated = await departmentsService.update(phongDangSua.id, payload);
      capNhatVaLuuLocal((dsCu) =>
        dsCu.map((phong) =>
          phong.id === phongDangSua.id ? { ...phong, ...updated, visible: phong.visible } : phong
        )
      );
    } catch (error) {
      console.warn("Không thể cập nhật phòng ban qua API, giữ dữ liệu local.", error);
    }
    hienThongBao("Đã cập nhật phòng ban");
    capNhatPhongDangSua(null);
  };

  const xoaPhongBan = async (id: string) => {
    const xacNhan = window.confirm("Bạn có chắc chắn muốn xoá phòng ban này?");
    if (!xacNhan) return;
    capNhatVaLuuLocal((dsCu) => dsCu.filter((phong) => phong.id !== id));
    try {
      await departmentsService.remove(id);
    } catch (error) {
      console.warn("Không thể xoá phòng ban trên backend, đã xoá local.", error);
    }
    hienThongBao("Đã xóa phòng ban");
  };

  const hienThongBao = (noiDung: string) => {
    const idThongBao = uuidv4();
    capNhatThongBao((dsCu) => [...dsCu, { id: idThongBao, noiDung }]);
    setTimeout(() => {
      capNhatThongBao((dsCu) => dsCu.filter((tb) => tb.id !== idThongBao));
    }, 3000);
  };

  const chonPhongBanSua = (phong: DepartmentViewModel) => {
    capNhatPhongDangSua(phong);
  };

  const xemNhanSuPhong = (phong: DepartmentViewModel) => {
    capNhatPhongDuocChon(phong);
    try {
      const duLieuNhanVien = localStorage.getItem("employeesData");
      if (!duLieuNhanVien) {
        capNhatNhanSuPhongChon([]);
      } else {
        const nhanVien = JSON.parse(duLieuNhanVien) as Employee[];
        const nhanSuTheoPhong = nhanVien.filter((nv) => nv.dept === phong.tenPhong);
        capNhatNhanSuPhongChon(nhanSuTheoPhong);
      }
    } catch (error) {
      console.warn("Không đọc được employeesData:", error);
      capNhatNhanSuPhongChon([]);
    }
    datMoCuaSoNhanSu(true);
  };

  const dongCuaSoNhanSu = () => {
    datMoCuaSoNhanSu(false);
    capNhatNhanSuPhongChon([]);
    capNhatPhongDuocChon(null);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Phòng ban</h1>
          <Button onClick={() => datMoThemPhongBan(true)}>+ Thêm phòng ban</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="md:col-span-2">
                <Input
                  placeholder="Tìm theo tên, mã phòng..."
                  value={tuKhoa}
                  onChange={(e) => {
                    capNhatTrangHienTai(1);
                    capNhatTuKhoa(e.target.value);
                  }}
                />
            </div>
        </div>

        <DepartmentTable
          data={danhSachDaLoc
            .slice((trangHienTai - 1) * SO_MUC_MOI_TRANG, trangHienTai * SO_MUC_MOI_TRANG)
            .map((dept) => ({
              ...dept,
              nhanSu: soNhanSuTheoPhong[dept.tenPhong] || 0,
            }))}
          totalCount={danhSachDaLoc.length}
          page={trangHienTai}
          pageSize={SO_MUC_MOI_TRANG}
          pageCount={Math.max(1, Math.ceil(danhSachDaLoc.length / SO_MUC_MOI_TRANG))}
          onPageChange={capNhatTrangHienTai}
          onDelete={xoaPhongBan}
          onEdit={chonPhongBanSua}
          onViewEmployees={xemNhanSuPhong}
        />

        <div className="fixed bottom-4 right-4 space-y-2 z-50">
          {danhSachThongBao.map((thongBao) => (
            <div
              key={thongBao.id}
              className="bg-gray-800 text-white py-2 px-4 rounded-lg shadow-lg animate-fade-in-out"
            >
              {thongBao.noiDung}
            </div>
          ))}
        </div>

        <EmployeesListModal
          open={moCuaSoNhanSu}
          onClose={dongCuaSoNhanSu}
          title={
            phongDuocChon
              ? `Nhân sự - ${phongDuocChon.tenPhong}`
              : "Nhân sự phòng ban"
          }
          employees={nhanSuPhongChon}
          description={
            nhanSuPhongChon.length
              ? `Có ${nhanSuPhongChon.length} nhân viên thuộc ${phongDuocChon?.tenPhong ?? "phòng ban"}.`
              : undefined
          }
          emptyDescription="Chưa có nhân viên nào trong phòng ban này."
        />

        <AddDepartmentModal
          open={moThemPhongBan}
          onClose={() => datMoThemPhongBan(false)}
          onSave={themPhongBan}
        />

        <EditDepartmentModal
          open={!!phongDangSua}
          onClose={() => capNhatPhongDangSua(null)}
          department={phongDangSua}
          onSave={capNhatPhongBan}
        />

      </div>
    </div>
  );
}

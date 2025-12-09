import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import anhTrangChu from '@/assets/anhtrangchu.png';
import anhDangNhap from '@/assets/dangnhap.png';
import { adminAccount, verifyAdminLogin } from '@/services/mocks/auth';
import { employeesService } from '@/services/employeesService';
import './welcome.css';

const menuItems = ['Tài liệu', 'Hỗ trợ', 'Đăng nhập'];

const TrangChaoMung = () => {
  const navigate = useNavigate();
  const [moDangNhapQuanTri, setMoDangNhapQuanTri] = useState(false);
  const [moDangNhapChamCong, setMoDangNhapChamCong] = useState(false);
  const [email, setEmail] = useState(adminAccount.email);
  const [matKhau, setMatKhau] = useState(adminAccount.password);
  const [thongBaoLoi, setThongBaoLoi] = useState<string | null>(null);
  const [taiKhoanNhanVien, setTaiKhoanNhanVien] = useState('');
  const [matKhauNhanVien, setMatKhauNhanVien] = useState('');
  const [thongBaoLoiNhanVien, setThongBaoLoiNhanVien] = useState<string | null>(null);
  const [dangDongBoNhanVien, setDangDongBoNhanVien] = useState(false);

  const xuLyDangNhap = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (verifyAdminLogin(email, matKhau)) {
      setThongBaoLoi(null);
      setMoDangNhapQuanTri(false);
      navigate('/admin');
    } else {
      setThongBaoLoi('Email hoặc mật khẩu không đúng.');
    }
  };

  const xuLyDangNhapChamCong = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDangDongBoNhanVien(true);
    try {
      const timThay = await employeesService.authenticate(taiKhoanNhanVien, matKhauNhanVien);
      if (timThay && timThay.id) {
        localStorage.setItem('attendanceEmployeeId', timThay.id);
        setThongBaoLoiNhanVien(null);
        setMoDangNhapChamCong(false);
        navigate('/attendance');
        return;
      }
      setThongBaoLoiNhanVien('Tài khoản hoặc mật khẩu không đúng.');
    } catch (error) {
      console.warn('Không xác thực được nhân viên trước khi đăng nhập.', error);
      setThongBaoLoiNhanVien('Không thể kiểm tra tài khoản. Vui lòng thử lại.');
    } finally {
      setDangDongBoNhanVien(false);
    }
  };

  const moFormChamCong = () => {
    setTaiKhoanNhanVien('');
    setMatKhauNhanVien('');
    setThongBaoLoiNhanVien(null);
    setMoDangNhapChamCong(true);
  };

  useEffect(() => {
    let active = true;
    setDangDongBoNhanVien(true);
    (async () => {
      try {
        await employeesService.list();
      } catch (error) {
        console.warn('Không đồng bộ được danh sách nhân viên khi mở trang.', error);
      } finally {
        if (active) setDangDongBoNhanVien(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="nen-trang-chao">
      <div className="khung-noi-dung-trang">
        <header className="than-dieu-huong">
          <div className="cum-can-giua">
            <div className="logo-hr">H</div>
            <div className="chu-logo">HR Pro</div>
          </div>
          
        </header>

        <section className="phan-anh-hung">
          <div className="hang-chao-mung">
            <div className="noi-dung-anh-hung">
              <p className="tieu-de-phu">HR Pro Suite</p>
              <h1 className="tieu-de-chao">Chào mừng đến HR Pro</h1>
              <p className="doan-mo-ta-chao">
                Chấm công FaceID, tính lương tự động, quản trị nhân sự tập trung. 
              </p>
              
            </div>
            <div className="hop-anh-thu-nho">
              <div className="the-thong-tin-nhan-vien">
              
                <div className="the-nhan-dien-khuon-mat">
                  <div className="dong-nhan-dien">
                    <span>Nhận diện khuôn mặt</span>
                    <span>Confidence 98%</span>
                  </div>
                  <img src={anhTrangChu} alt="Nhận diện" className="anh-nhan-dien" />
                </div>
              </div>
            </div>
          </div>

          <div className="vung-the-chuc-nang">
            <div className="the-cham-cong">
              <div className="tieu-de-the">
                <p className="dong-tieu-de-the">Chấm công - dành cho Nhân viên</p>
                
              </div>
              <h3 className="ten-the">Chấm công</h3>
              <p className="mo-ta-the">Check-in/Check-out bằng nhận diện khuôn mặt, nhanh và chính xác.</p>
              <div className="vung-nut-hanh-dong">
                <button
                  className="nut-trang-cham-cong"
                  onClick={moFormChamCong}
                >
                  Chấm công
                </button>
               
              </div>
            </div>
            <div className="the-quan-tri">
              <div className="tieu-de-the">
                <p className="dong-tieu-de-the">Quản trị - dành cho Quản lý</p>
                
              </div>
              <h3 className="ten-the">Quản trị</h3>
              <p className="mo-ta-the">Lịch phòng ban, chức vụ, lương, báo cáo theo thời gian thực.</p>
              <div className="vung-nut-hanh-dong">
                <button className="nut-trang-quan-tri" onClick={() => setMoDangNhapQuanTri(true)}>
                  Đến bảng Quản trị
                </button>
                
              </div>
            </div>
          </div>
        </section>

     

     

        {moDangNhapQuanTri && (
          <div className="lop-phu-dang-nhap" role="dialog" aria-modal="true">
            <div className="hop-dang-nhap">
              <div className="phan-chao-dang-nhap">
                <p className="tieu-de-dang-nhap">HR Pro Admin</p>
                <img src={anhDangNhap} alt="Mô tả đăng nhập" className="anh-dang-nhap" />
              </div>
              <div className="cot-dang-nhap">
                <button
                  type="button"
                  className="nut-dong-modal"
                  onClick={() => setMoDangNhapQuanTri(false)}
                  aria-label="Đóng đăng nhập"
                >
                  ✕
                </button>
                <div className="phan-dau-form">
                  <p className="nhan-form">Chào mừng quay lại</p>
                  <h2 className="tieu-de-form">Đăng nhập quản trị</h2>
                </div>
                <form className="form-dang-nhap" onSubmit={xuLyDangNhap}>
                  <label className="nhan-truong">
                    Email
                    <input
                      className="truong-nhap"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="admin@hrpro.vn"
                    />
                  </label>
                  <label className="nhan-truong">
                    Mật khẩu
                    <input
                      className="truong-nhap"
                      type="password"
                      value={matKhau}
                      onChange={(event) => setMatKhau(event.target.value)}
                      placeholder="••••••••"
                    />
                  </label>
                  {thongBaoLoi && <p className="thong-bao-loi">{thongBaoLoi}</p>}
                  <div className="dong-tuy-chon">
                   
                  </div>
                  <button type="submit" className="nut-dang-nhap">
                    Đăng nhập
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
        {moDangNhapChamCong && (
          <div className="lop-phu-dang-nhap" role="dialog" aria-modal="true">
            <div className="hop-dang-nhap">
              <div className="phan-chao-dang-nhap">
                <p className="tieu-de-dang-nhap">HR Pro Attendance</p>
                <img src={anhDangNhap} alt="Đăng nhập nhân viên" className="anh-dang-nhap" />
              </div>
              <div className="cot-dang-nhap">
                <button
                  type="button"
                  className="nut-dong-modal"
                  onClick={() => setMoDangNhapChamCong(false)}
                  aria-label="Đóng đăng nhập nhân viên"
                >
                  ✕
                </button>
                <div className="phan-dau-form">
                  <p className="nhan-form">Xin chào</p>
                  <h2 className="tieu-de-form">Đăng nhập chấm công</h2>
                </div>
                <form className="form-dang-nhap" onSubmit={xuLyDangNhapChamCong}>
                  <label className="nhan-truong">
                    Tài khoản
                    <input
                      className="truong-nhap"
                      type="text"
                      value={taiKhoanNhanVien}
                      onChange={(event) => setTaiKhoanNhanVien(event.target.value)}
                      placeholder="VD: minhanh"
                      disabled={dangDongBoNhanVien}
                    />
                  </label>
                  <label className="nhan-truong">
                    Mật khẩu
                    <input
                      className="truong-nhap"
                      type="password"
                      value={matKhauNhanVien}
                      onChange={(event) => setMatKhauNhanVien(event.target.value)}
                      placeholder="••••••••"
                      disabled={dangDongBoNhanVien}
                    />
                  </label>
                  {thongBaoLoiNhanVien && <p className="thong-bao-loi">{thongBaoLoiNhanVien}</p>}
                  {dangDongBoNhanVien && (
                    <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
                      Đang đồng bộ dữ liệu nhân viên...
                    </p>
                  )}
                  <button type="submit" className="nut-dang-nhap" disabled={dangDongBoNhanVien}>
                    {dangDongBoNhanVien ? 'Đang kiểm tra...' : 'Đăng nhập & chấm công'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrangChaoMung;

import { useState, Suspense } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import "./admin.css";

const tabs = [
  { id: "employees", label: "Nhân viên", path: "/admin" },
  { id: "departments", label: "Phòng ban", path: "/admin/departments" },
  { id: "positions", label: "Chức vụ", path: "/admin/positions" },
  { id: "reports", label: "Báo cáo", path: "/admin/reports/income" },
];

export default function AdminLayout() {
  const location = useLocation();

  return (
    <div className="nen-quan-tri">
      <header className="phan-dau-quan-tri">
        <div className="thanh-logo-va-menu">
          <Link to="/" className="cum-logo-quan-tri" aria-label="Quay về trang chào mừng">
            <div className="logo-quan-tri">H</div>
            <div className="ten-logo-quan-tri">HR Pro</div>
          </Link>
          <nav className="thanh-dieu-huong-quan-tri">
            {tabs.map((tab) => (
                <Link
                  key={tab.id}
                  to={tab.path}
                  className={`nut-chuyen-tab ${
                    (tab.path === '/admin' && location.pathname === '/admin') ||
                    (tab.path !== '/admin' && location.pathname.startsWith(tab.path))
                      ? "nut-tab-dang-chon"
                      : "nut-tab-thuong"
                  }`}
                >
                  {tab.label}
                </Link>
            ))}
          </nav>
        </div>
        <nav className="thanh-dieu-huong-quan-tri-mobile">
          {tabs.map((tab) => (
            <Link key={tab.id} to={tab.path} className={`nut-chuyen-tab ${
              (tab.path === '/admin' && location.pathname === '/admin') || (tab.path !== '/admin' && location.pathname.startsWith(tab.path)) ? "nut-tab-dang-chon" : "nut-tab-thuong"
            }`}>
              {tab.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="noi-dung-quan-tri">
        <Suspense fallback={<div>Đang tải...</div>}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}

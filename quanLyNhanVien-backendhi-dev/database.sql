-- SQL SCRIPT HOÀN CHỈNH CHO DỰ ÁN HR PRO (Node.js + MySQL)
-- Tạo database, bảng, ràng buộc, và seed dữ liệu.

-- TÊN DATABASE
CREATE DATABASE IF NOT EXISTS hr_pro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hr_pro;

-- 1. PHÒNG BAN
CREATE TABLE IF NOT EXISTS departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ten_phong VARCHAR(100) NOT NULL,
    ma_phong CHAR(3) NOT NULL UNIQUE,
    nam_thanh_lap INT,
    trang_thai ENUM('active', 'inactive') DEFAULT 'active'
);

-- 2. CHỨC VỤ
CREATE TABLE IF NOT EXISTS positions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ten_chuc_vu VARCHAR(100) NOT NULL,
    ma_chuc_vu CHAR(1) NOT NULL UNIQUE,
    mo_ta TEXT,
    cap_do VARCHAR(50),
    trang_thai ENUM('active', 'inactive') DEFAULT 'active',
    quyen_han JSON
);

-- 3. NHÂN VIÊN
CREATE TABLE IF NOT EXISTS employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) UNIQUE,
    name VARCHAR(100) NOT NULL,
    dept_id INT,
    position_id INT,
    salary DECIMAL(15, 2) DEFAULT 0,
    status ENUM('active', 'inactive') DEFAULT 'active',
    photo LONGTEXT,
    tai_khoan VARCHAR(50) UNIQUE,
    mat_khau VARCHAR(255),
    face_embedding JSON,
    has_face_registered BOOLEAN DEFAULT FALSE,
    joined_at DATE,
    cap_do ENUM('STAFF', 'INTERN') DEFAULT 'STAFF',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dept_id) REFERENCES departments(id) ON DELETE RESTRICT,
    FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE RESTRICT
);

-- 4. CHẤM CÔNG
CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT,
    checkin_time DATETIME,
    checkout_time DATETIME NULL,
    total_hours FLOAT DEFAULT 0,
    date_log DATE,
    distance FLOAT NULL,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- 5. LỊCH SỬ LƯƠNG (payroll_history)
CREATE TABLE IF NOT EXISTS payroll_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    report_month INT NOT NULL,
    report_year INT NOT NULL,
    base_salary DECIMAL(15,2) DEFAULT 0,
    final_salary DECIMAL(15,2) DEFAULT 0,
    total_hours FLOAT DEFAULT 0,
    overtime_hours FLOAT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_emp_month_year (employee_id, report_month, report_year),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- 6. LƯƠNG THÁNG (monthly_payrolls) - tùy chọn
CREATE TABLE IF NOT EXISTS monthly_payrolls (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    year INT NOT NULL,
    month INT NOT NULL,
    total_hours FLOAT DEFAULT 0,
    overtime_hours FLOAT DEFAULT 0,
    base_salary DECIMAL(15,2) DEFAULT 0,
    overtime_pay DECIMAL(15,2) DEFAULT 0,
    total_pay DECIMAL(15,2) DEFAULT 0,
    status ENUM('draft','approved','paid') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_emp_year_month (employee_id, year, month),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- ==========================================================
-- SEED DATA
-- ==========================================================

-- Phòng ban
INSERT INTO departments (ten_phong, ma_phong, nam_thanh_lap, trang_thai) VALUES
('Phòng Kinh Doanh', 'PKD', 2020, 'active'),
('Phòng Nhân Sự', 'PNS', 2019, 'active'),
('Phòng Kỹ Thuật', 'PKT', 2021, 'active'),
('Phòng Marketing', 'PMK', 2022, 'active');

-- Chức vụ
INSERT INTO positions (ten_chuc_vu, ma_chuc_vu, cap_do, mo_ta, trang_thai, quyen_han) VALUES
('Giám đốc điều hành', 'G', 'ADMIN', 'Quản lý toàn bộ hoạt động công ty', 'active', '["Toàn quyền hệ thống", "Duyệt ngân sách"]'),
('Trưởng phòng', 'T', 'MANAGER', 'Quản lý nhân sự và KPI phòng ban', 'active', '["Quản lý nhân viên", "Duyệt công", "Xem báo cáo"]'),
('Nhân viên', 'N', 'STAFF', 'Thực hiện các công việc chuyên môn', 'active', '["Xem hồ sơ cá nhân", "Chấm công"]'),
('Thực tập sinh', 'S', 'INTERN', 'Hỗ trợ các công việc của phòng ban', 'active', '["Chấm công"]');

-- Tham chiếu
SET @dept_pns = (SELECT id FROM departments WHERE ma_phong = 'PNS');
SET @dept_pkt = (SELECT id FROM departments WHERE ma_phong = 'PKT');
SET @dept_pmk = (SELECT id FROM departments WHERE ma_phong = 'PMK');
SET @pos_nv = (SELECT id FROM positions WHERE ma_chuc_vu = 'N');
SET @pos_tp = (SELECT id FROM positions WHERE ma_chuc_vu = 'T');

-- Nhân viên mẫu
INSERT INTO employees (code, name, dept_id, position_id, salary, tai_khoan, mat_khau, status) VALUES
('NV001', 'Nguyễn Văn A', @dept_pns, @pos_nv, 10000000.00, 'nva', '123456', 'active'),
('TP002', 'Trần Thị B', @dept_pkt, @pos_tp, 15000000.00, 'ttb', '123456', 'active'),
('NV003', 'Lê Hoàng C', @dept_pmk, @pos_nv, 10000000.00, 'lhc', '123456', 'active');

-- Lịch sử lương (payroll_history)
INSERT INTO payroll_history (employee_id, report_month, report_year, base_salary, final_salary, total_hours, overtime_hours) VALUES
(1, 1, 2025, 10000000.00, 10000000.00, 40.00, 0.00), (1, 2, 2025, 10000000.00, 10468750.00, 45.00, 5.00),
(1, 3, 2025, 10000000.00, 10750000.00, 48.00, 8.00), (1, 4, 2025, 10000000.00, 10000000.00, 40.00, 0.00),
(1, 5, 2025, 10000000.00, 11406250.00, 55.00, 15.00), (1, 6, 2025, 10000000.00, 10000000.00, 41.00, 1.00),
(1, 7, 2025, 10000000.00, 10000000.00, 39.00, 0.00), (1, 8, 2025, 10000000.00, 10281250.00, 43.00, 3.00),
(1, 9, 2025, 10000000.00, 10562500.00, 46.00, 6.00), (1, 10, 2025, 10000000.00, 10000000.00, 40.00, 0.00),
(1, 11, 2025, 10000000.00, 10937500.00, 50.00, 10.00);

INSERT INTO payroll_history (employee_id, report_month, report_year, base_salary, final_salary, total_hours, overtime_hours) VALUES
(2, 1, 2025, 15000000.00, 15000000.00, 40.00, 0.00), (2, 2, 2025, 15000000.00, 16125000.00, 48.00, 8.00),
(2, 3, 2025, 15000000.00, 15562500.00, 44.00, 4.00), (2, 4, 2025, 15000000.00, 15000000.00, 40.00, 0.00),
(2, 5, 2025, 15000000.00, 16875000.00, 52.00, 12.00), (2, 6, 2025, 15000000.00, 16125000.00, 48.00, 8.00),
(2, 7, 2025, 15000000.00, 15000000.00, 40.00, 0.00), (2, 8, 2025, 15000000.00, 15375000.00, 42.00, 2.00),
(2, 9, 2025, 15000000.00, 16500000.00, 50.00, 10.00), (2, 10, 2025, 15000000.00, 15750000.00, 46.00, 6.00),
(2, 11, 2025, 15000000.00, 15000000.00, 40.00, 0.00);

INSERT INTO payroll_history (employee_id, report_month, report_year, base_salary, final_salary, total_hours, overtime_hours) VALUES
(3, 1, 2025, 10000000.00, 10000000.00, 40.00, 0.00), (3, 2, 2025, 10000000.00, 10000000.00, 40.00, 0.00),
(3, 3, 2025, 10000000.00, 10000000.00, 40.00, 0.00), (3, 4, 2025, 10000000.00, 10000000.00, 40.00, 0.00),
(3, 5, 2025, 10000000.00, 10281250.00, 43.00, 3.00), (3, 6, 2025, 10000000.00, 10000000.00, 40.00, 0.00),
(3, 7, 2025, 10000000.00, 10000000.00, 40.00, 0.00), (3, 8, 2025, 10000000.00, 10468750.00, 45.00, 5.00),
(3, 9, 2025, 10000000.00, 10000000.00, 40.00, 0.00), (3, 10, 2025, 10000000.00, 10000000.00, 40.00, 0.00),
(3, 11, 2025, 10000000.00, 10281250.00, 43.00, 3.00);

-- Ghi chú: nếu cần monthly_payrolls, có thể đồng bộ từ payroll_history sau này.


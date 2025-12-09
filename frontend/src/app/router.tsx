import { lazy, Suspense } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import AdminLayout from "../components/ui/AdminLayout";
import WelcomePage from "../routes/welcome";
import LoginPage from "../routes/auth/login";

const EmployeePage = lazy(() => import("../components/ui/EmployeePage"));
const DepartmentPage = lazy(() => import("../components/ui/DepartmentPage"));
const PositionPage = lazy(() => import("../components/ui/PositionPage"));
const IncomeReportPage = lazy(() => import("../routes/admin/reports/IncomeReport"));
const FaceAttendancePage = lazy(() => import("../routes/attendance/FaceAttendancePage"));
const PayrollPage = lazy(() => import("../routes/admin/payroll"));

const router = createBrowserRouter([
  {
    path: "/",
    element: <WelcomePage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: <EmployeePage />,
      },
      {
        path: "departments",
        element: <DepartmentPage />,
      },
      {
        path: "positions",
        element: <PositionPage />,
      },
      {
        path: "reports/income",
        element: <IncomeReportPage />,
      },
      {
        path: "payroll",
        element: <PayrollPage />,
      },
    ],
  },
  {
    path: "/attendance",
    element: <FaceAttendancePage />,
  },
]);

const Router = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RouterProvider router={router} />
    </Suspense>
  );
};

export default Router;

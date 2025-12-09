import { useSearchParams } from "react-router-dom";
import { PayrollCalculator } from "@/components/ui/PayrollCalculator";

const PayrollPage = () => {
  const [searchParams] = useSearchParams();
  const employeeName = searchParams.get("name");
  const employeeCode = searchParams.get("code");
  const employeeId = searchParams.get("employeeId");
  const dept = searchParams.get("dept");
  const position = searchParams.get("position");
  const salary = searchParams.get("salary");
  const hours = searchParams.get("hours");

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <PayrollCalculator
        employeeName={employeeName}
        employeeCode={employeeCode}
        employeeId={employeeId}
        dept={dept}
        position={position}
        salary={salary ? Number(salary) : undefined}
        totalHours={hours ? Number(hours) : undefined}
      />
    </div>
  );
};

export default PayrollPage;

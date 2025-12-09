import { FormEvent, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    // TODO: gọi API đăng nhập thực tế
    setTimeout(() => setLoading(false), 1200);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col lg:flex-row">
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-gray-200 bg-white text-gray-900 p-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-2xl bg-white text-gray-900 border border-gray-300 flex items-center justify-center text-xl font-semibold">
            HR
          </div>
          <div>
            <p className="text-lg font-semibold">Hệ thống quản lý nhân sự</p>
            <p className="text-sm text-gray-500">Đăng nhập để bắt đầu quản lý</p>
          </div>
        </div>
        <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <img
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=900&q=60"
            alt="Minh họa văn phòng"
            className="rounded-2xl border border-gray-100"
          />
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm space-y-6 rounded-2xl border border-gray-100 bg-white p-8 shadow-xl shadow-gray-100"
        >
          <div>
            <h1 className="text-2xl font-semibold mb-2">Đăng nhập</h1>
            <p className="text-sm text-gray-500">
              Nhập email và mật khẩu do quản trị viên cung cấp.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <Input
              type="email"
              placeholder="nhanvien@congty.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Mật khẩu
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full justify-center"
            disabled={loading}
          >
            {loading ? "Đang xử lý..." : "Đăng nhập"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;

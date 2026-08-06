import { Outlet, Link } from "react-router-dom";
import { Button, Space } from "antd";

function MainLayoutLogin() {
  return (
    <div>
      <nav className="flex justify-between items-center px-8 h-16 bg-gradient-to-r from-[#0f2744] to-[#2d6a9f]">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏖️</span>
          <span className="font-bold text-white text-lg">Resort Management System</span>
        </div>
        <Space>
          <Link to="/login">
            <Button type="primary" shape="round">Log In</Button>
          </Link>
          <Link to="/register">
            <Button shape="round">Register</Button>
          </Link>
        </Space>
      </nav>
      <Outlet />
    </div>
  );
}

export default MainLayoutLogin;

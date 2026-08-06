import { Link, useLocation } from "react-router-dom";
import logoResort from "../../assets/image/LogoResort.jpg";

export default function AuthNavbar() {
  const { pathname } = useLocation();
  const isLogin = pathname === "/login";

  return (
    <div className="fixed top-0 left-0 right-0 z-[1000] h-[60px] bg-[rgba(15,39,68,0.85)] backdrop-blur-[10px] flex items-center justify-between px-8 shadow-[0_2px_12px_rgba(0,0,0,0.3)]">

      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <img src={logoResort} alt="logo" className="w-9 h-9 rounded-full object-cover border-2 border-white/30" />
        <div>
          <div className="text-white font-bold text-[15px] leading-tight">Resort Management System</div>
          {/* <div className="text-[#7eb8f7] text-[11px]">Management System</div> */}
        </div>
      </div>

      {/* Nav links */}
      <div className="flex items-center gap-2">
        <Link to="/login">
          <div className={`px-5 py-[7px] rounded-lg font-semibold text-sm border border-white/40 transition-all duration-200
            ${isLogin ? "bg-white text-[#0f2744]" : "bg-transparent text-white"}`}>
            Sign In
          </div>
        </Link>
        <Link to="/register">
          <div className={`px-5 py-[7px] rounded-lg font-semibold text-sm border border-white/40 transition-all duration-200
            ${!isLogin ? "bg-white text-[#0f2744]" : "bg-transparent text-white"}`}>
            Register
          </div>
        </Link>
      </div>
    </div>
  );
}

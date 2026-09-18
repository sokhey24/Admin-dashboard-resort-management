import { useState, useEffect } from "react";
import { Button } from "antd";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { LockOutlined, ExclamationCircleOutlined, CheckCircleOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { request } from "../../util/request";
import AuthNavbar from "../../components/layout/AuthNavbar";
import logoResort from "../../assets/image/LogoResort.jpg";
import bgLogin from "../../assets/image/Background_loginPage.webp";

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email ?? "";
  const reset_token = location.state?.reset_token ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!email || !reset_token) navigate("/forgot-password");
  }, [email, reset_token, navigate]);

  const isMinLength = password.length >= 8;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const isMatching = password === confirm && confirm.length > 0;
  const isValid = isMinLength && hasLetter && hasNumber && isMatching;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    if (!isMinLength) { setErrorMsg("Password must be at least 8 characters."); return; }
    if (!hasLetter || !hasNumber) { setErrorMsg("Password must include letters and numbers."); return; }
    if (!isMatching) { setErrorMsg("Passwords do not match."); return; }

    setLoading(true);
    const res = await request("auth/forgot-password/reset", "post", {
      email,
      reset_token,
      password,
      password_confirmation: confirm,
    });
    setLoading(false);

    if (res?.errors) {
      setErrorMsg(res.errors.message ?? "Failed to reset password. Please try again.");
      return;
    }
    if (res?.success) {
      setSuccess(true);
      setTimeout(() => navigate("/login", { state: { email } }), 2200);
    }
  };

  const inputCls = "w-full pl-9 pr-4 py-2.5 border border-[#D9E2EC] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30";

  if (!email || !reset_token) return null;

  return (
    <div
      className="min-h-screen flex items-center justify-center pt-16 px-4 bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: `url(${bgLogin})` }}
    >
      <div className="absolute inset-0 bg-black/50" />
      <AuthNavbar />

      <div className="w-full max-w-[420px] bg-white rounded-xl shadow-2xl p-10 relative z-10">
        <div className="text-center mb-8">
          <img src={logoResort} alt="Resort Logo" className="w-16 h-16 rounded-full object-cover mx-auto mb-2" />
          <h1 className="text-2xl font-bold text-[#102A43] mt-2 mb-1">Reset Password</h1>
          <p className="text-[#829AB1] text-sm">Create a new password for {email}</p>
        </div>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-4" role="status" aria-live="polite">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircleOutlined className="text-green-500 text-3xl" />
            </div>
            <p className="text-green-600 font-semibold text-center">Password reset successfully!</p>
            <p className="text-[#829AB1] text-sm text-center">Redirecting to login…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm" role="alert">
                <ExclamationCircleOutlined className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-[#486581] mb-1">New Password</label>
              <div className="relative">
                <LockOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden />
                <input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrorMsg(""); }}
                  placeholder="Enter new password"
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-[#486581] mb-1">Confirm Password</label>
              <div className="relative">
                <LockOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden />
                <input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => { setConfirm(e.target.value); setErrorMsg(""); }}
                  placeholder="Confirm new password"
                  className={inputCls}
                />
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <p className={`flex items-center gap-1.5 ${isMinLength ? "text-green-600" : "text-gray-400"}`}>
                <span>{isMinLength ? "✓" : "○"}</span> At least 8 characters
              </p>
              <p className={`flex items-center gap-1.5 ${hasLetter && hasNumber ? "text-green-600" : "text-gray-400"}`}>
                <span>{hasLetter && hasNumber ? "✓" : "○"}</span> Letters and numbers
              </p>
              <p className={`flex items-center gap-1.5 ${isMatching ? "text-green-600" : "text-gray-400"}`}>
                <span>{isMatching ? "✓" : "○"}</span> Passwords match
              </p>
            </div>

            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={loading}
              disabled={loading || !isValid}
              className="!bg-[#FF6B00] !border-[#FF6B00] hover:!bg-[#e05e00]"
            >
              {loading ? "Resetting…" : "Reset Password"}
            </Button>

            <div className="text-center">
              <Link to="/login" className="inline-flex items-center gap-1 text-sm text-[#829AB1] hover:text-[#102A43]">
                <ArrowLeftOutlined /> Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

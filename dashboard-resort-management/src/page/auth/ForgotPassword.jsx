import { useState } from "react";
import { Button } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { MailOutlined, ExclamationCircleOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { request } from "../../util/request";
import AuthNavbar from "../../components/layout/AuthNavbar";
import logoResort from "../../assets/image/LogoResort.jpg";
import bgLogin from "../../assets/image/Background_loginPage.webp";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setErrorMsg("Please enter your email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    const res = await request("auth/forgot-password/send-otp", "post", { email: trimmed });
    setLoading(false);

    if (res?.errors) {
      setErrorMsg(res.errors.message ?? "Unable to send verification code. Please try again.");
      return;
    }
    if (res?.success) {
      setSuccess(true);
      setTimeout(() => navigate("/verify-otp", { state: { email: trimmed, masked_email: res.masked_email || null } }), 800);
    }
  };

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
          <h1 className="text-2xl font-bold text-[#102A43] mt-2 mb-1">Forgot Password</h1>
          <p className="text-[#829AB1] text-sm">Enter your registered email to receive a 6-digit verification code</p>
        </div>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-4" role="status" aria-live="polite">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-green-500 text-2xl" aria-hidden>✓</span>
            </div>
            <p className="text-green-600 font-medium text-center">Verification code sent. Redirecting…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {errorMsg && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm" role="alert">
                <ExclamationCircleOutlined className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label htmlFor="reset-email" className="block text-sm font-medium text-[#486581] mb-1">Email Address</label>
              <div className="relative">
                <MailOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden />
                <input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrorMsg(""); }}
                  placeholder="Enter your email"
                  className="w-full pl-9 pr-4 py-2.5 border border-[#D9E2EC] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30"
                />
              </div>
            </div>

            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              className="!bg-[#FF6B00] !border-[#FF6B00] hover:!bg-[#e05e00]"
            >
              {loading ? "Sending…" : "Send Verification Code"}
            </Button>

            <div className="text-center">
              <Link to="/login" className="inline-flex items-center gap-1 text-sm text-[#102A43] hover:underline">
                <ArrowLeftOutlined /> Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

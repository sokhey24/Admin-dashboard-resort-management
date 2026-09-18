import { useState, useEffect, useRef } from "react";
import { Button } from "antd";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { ExclamationCircleOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { request } from "../../util/request";
import AuthNavbar from "../../components/layout/AuthNavbar";
import logoResort from "../../assets/image/LogoResort.jpg";
import bgLogin from "../../assets/image/Background_loginPage.webp";

const OTP_LENGTH = 6;
const EXPIRY_SECONDS = 10 * 60;

const maskEmail = (email) => {
  const [local, domain] = String(email).split("@");
  if (!domain) return "***";
  const visible = local.slice(0, 1);
  const stars = "*".repeat(Math.max(1, local.length - 1));
  return `${visible}${stars}@${domain}`;
};

export default function VerifyOtp() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email ?? "";
  const [maskedEmail, setMaskedEmail] = useState(
    location.state?.masked_email || (email ? maskEmail(email) : "")
  );

  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [countdown, setCountdown] = useState(EXPIRY_SECONDS);
  const [resendCooldown, setResendCooldown] = useState(60);
  const inputRefs = useRef([]);
  const verifyingRef = useRef(false);

  useEffect(() => {
    if (!email) navigate("/forgot-password");
  }, [email, navigate]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const submitOtp = async (otp) => {
    if (verifyingRef.current || otp.length < OTP_LENGTH) return;
    verifyingRef.current = true;
    setLoading(true);
    setErrorMsg("");
    const res = await request("auth/forgot-password/verify-otp", "post", { email, otp });
    setLoading(false);
    verifyingRef.current = false;
    if (res?.errors) {
      setErrorMsg(res.errors.message ?? "Invalid verification code.");
      return;
    }
    if (res?.success && res?.reset_token) {
      navigate("/reset-password", { state: { email, reset_token: res.reset_token } });
    }
  };

  const handleDigitChange = (index, value) => {
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, "").slice(0, OTP_LENGTH);
      const next = Array(OTP_LENGTH).fill("");
      for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
      setDigits(next);
      const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1);
      inputRefs.current[focusIdx]?.focus();
      setErrorMsg("");
      if (pasted.length === OTP_LENGTH) submitOtp(pasted);
      return;
    }
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    setErrorMsg("");
    if (value && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
    const code = next.join("");
    if (code.length === OTP_LENGTH && next.every(Boolean)) submitOtp(code);
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter") {
      e.preventDefault();
      submitOtp(digits.join(""));
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setResending(true);
    setErrorMsg("");
    setSuccessMsg("");
    const res = await request("auth/forgot-password/resend-otp", "post", { email });
    setResending(false);
    if (res?.errors) {
      setErrorMsg(res.errors.message ?? "Failed to resend code.");
      return;
    }
    if (res?.success) {
      if (res.masked_email) setMaskedEmail(res.masked_email);
      setDigits(Array(OTP_LENGTH).fill(""));
      setCountdown(EXPIRY_SECONDS);
      setResendCooldown(60);
      setSuccessMsg("A new verification code has been sent.");
      inputRefs.current[0]?.focus();
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
          <h1 className="text-2xl font-bold text-[#102A43] mt-2 mb-1">Verify Your Email</h1>
          <p className="text-[#829AB1] text-sm">
            Verification code sent to:<br />
            <span className="font-medium text-[#486581]">{maskedEmail}</span>
          </p>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm" role="alert">
            <ExclamationCircleOutlined className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-green-50 border border-green-200 text-green-600 text-sm" role="status">
            {successMsg}
          </div>
        )}

        <div className="flex justify-center gap-2 mb-6" role="group" aria-label="Six-digit verification code">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              maxLength={6}
              value={d}
              aria-label={`Digit ${i + 1}`}
              onChange={(e) => handleDigitChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onFocus={(e) => e.target.select()}
              className={`w-11 h-12 text-center text-xl font-bold border-2 rounded-lg focus:outline-none transition-colors ${
                d ? "border-[#0f2744] bg-[#FF6B00]/5" : "border-[#D9E2EC]"
              } focus:border-[#0f2744]`}
            />
          ))}
        </div>

        <div className="text-center mb-5">
          {countdown > 0 ? (
            <p className="text-sm text-[#829AB1]">
              Code expires in:{" "}
              <span className={`font-mono font-semibold ${countdown < 60 ? "text-red-500" : "text-[#102A43]"}`}>
                {formatTime(countdown)}
              </span>
            </p>
          ) : (
            <p className="text-sm text-red-500 font-medium">Code has expired. Please request a new one.</p>
          )}
        </div>

        <Button
          type="primary"
          block
          size="large"
          loading={loading}
          disabled={loading || countdown <= 0}
          onClick={() => submitOtp(digits.join(""))}
          className="!bg-[#FF6B00] !border-[#FF6B00] hover:!bg-[#e05e00] mb-3"
        >
          {loading ? "Verifying…" : "Verify Code"}
        </Button>

        <div className="text-center mb-4">
          {resendCooldown > 0 ? (
            <p className="text-sm text-gray-400">Resend available in <span className="font-mono font-medium">{resendCooldown}s</span></p>
          ) : (
            <Button
              type="link"
              loading={resending}
              disabled={resending}
              onClick={handleResend}
              className="!text-[#102A43] !p-0 text-sm"
            >
              {resending ? "Sending…" : "Resend Code"}
            </Button>
          )}
        </div>

        <div className="text-center">
          <Link to="/forgot-password" className="inline-flex items-center gap-1 text-sm text-[#829AB1] hover:text-[#102A43]">
            <ArrowLeftOutlined /> Back
          </Link>
        </div>
      </div>
    </div>
  );
}

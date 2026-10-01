import { useState, useRef } from "react";
import { Form, Input, Button, Spin, Divider } from "antd";
import { UserOutlined, LockOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { request } from "../../util/request";
import { setAuth } from "../../util/auth";
import { ProfileStore } from "../../store/ProfileStore";
import { ROLES } from "../../util/useRole";
import AuthNavbar from "../../components/layout/AuthNavbar";
import logoResort from "../../assets/image/LogoResort.jpg";
import bgLogin from "../../assets/image/Background_loginPage.webp";

const getRedirectByRole = (roles) => {
  const role = Array.isArray(roles) ? roles[0] : null;
  if (role === ROLES.RESORT)           return "/resort/dashboard";
  if (role === ROLES.RESTAURANT)       return "/restaurant/dashboard";
  if (role === ROLES.RESORT_STAFF)     return "/resort/dashboard";
  if (role === ROLES.RESTAURANT_STAFF) return "/restaurant/dashboard";
  return "/dashboard";
};

const LoginPage = () => {
  const { setProfile, setAccessToken, setPermission, setRoles } = ProfileStore();
  const [loading,  setLoading]  = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [challengeToken, setChallengeToken] = useState("");
  const [form]    = Form.useForm();
  const [otpForm] = Form.useForm();
  const navigate  = useNavigate();
  const location  = useLocation();
  const resetEmail = typeof location.state?.email === "string" ? location.state.email : "";
  const verifyingRef = useRef(false);

  const completeLogin = (res) => {
    setAuth(res.access_token, res.user);
    setProfile({ ...res.user });
    setAccessToken(res.access_token);
    setPermission(res.permissions ?? []);
    setRoles(res.roles ?? []);
    if (res.user?.preferences?.theme) {
      localStorage.setItem("rms-theme", res.user.preferences.theme);
    }
    navigate(getRedirectByRole(res.roles));
  };

  const onFinish = async (values) => {
    setLoading(true);
    setErrorMsg("");

    const res = await request("auth/login", "post", {
      email:    String(values.email || "").trim().toLowerCase(),
      password: values.password,
    });

    setLoading(false);

    if (!res || res?.status === 0) {
      setErrorMsg("Cannot connect to server. Please make sure the server is running.");
      return;
    }

    if (res?.errors) {
      setErrorMsg(res.errors.message ?? "Invalid email or password.");
      const fieldErrors = Object.keys(res.errors)
        .filter((k) => k !== "message" && res.errors[k]?.help)
        .map((k) => ({ name: k, errors: [res.errors[k].help] }));
      if (fieldErrors.length) form.setFields(fieldErrors);
      return;
    }

    if (res?.two_factor_required && res?.challenge_token) {
      setChallengeToken(res.challenge_token);
      return;
    }

    if (res?.access_token) {
      completeLogin(res);
    } else {
      setErrorMsg("Login failed. Unexpected response from server.");
    }
  };

  const onVerifyTwoFactor = async (values) => {
    if (verifyingRef.current) return;
    verifyingRef.current = true;
    setLoading(true);
    setErrorMsg("");
    const raw = String(values.code || "").trim();
    const digits = raw.replace(/\D/g, "");
    const code = digits.length === 6 ? digits : raw;
    const res = await request("auth/two-factor/challenge", "post", {
      challenge_token: challengeToken,
      code,
    });
    setLoading(false);
    verifyingRef.current = false;

    if (res?.status === 401) {
      setChallengeToken("");
      otpForm.resetFields();
      setErrorMsg(res.errors?.message ?? "This verification session has expired. Please sign in again.");
      return;
    }
    if (res?.errors) {
      setErrorMsg(res.errors.message ?? "Invalid authenticator code.");
      return;
    }
    if (res?.access_token) {
      completeLogin(res);
      return;
    }
    setErrorMsg("Verification failed. Please try again.");
  };

  return (
    <Spin spinning={loading}>
      <div
        className="min-h-screen flex items-center justify-center pt-16 px-4 bg-cover bg-center bg-no-repeat relative"
        style={{ backgroundImage: `url(${bgLogin})` }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <AuthNavbar />

        <div className="w-full max-w-[420px] bg-white rounded-xl shadow-2xl p-10 relative z-10">

          {/* Header */}
          <div className="text-center mb-8">
            <img src={logoResort} alt="Resort Logo" className="w-16 h-16 rounded-full object-cover mx-auto mb-2" />
            <h2 className="text-2xl font-bold text-[#102A43] mt-2 mb-1">Resort Management</h2>
            <p className="text-[#829AB1] text-sm">Sign in to your account</p>
          </div>

          {/* Inline error banner */}
          {errorMsg && (
            <div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-[10px] bg-red-50 border border-red-200 text-red-600 text-sm">
              <ExclamationCircleOutlined className="shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {challengeToken ? (
          <Form form={otpForm} onFinish={onVerifyTwoFactor} layout="vertical" onChange={() => setErrorMsg("")}>
            <p className="text-[#486581] text-sm mb-4">
              Enter the 6-digit code from your authenticator app, or a recovery code. A new sign-in session will be created.
            </p>
            <Form.Item
              name="code"
              label="Authentication code"
              rules={[{ required: true, message: "Enter your authenticator or recovery code." }]}
            >
              <Input prefix={<LockOutlined />} placeholder="123456" size="large" autoFocus aria-label="Two-factor authentication code" />
            </Form.Item>
            <Form.Item className="!mb-3">
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="large"
                className="!bg-[#FF6B00] !border-[#FF6B00] hover:!bg-[#e05e00]"
              >
                {loading ? "Verifying…" : "Verify and sign in"}
              </Button>
            </Form.Item>
            <Button type="link" block onClick={() => { setChallengeToken(""); setErrorMsg(""); }}>
              Back to sign in
            </Button>
          </Form>
          ) : (
          <Form form={form} onFinish={onFinish} layout="vertical" onChange={() => setErrorMsg("")} initialValues={{ email: resetEmail }}>

            <Form.Item
              name="email"
              label="Email"
              rules={[{ required: true, message: "Please enter your email." }, { type: "email", message: "Please enter a valid email." }]}
            >
              <Input prefix={<UserOutlined />} placeholder="Enter your email" size="large" />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: "Please enter your password." }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Enter your password" size="large" />
            </Form.Item>

            <div className="flex justify-end -mt-4 mb-4">
              <Link to="/forgot-password" className="text-[#102A43] text-xs hover:underline">
                Forgot password?
              </Link>
            </div>

            <Form.Item className="!mb-3">
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="large"
                className="!bg-[#FF6B00] !border-[#FF6B00] hover:!bg-[#e05e00]"
              >
                {loading ? "Signing in…" : "Sign In"}
              </Button>
            </Form.Item>

            <Divider className="!my-4 !text-[#829AB1] !text-xs">or</Divider>

            <p className="text-center text-[#829AB1] text-sm mt-5">
              Don't have an account?{" "}
              <Link to="/register" className="text-[#102A43] font-semibold hover:underline">Register</Link>
            </p>

          </Form>
          )}
        </div>
      </div>
    </Spin>
  );
};

export default LoginPage;

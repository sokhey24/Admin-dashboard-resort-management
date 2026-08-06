import { useState } from "react";
import { Form, Input, Button, message, Spin, Select, DatePicker, Upload, Divider } from "antd";
import {
  UserOutlined, LockOutlined, MailOutlined,
  PhoneOutlined, UploadOutlined,
} from "@ant-design/icons";
import { useNavigate, Link } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { request } from "../../util/request";
import { setAuth } from "../../util/auth";
import { ProfileStore } from "../../store/ProfileStore";
import { ROLES } from "../../util/useRole";
import AuthNavbar from "../../components/layout/AuthNavbar";
import logoResort from "../../assets/image/LogoResort.jpg";
import bgRegister from "../../assets/image/BackgroundRegisterPage.jpg";

const getRedirectByRole = (user) => {
  const role = user?.roles?.[0]?.name;
  if (role === ROLES.RESORT)     return "/resort/dashboard";
  if (role === ROLES.RESTAURANT) return "/restaurant/dashboard";
  return "/dashboard";
};

const { Option } = Select;

export default function RegisterPage() {
  const { setProfile, setAccessToken, setPermission } = ProfileStore();
  const [loading, setLoading]   = useState(false);
  const [fileList, setFileList] = useState([]);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const handleAuthSuccess = (res, successMsg = "Account created successfully!") => {
    if (res?.errors) {
      if (res.errors.message) message.error(res.errors.message);
      const fieldErrors = Object.keys(res.errors)
        .filter((k) => k !== "message" && res.errors[k]?.help)
        .map((k) => ({ name: k, errors: [res.errors[k].help] }));
      if (fieldErrors.length) form.setFields(fieldErrors);
      return;
    }
    if (res?.access_token) {
      message.success(successMsg);
      navigate("/login");
    } else {
      message.error("Registration failed. Please try again.");
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    const formData = new FormData();
    formData.append("name",     values.name);
    formData.append("email",    values.email);
    formData.append("phone",    values.phone);
    formData.append("password", values.password);
    formData.append("password_confirmation", values.password_confirmation);
    if (values.gender)        formData.append("gender",        values.gender);
    if (values.date_of_birth) formData.append("date_of_birth", values.date_of_birth.format("YYYY-MM-DD"));
    if (values.address)       formData.append("address",       values.address);
    if (fileList[0]?.originFileObj) formData.append("profile_image", fileList[0].originFileObj);

    const res = await request("auth/register", "post", formData);
    setLoading(false);
    handleAuthSuccess(res);
  };

  const googleRegister = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      const res = await request("auth/google/token", "post", { token: tokenResponse.access_token });
      setLoading(false);
      if (res?.errors) { message.error(res.errors.message ?? "Google sign-up failed."); return; }
      if (res?.access_token) {
        setAuth(res.access_token, res.user);
        setProfile({ ...res.user });
        setAccessToken(res.access_token);
        setPermission(res.permission ?? null);
        message.success("Google sign-up successful!");
        navigate(getRedirectByRole(res.user));
      }
    },
    onError: () => message.error("Google sign-up failed. Please try again."),
  });

  return (
    <Spin spinning={loading}>
      <div
        className="min-h-screen flex items-center justify-center pt-20 pb-6 px-4 bg-cover bg-center bg-no-repeat relative"
        style={{ backgroundImage: `url(${bgRegister})` }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <AuthNavbar />

        <div className="w-full max-w-[480px] bg-white rounded-2xl shadow-2xl p-10 relative z-10">

          {/* Header */}
          <div className="text-center mb-6">
            <img src={logoResort} alt="Resort Logo" className="w-16 h-16 rounded-full object-cover mx-auto mb-2" />
            <h2 className="text-2xl font-bold text-[#0f2744] mt-2 mb-1">Create Account</h2>
            <p className="text-gray-400 text-sm">Register to Resort Management System</p>
          </div>

          {/* Google Button */}
          <button
            type="button"
            onClick={() => googleRegister()}
            className="w-full flex items-center justify-center gap-3 h-11 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-gray-700 font-medium text-sm cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.86l6.08-6.08C34.46 3.09 29.5 1 24 1 14.82 1 7.07 6.48 3.64 14.22l7.08 5.5C12.43 13.61 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.52 24.5c0-1.64-.15-3.22-.42-4.74H24v8.98h12.67c-.55 2.94-2.2 5.43-4.68 7.1l7.18 5.58C43.46 37.27 46.52 31.36 46.52 24.5z"/>
              <path fill="#FBBC05" d="M10.72 28.28A14.6 14.6 0 0 1 9.5 24c0-1.49.26-2.93.72-4.28l-7.08-5.5A23.93 23.93 0 0 0 0 24c0 3.87.93 7.53 2.56 10.76l8.16-6.48z"/>
              <path fill="#34A853" d="M24 47c5.5 0 10.12-1.82 13.5-4.94l-7.18-5.58c-1.82 1.22-4.15 1.94-6.32 1.94-6.26 0-11.57-4.11-13.28-9.72l-8.16 6.48C7.07 41.52 14.82 47 24 47z"/>
            </svg>
            Continue with Google
          </button>

          <Divider className="!my-4 !text-gray-400 !text-xs">or register with email</Divider>

          <Form form={form} onFinish={onFinish} layout="vertical" requiredMark={false}>

            <Form.Item name="name" label="Full Name"
              rules={[{ required: true, message: "Please enter your full name" }]}>
              <Input prefix={<UserOutlined />} placeholder="Enter your full name" size="large" />
            </Form.Item>

            <Form.Item name="email" label="Email"
              rules={[{ required: true, message: "Please enter your email" }, { type: "email" }]}>
              <Input prefix={<MailOutlined />} placeholder="Enter your email" size="large" />
            </Form.Item>

            <Form.Item name="phone" label="Phone Number"
              rules={[{ required: true, message: "Please enter your phone number" }]}>
              <Input prefix={<PhoneOutlined />} placeholder="e.g. 0123456789" size="large" />
            </Form.Item>

            <div className="flex gap-3">
              <Form.Item name="gender" label="Gender" className="flex-1">
                <Select placeholder="Select gender" size="large">
                  <Option value="male">Male</Option>
                  <Option value="female">Female</Option>
                  <Option value="other">Other</Option>
                </Select>
              </Form.Item>
              <Form.Item name="date_of_birth" label="Date of Birth" className="flex-1">
                <DatePicker className="w-full" size="large" placeholder="YYYY-MM-DD" />
              </Form.Item>
            </div>

            <Form.Item name="address" label="Address">
              <Input.TextArea placeholder="Enter your address (optional)" rows={2} />
            </Form.Item>

            <Form.Item name="profile_image" label="Profile Image">
              <Upload
                listType="picture" maxCount={1} beforeUpload={() => false}
                fileList={fileList} onChange={({ fileList: fl }) => setFileList(fl)}
                accept=".jpg,.jpeg,.png"
              >
                <Button icon={<UploadOutlined />}>Upload Photo</Button>
              </Upload>
            </Form.Item>

            <Form.Item name="password" label="Password"
              rules={[{ required: true, message: "Please enter a password" }, { min: 8, message: "Minimum 8 characters" }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="Minimum 8 characters" size="large" />
            </Form.Item>

            <Form.Item name="password_confirmation" label="Confirm Password"
              dependencies={["password"]}
              rules={[
                { required: true, message: "Please confirm your password" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) return Promise.resolve();
                    return Promise.reject(new Error("Passwords do not match"));
                  },
                }),
              ]}>
              <Input.Password prefix={<LockOutlined />} placeholder="Re-enter your password" size="large" />
            </Form.Item>

            <Form.Item className="!mb-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-[#0f2744] hover:bg-[#1a3a5c] text-white font-semibold rounded-lg transition-colors duration-200 cursor-pointer disabled:opacity-60"
              >
                Create Account
              </button>
            </Form.Item>

            <p className="text-center text-gray-400 text-sm">
              Already have an account?{" "}
              <Link to="/login" className="text-[#0f2744] font-semibold hover:underline">Sign In</Link>
            </p>

          </Form>
        </div>
      </div>
    </Spin>
  );
}

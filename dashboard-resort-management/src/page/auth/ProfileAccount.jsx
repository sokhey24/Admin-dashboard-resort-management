import { useEffect, useMemo, useState } from "react";
import {
  Alert, Avatar, Badge, Button, Card, DatePicker, Empty, Form, Input, Modal,
  Popconfirm, Select, Spin, Switch, Table, Tabs, Tag, Upload, message,
} from "antd";
import {
  CameraOutlined, DeleteOutlined, DesktopOutlined, HistoryOutlined,
  BellOutlined, LockOutlined, LogoutOutlined, MailOutlined, MobileOutlined, PhoneOutlined,
  SafetyOutlined, SaveOutlined, UserOutlined,
} from "@ant-design/icons";
import { useDarkMode } from "../../util/DarkModeContext";
import { ProfileStore } from "../../store/ProfileStore";
import { request } from "../../util/request";
import useRole, { ROLES } from "../../util/useRole";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const LANG_OPTIONS = [
  { value: "en", label: "English" },
  { value: "km", label: "Khmer" },
  { value: "zh", label: "Chinese" },
  { value: "th", label: "Thai" },
];

const applyFieldErrors = (form, errors) => {
  if (!errors) return;
  const fields = Object.keys(errors)
    .filter((k) => k !== "message" && errors[k]?.help)
    .map((k) => ({ name: k, errors: [errors[k].help] }));
  if (fields.length) form.setFields(fields);
};

const applyThemePref = (theme) => {
  localStorage.setItem("rms-theme", theme || "light");
  window.dispatchEvent(new CustomEvent("rms-theme-change", { detail: theme || "light" }));
};

const formatRole = (role) =>
  String(role || "user")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const formatStat = (value) => {
  if (value === null || value === undefined || value === "") return 0;
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.round(n));
};

export default function ProfileAccount() {
  const dark = useDarkMode();
  const { profile, setProfile, permission } = ProfileStore();
  const { isAdmin, hasRole } = useRole();
  const isAdminUser = isAdmin || hasRole(ROLES.ADMIN);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [activities, setActivities] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [statistics, setStatistics] = useState({});
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorSetup, setTwoFactorSetup] = useState(null);
  const [twoFactorBusy, setTwoFactorBusy] = useState(false);
  const [disableOpen, setDisableOpen] = useState(false);
  const [devicePage, setDevicePage] = useState({ current: 1, pageSize: 8 });

  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [preferencesForm] = Form.useForm();
  const [confirm2faForm] = Form.useForm();
  const [disable2faForm] = Form.useForm();

  const card = dark ? "bg-gray-800 border-gray-700" : "bg-white border-[#D9E2EC]";
  const titleCls = dark ? "text-gray-100" : "text-[#102A43]";
  const subText = dark ? "text-gray-400" : "text-[#829AB1]";
  const muted = dark ? "text-gray-500" : "text-[#829AB1]";

  const loadAll = async () => {
    setLoading(true);
    setLoadError("");
    await Promise.all([loadProfile(), loadStatistics(), loadPreferences()]);
    const store = ProfileStore.getState();
    const admin = (store.roles || []).includes(ROLES.ADMIN)
      || (Array.isArray(store.profile?.roles) && store.profile.roles.some((r) => (typeof r === "string" ? r : r?.name) === ROLES.ADMIN));
    if (admin) {
      await Promise.all([loadSessions(), loadActivities()]);
    } else {
      setSessions([]);
      setActivities([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProfile = async () => {
    const res = await request("profile", "get");
    if (res?.errors) {
      setLoadError(res.errors.message || "Failed to load profile");
      return;
    }
    if (res?.success && res?.data) {
      const current = ProfileStore.getState().profile;
      setProfile({ ...(current || {}), ...res.data });
      setTwoFactorEnabled(!!res.data.two_factor_enabled);
      profileForm.setFieldsValue({
        name: res.data.name,
        phone: res.data.phone,
        gender: res.data.gender,
        date_of_birth: res.data.date_of_birth ? dayjs(res.data.date_of_birth) : null,
        address: res.data.address,
      });
    }
  };

  const loadSessions = async () => {
    setSessionsLoading(true);
    const res = await request("profile/sessions", "get");
    setSessionsLoading(false);
    if (res?.success) setSessions(res.data?.sessions || []);
  };

  const loadActivities = async () => {
    setActivityLoading(true);
    const res = await request("profile/activity", "get");
    setActivityLoading(false);
    if (res?.success) setActivities(res.data?.activities || []);
  };

  const loadStatistics = async () => {
    const res = await request("profile/statistics", "get");
    if (res?.success) setStatistics(res.data || {});
  };

  const loadPreferences = async () => {
    const res = await request("profile/preferences", "get");
    if (res?.success) {
      preferencesForm.setFieldsValue(res.data?.preferences || {});
    }
  };

  const handleUpdateProfile = async (values) => {
    setSaving(true);
    const payload = {
      name: values.name,
      phone: values.phone || null,
      gender: values.gender || null,
      date_of_birth: values.date_of_birth ? values.date_of_birth.format("YYYY-MM-DD") : null,
      address: values.address || null,
    };
    const res = await request("profile/update", "post", payload);
    setSaving(false);
    if (res?.errors) {
      applyFieldErrors(profileForm, res.errors);
      message.error(res.errors.message || "Failed to update profile");
      return;
    }
    if (res?.success) {
      message.success("Profile updated successfully");
      setProfile({ ...(profile || {}), ...res.data });
      return;
    }
    message.error(res?.message || "Failed to update profile");
  };

  const handleAvatarUpload = async (file) => {
    const isImage = ["image/jpeg", "image/png"].includes(file.type);
    if (!isImage) {
      message.error("Only JPG and PNG images are allowed");
      return false;
    }
    if (file.size > 2 * 1024 * 1024) {
      message.error("Image must be 2MB or smaller");
      return false;
    }
    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append("avatar", file);
    const res = await request("profile/avatar", "post", formData);
    setUploadingAvatar(false);
    if (res?.errors) {
      message.error(res.errors.message || "Failed to upload photo");
      return false;
    }
    if (res?.success) {
      message.success("Profile photo updated");
      if (res.data?.profile) setProfile({ ...(profile || {}), ...res.data.profile });
      else loadProfile();
    }
    return false;
  };

  const handleDeleteAvatar = async () => {
    setUploadingAvatar(true);
    const res = await request("profile/avatar", "delete");
    setUploadingAvatar(false);
    if (res?.success) {
      message.success("Profile photo removed");
      if (res.data) setProfile({ ...(profile || {}), ...res.data });
      else loadProfile();
    } else {
      message.error(res?.errors?.message || res?.message || "Failed to remove photo");
    }
  };

  const handleChangePassword = async (values) => {
    setChangingPassword(true);
    const res = await request("profile/change-password", "post", values);
    setChangingPassword(false);
    if (res?.errors) {
      applyFieldErrors(passwordForm, res.errors);
      message.error(res.errors.message || "Failed to change password");
      return;
    }
    if (res?.success) {
      message.success(res.message || "Password changed successfully");
      passwordForm.resetFields();
      if (isAdminUser) {
        loadSessions();
        loadActivities();
      }
      return;
    }
    message.error(res?.message || "Failed to change password");
  };

  const handleRevokeSession = async (tokenId) => {
    const res = await request(`profile/sessions/${tokenId}`, "delete");
    if (res?.success) {
      message.success("Session revoked");
      loadSessions();
      loadActivities();
    } else {
      message.error(res?.errors?.message || res?.message || "Failed to revoke session");
    }
  };

  const handleRevokeAllOtherSessions = async () => {
    const res = await request("profile/sessions/revoke-all-others", "post");
    if (res?.success) {
      message.success(res.message || "Logged out from other devices");
      loadSessions();
      loadActivities();
    } else {
      message.error(res?.errors?.message || res?.message || "Failed to logout other sessions");
    }
  };

  const handleUpdatePreferences = async (values) => {
    setSavingPrefs(true);
    const res = await request("profile/preferences", "put", values);
    setSavingPrefs(false);
    if (res?.success) {
      message.success("Preferences saved");
      const prefs = res.data?.preferences || values;
      applyThemePref(prefs.theme);
      setProfile({ ...(profile || {}), preferences: prefs });
      if (prefs.language) localStorage.setItem("rms-language", prefs.language);
    } else {
      message.error(res?.errors?.message || res?.message || "Failed to save preferences");
    }
  };

  const startTwoFactorSetup = async () => {
    setTwoFactorBusy(true);
    const res = await request("profile/two-factor/setup", "post");
    setTwoFactorBusy(false);
    if (res?.success) {
      setTwoFactorSetup(res.data);
      confirm2faForm.resetFields();
    } else {
      message.error(res?.errors?.message || res?.message || "Unable to start two-factor setup");
    }
  };

  const confirmTwoFactor = async (values) => {
    setTwoFactorBusy(true);
    const res = await request("profile/two-factor/confirm", "post", { code: values.code });
    setTwoFactorBusy(false);
    if (res?.success) {
      message.success("Two-factor authentication enabled");
      setTwoFactorEnabled(true);
      setTwoFactorSetup(null);
      loadActivities();
      loadProfile();
    } else {
      applyFieldErrors(confirm2faForm, res?.errors);
      message.error(res?.errors?.message || res?.message || "Invalid authenticator code");
    }
  };

  const disableTwoFactor = async (values) => {
    setTwoFactorBusy(true);
    const res = await request("profile/two-factor/disable", "post", values);
    setTwoFactorBusy(false);
    if (res?.success) {
      message.success("Two-factor authentication disabled");
      setTwoFactorEnabled(false);
      setDisableOpen(false);
      disable2faForm.resetFields();
      loadActivities();
    } else {
      applyFieldErrors(disable2faForm, res?.errors);
      message.error(res?.errors?.message || res?.message || "Unable to disable two-factor authentication");
    }
  };

  const avatarUrl = profile?.profile_image_url;
  const roles = Array.isArray(profile?.roles)
    ? profile.roles.map((r) => (typeof r === "string" ? r : r?.name)).filter(Boolean)
    : [];
  const roleLabel = roles.length ? roles.map(formatRole).join(", ") : "User";

  const sessionColumns = useMemo(() => [
    {
      title: "No.",
      key: "no",
      width: 64,
      render: (_, __, index) => (devicePage.current - 1) * devicePage.pageSize + index + 1,
    },
    {
      title: "Device",
      dataIndex: "name",
      key: "name",
      render: (text, record) => {
        const label = String(text || "");
        const isMobile = /mobile|android|iphone|ipad/i.test(label);
        return (
          <div className="flex items-center gap-2 min-w-0">
            {isMobile ? <MobileOutlined aria-hidden /> : <DesktopOutlined aria-hidden />}
            <span className="break-all">{label}</span>
            {record.is_current && <Tag color="green">Current</Tag>}
          </div>
        );
      },
    },
    {
      title: "Last active",
      key: "last_used_at",
      render: (_, record) => record.last_used_at_full || record.last_used_at || "—",
    },
    {
      title: "Signed in",
      key: "created_at",
      render: (_, record) => record.created_at_full || record.created_at || "—",
    },
    {
      title: "Action",
      key: "action",
      align: "center",
      render: (_, record) =>
        record.is_current ? (
          <span className={muted}>This device</span>
        ) : (
          <Popconfirm
            title="Revoke this session?"
            description="This device will be signed out immediately."
            onConfirm={() => handleRevokeSession(record.id)}
            okText="Revoke"
            cancelText="Cancel"
          >
            <Button size="small" danger icon={<LogoutOutlined />} aria-label={`Revoke session ${record.name}`}>
              Revoke
            </Button>
          </Popconfirm>
        ),
    },
  ], [muted, devicePage]);

  const activityColumns = useMemo(() => [
    {
      title: "Action",
      dataIndex: "description",
      key: "description",
      render: (text) => <span className={titleCls}>{text || "—"}</span>,
    },
    {
      title: "Date",
      key: "date",
      render: (_, record) => record.created_at_full || record.created_at || "—",
    },
    {
      title: "Device",
      key: "device",
      render: (_, record) => {
        const ua = record.user_agent;
        if (!ua?.browser) return "—";
        return `${ua.browser} on ${ua.platform || "unknown"}`;
      },
    },
    {
      title: "IP",
      dataIndex: "ip_address",
      key: "ip_address",
      render: (text) => text || "—",
    },
  ], [titleCls]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]" role="status" aria-live="polite">
        <Spin size="large" />
        <span className="sr-only">Loading profile</span>
      </div>
    );
  }

  if (loadError && !profile?.id) {
    return (
      <div className={`rounded-xl p-6 ${dark ? "bg-gray-900" : "bg-[#F5F8FC]"}`}>
        <Alert
          type="error"
          showIcon
          message="Unable to load your profile"
          description={loadError}
          action={<Button onClick={loadAll}>Retry</Button>}
        />
      </div>
    );
  }

  const metaItems = [
    { label: "Account ID", value: profile?.account_id || "N/A" },
    { label: "Role", value: roleLabel },
    { label: "Assigned resort", value: profile?.assigned_resort || "Not assigned" },
    { label: "Assigned branch", value: profile?.assigned_branch || "Not assigned" },
    { label: "Last login", value: profile?.last_login_human || profile?.last_login_at || "—" },
    { label: "Member since", value: profile?.created_at_human || profile?.created_at || "—" },
  ];

  return (
    <div className={`min-h-full rounded-xl p-1 sm:p-2`} style={{ fontFamily: "Inter, Poppins, sans-serif" }}>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
        <div>
          <h1 className={`text-[26px] font-bold leading-tight ${titleCls}`}>Profile Account</h1>
          <p className={`text-sm mt-1 ${subText}`}>
            {isAdminUser
              ? "Manage your personal details, security, notifications, activity, and device sessions."
              : "Manage your personal details, security, and notification preferences."}
          </p>
        </div>
      </div>

      {loadError && (
        <Alert className="mb-4" type="warning" showIcon message={loadError} action={<Button size="small" onClick={loadAll}>Retry</Button>} />
      )}

      <Card className={`mb-5 shadow-sm ${card}`} bordered={false}>
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex flex-col items-center lg:items-start">
            <div className="relative">
              <Avatar
                size={112}
                src={avatarUrl}
                icon={!avatarUrl && <UserOutlined />}
                alt={profile?.name ? `${profile.name} avatar` : "Profile avatar"}
                className="border-4 border-white shadow-md"
              />
              <Upload accept=".jpg,.jpeg,.png" maxCount={1} beforeUpload={handleAvatarUpload} showUploadList={false}>
                <Button
                  shape="circle"
                  loading={uploadingAvatar}
                  icon={<CameraOutlined />}
                  aria-label="Change profile photo"
                  className="!absolute !bottom-0 !right-0 !bg-[#FF6B00] !border-[#FF6B00] !text-white !shadow-lg"
                />
              </Upload>
            </div>
            {profile?.profile_image && (
              <Popconfirm
                title="Remove photo?"
                description="Your profile will use the default avatar."
                onConfirm={handleDeleteAvatar}
                okText="Remove"
                cancelText="Cancel"
              >
                <Button danger size="small" className="mt-3" icon={<DeleteOutlined />} loading={uploadingAvatar}>
                  Delete photo 
                </Button>
              </Popconfirm>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h2 className={`text-2xl font-bold m-0 ${titleCls}`}>{profile?.name || "—"}</h2>
              {profile?.status === "active" ? (
                <Badge status="success" text={<span className={titleCls}>Active</span>} />
              ) : (
                <Badge status="error" text={<span className={titleCls}>{profile?.status || "Unknown"}</span>} />
              )}
              <Tag color="blue">{roleLabel}</Tag>
              {twoFactorEnabled && <Tag color="green" icon={<SafetyOutlined />}>2FA on</Tag>}
            </div>
            <div className={`flex flex-wrap gap-x-6 gap-y-1 text-sm ${subText}`}>
              <span className="inline-flex items-center gap-1"><MailOutlined aria-hidden /> {profile?.email || "—"}</span>
              <span className="inline-flex items-center gap-1"><PhoneOutlined aria-hidden /> {profile?.phone || "No phone"}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mt-5">
              {metaItems.map((item) => (
                <div key={item.label} className={`rounded-lg border px-3 py-2 ${dark ? "border-gray-700 bg-gray-900/40" : "border-[#D9E2EC] bg-[#F5F8FC]"}`}>
                  <div className={`text-xs ${muted}`}>{item.label}</div>
                  <div className={`font-medium mt-0.5 ${titleCls}`}>{item.value}</div>
                </div>
              ))}
            </div>

            <div className={`grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-4 border-t ${dark ? "border-gray-700" : "border-[#D9E2EC]"}`}>
              {[
                ["Bookings", formatStat(statistics.total_bookings)],
                ["Reviews", formatStat(statistics.total_reviews)],
                ["Permission", formatStat(Array.isArray(permission) ? permission.length : 0)],
                ["Day", profile?.created_at ? dayjs(profile.created_at).format("DD MMM YYYY") : "—"],
              ].map(([label, value]) => (
                <div key={label}>
                  <div className={`text-2xl font-bold text-[#FF6B00] ${label === "Day" ? "text-lg sm:text-xl" : ""}`}>{value}</div>
                  <div className={`text-sm ${muted}`}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Tabs
        defaultActiveKey="profile"
        size="large"
        items={[
          {
            key: "profile",
            label: <span><UserOutlined /> Profile</span>,
            children: (
              <Card className={`shadow-sm ${card}`} bordered={false}>
                <Form form={profileForm} layout="vertical" onFinish={handleUpdateProfile} size="large">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Form.Item name="name" label="Full name" rules={[{ required: true, message: "Please enter your name" }]}>
                      <Input prefix={<UserOutlined />} placeholder="Full name" autoComplete="name" />
                    </Form.Item>
                    <Form.Item name="phone" label="Phone number">
                      <Input prefix={<PhoneOutlined />} placeholder="Phone number" autoComplete="tel" />
                    </Form.Item>
                    <Form.Item name="date_of_birth" label="Date of birth">
                      <DatePicker className="w-full" placeholder="Select date" disabledDate={(d) => d && d >= dayjs().startOf("day")} />
                    </Form.Item>
                    <Form.Item name="gender" label="Gender">
                      <Select
                        allowClear
                        placeholder="Select gender"
                        options={[
                          { value: "male", label: "Male" },
                          { value: "female", label: "Female" },
                          { value: "other", label: "Other" },
                        ]}
                      />
                    </Form.Item>
                  </div>
                  <Form.Item name="address" label="Address">
                    <Input.TextArea rows={3} placeholder="Enter your address" />
                  </Form.Item>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Form.Item label="Email (protected)">
                      <Input prefix={<MailOutlined />} value={profile?.email} disabled aria-readonly="true" />
                    </Form.Item>
                    <Form.Item label="Role (protected)">
                      <Input prefix={<SafetyOutlined />} value={roleLabel} disabled aria-readonly="true" />
                    </Form.Item>
                  </div>
                  <Alert
                    className="mb-4"
                    type="info"
                    showIcon
                    message="Email, role, permissions, and account status can only be changed by an administrator."
                  />
                  <Button type="primary" htmlType="submit" loading={saving} icon={<SaveOutlined />} className="!bg-[#FF6B00] !border-[#FF6B00]">
                    Save profile
                  </Button>
                </Form>
              </Card>
            ),
          },
          {
            key: "security",
            label: <span><LockOutlined /> Security</span>,
            children: (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                <Card title="Change password" className={`shadow-sm ${card}`} bordered={false}>
                  <Form form={passwordForm} layout="vertical" onFinish={handleChangePassword} size="large">
                    <Form.Item name="current_password" label="Current password" rules={[{ required: true, message: "Enter your current password" }]}>
                      <Input.Password prefix={<LockOutlined />} autoComplete="current-password" />
                    </Form.Item>
                    <Form.Item
                      name="password"
                      label="New password"
                      rules={[
                        { required: true, message: "Enter a new password" },
                        { min: 8, message: "At least 8 characters" },
                        { pattern: /^(?=.*[A-Za-z])(?=.*\d).+$/, message: "Must include letters and numbers" },
                      ]}
                    >
                      <Input.Password prefix={<LockOutlined />} autoComplete="new-password" />
                    </Form.Item>
                    <Form.Item
                      name="password_confirmation"
                      label="Confirm new password"
                      dependencies={["password"]}
                      rules={[
                        { required: true, message: "Confirm your new password" },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || getFieldValue("password") === value) return Promise.resolve();
                            return Promise.reject(new Error("Passwords do not match"));
                          },
                        }),
                      ]}
                    >
                      <Input.Password prefix={<LockOutlined />} autoComplete="new-password" />
                    </Form.Item>
                    <Alert className="mb-4" type="info" showIcon message="Changing your password signs out every other device." />
                    <Button danger type="primary" htmlType="submit" loading={changingPassword} icon={<LockOutlined />} block>
                      Update password
                    </Button>
                  </Form>
                </Card>

                <Card title="Two-factor authentication" className={`shadow-sm ${card}`} bordered={false}>
                  <p className={`text-sm mb-4 ${subText}`}>
                    Add an authenticator app to protect this account. Sign-in still uses your existing email and password.
                  </p>
                  {twoFactorEnabled && !twoFactorSetup ? (
                    <div>
                      <Alert type="success" showIcon className="mb-4" message="Two-factor authentication is enabled." />
                      <Button danger onClick={() => setDisableOpen(true)}>Disable 2FA</Button>
                    </div>
                  ) : twoFactorSetup ? (
                    <div className="space-y-4">
                      <p className={`text-sm ${subText}`}>Scan this QR code in Google Authenticator, Authy, or a similar app.</p>
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(twoFactorSetup.otpauth_url)}`}
                        alt="Two-factor authentication QR code"
                        width={180}
                        height={180}
                        className="rounded-lg border bg-white p-2"
                      />
                      <div>
                        <div className={`text-xs mb-1 ${muted}`}>Manual setup key</div>
                        <Input readOnly value={twoFactorSetup.secret} aria-label="Authenticator setup key" />
                      </div>
                      {!!twoFactorSetup.recovery_codes?.length && (
                        <Alert
                          type="warning"
                          showIcon
                          message="Save these recovery codes in a safe place. They are shown only once."
                          description={
                            <ul className="grid grid-cols-2 gap-1 mt-2 font-mono text-xs">
                              {twoFactorSetup.recovery_codes.map((code) => <li key={code}>{code}</li>)}
                            </ul>
                          }
                        />
                      )}
                      <Form form={confirm2faForm} layout="vertical" onFinish={confirmTwoFactor}>
                        <Form.Item name="code" label="6-digit code" rules={[{ required: true, len: 6, message: "Enter the 6-digit code" }]}>
                          <Input inputMode="numeric" maxLength={6} placeholder="000000" aria-label="Authenticator code" />
                        </Form.Item>
                        <div className="flex gap-2">
                          <Button type="primary" htmlType="submit" loading={twoFactorBusy} className="!bg-[#FF6B00] !border-[#FF6B00]">Confirm and enable</Button>
                          <Button onClick={() => setTwoFactorSetup(null)}>Cancel</Button>
                        </div>
                      </Form>
                    </div>
                  ) : (
                    <Button type="primary" loading={twoFactorBusy} onClick={startTwoFactorSetup} icon={<SafetyOutlined />} className="!bg-[#FF6B00] !border-[#FF6B00]">
                      Enable two-factor authentication
                    </Button>
                  )}
                </Card>
              </div>
            ),
          },
          {
            key: "preferences",
            label: <span><BellOutlined /> Notification</span>,
            children: (
              <Card className={`shadow-sm ${card}`} bordered={false}>
                <Form form={preferencesForm} layout="vertical" onFinish={handleUpdatePreferences} size="large">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Form.Item name="theme" label="Theme">
                      <Select
                        options={[
                          { value: "light", label: "Light" },
                          { value: "dark", label: "Dark" },
                          { value: "auto", label: "Auto (system)" },
                        ]}
                      />
                    </Form.Item>
                    <Form.Item name="language" label="Language">
                      <Select options={LANG_OPTIONS} />
                    </Form.Item>
                  </div>
                  <h3 className={`text-base font-semibold mb-3 ${titleCls}`}>Notifications</h3>
                  {[
                    ["email", "Email notifications", "Account and security messages by email"],
                    ["system", "System notifications", "Operational alerts inside the dashboard"],
                    ["booking", "Booking notifications", "Reservations, check-in, and check-out updates"],
                    ["restaurant", "Restaurant notifications", "Orders, tables, and restaurant billing"],
                  ].map(([name, title, hint]) => (
                    <div key={name} className={`flex items-center justify-between rounded-lg border px-4 py-3 mb-3 ${dark ? "border-gray-700" : "border-[#D9E2EC]"}`}>
                      <div>
                        <div className={`font-medium ${titleCls}`}>{title}</div>
                        <div className={`text-sm ${muted}`}>{hint}</div>
                      </div>
                      <Form.Item name={["notifications", name]} valuePropName="checked" className="!mb-0">
                        <Switch aria-label={title} />
                      </Form.Item>
                    </div>
                  ))}
                  <Form.Item name={["notifications", "payment"]} valuePropName="checked" hidden>
                    <Switch />
                  </Form.Item>
                  <Form.Item name={["notifications", "marketing"]} valuePropName="checked" hidden>
                    <Switch />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" loading={savingPrefs} icon={<SaveOutlined />} className="!bg-[#FF6B00] !border-[#FF6B00] mt-2">
                    Save notifications
                  </Button>
                </Form>
              </Card>
            ),
          },
          ...(isAdminUser ? [{
            key: "activity",
            label: <span><HistoryOutlined /> Activity & Active Log Devices</span>,
            children: (
              <div className="space-y-5">
                <Card title="Activity log" className={`shadow-sm ${card}`} bordered={false}>
                  <Table
                    dataSource={activities}
                    columns={activityColumns}
                    rowKey={(row, index) => row.id ?? `${row.created_at}-${index}`}
                    loading={activityLoading}
                    pagination={{ pageSize: 8, hideOnSinglePage: true }}
                    size="small"
                    scroll={{ x: true }}
                    locale={{ emptyText: <Empty description="No login or activity history yet" /> }}
                  />
                </Card>
                <Card
                  title="Active log devices"
                  className={`shadow-sm ${card}`}
                  bordered={false}
                  extra={
                    sessions.filter((s) => !s.is_current).length > 0 && (
                      <Popconfirm
                        title="Sign out other devices?"
                        description="All sessions except this one will be revoked."
                        onConfirm={handleRevokeAllOtherSessions}
                        okText="Sign out others"
                        cancelText="Cancel"
                      >
                        <Button size="small" danger icon={<LogoutOutlined />}>Logout other sessions</Button>
                      </Popconfirm>
                    )
                  }
                >
                  <Table
                    dataSource={sessions}
                    columns={sessionColumns}
                    rowKey="id"
                    loading={sessionsLoading}
                    pagination={{
                      current: devicePage.current,
                      pageSize: devicePage.pageSize,
                      showSizeChanger: true,
                      pageSizeOptions: ["8", "10", "20"],
                      showTotal: (total, range) => `${range[0]}–${range[1]} of ${total} devices`,
                      position: ["bottomRight"],
                      onChange: (current, pageSize) => setDevicePage({ current, pageSize }),
                    }}
                    size="small"
                    scroll={{ x: true }}
                    locale={{ emptyText: <Empty description="No active sessions" /> }}
                  />
                </Card>
              </div>
            ),
          }] : []),
        ]}
      />

      <Modal
        title="Disable two-factor authentication"
        open={disableOpen}
        onCancel={() => setDisableOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form form={disable2faForm} layout="vertical" onFinish={disableTwoFactor}>
          <Form.Item name="password" label="Current password" rules={[{ required: true, message: "Enter your password" }]}>
            <Input.Password autoComplete="current-password" />
          </Form.Item>
          <Form.Item name="code" label="Authenticator or recovery code (recommended)">
            <Input placeholder="123456 or ABCD-EFGH" />
          </Form.Item>
          <Button danger type="primary" htmlType="submit" loading={twoFactorBusy} block>
            Disable 2FA
          </Button>
        </Form>
      </Modal>
    </div>
  );
}

import { useState } from 'react';
import { Form, Input, Card, Avatar, Upload, Button, message, Tag, DatePicker, Select } from 'antd';
import {
  UserOutlined, MailOutlined, PhoneOutlined, EditOutlined,
  LockOutlined, HomeOutlined,
} from '@ant-design/icons';
import { ProfileStore } from '../../store/ProfileStore';
import { request } from '../../util/request';
import { useDarkMode } from '../../util/DarkModeContext';
import config from '../../util/config';
import dayjs from 'dayjs';

const { Option } = Select;

export default function Profile_Setting() {
  const { profile, setProfile } = ProfileStore();
  const dark = useDarkMode();
  const [form]     = Form.useForm();
  const [passForm] = Form.useForm();
  const [saving,   setSaving]   = useState(false);
  const [changing, setChanging] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [imgKey,   setImgKey]   = useState(Date.now());

  const avatarUrl = fileList[0]?.thumbUrl
    || (profile?.profile_image_url ? `${config.image_path}${profile.profile_image_url}?v=${imgKey}` : null);
  const roleLabel = profile?.roles?.[0]?.name?.replaceAll('_', ' ') || 'User';

  const onSaveInfo = async (values) => {
    setSaving(true);
    try {
      const formData = new FormData();
      if (values.name)          formData.append('name',          values.name);
      if (values.phone)         formData.append('phone',         values.phone);
      if (values.gender)        formData.append('gender',        values.gender);
      if (values.date_of_birth) formData.append('date_of_birth', values.date_of_birth.format('YYYY-MM-DD'));
      if (values.address)       formData.append('address',       values.address);
      if (fileList[0]?.originFileObj) formData.append('profile_image', fileList[0].originFileObj);

      const res = await request('auth/profile', 'post', formData);
      if (res?.user) {
        setProfile({ ...res.user });
        setFileList([]);
        setImgKey(Date.now());
        message.success('Profile updated successfully!');
      } else {
        message.error(res?.errors?.message || res?.message || 'Failed to update profile.');
      }
    } finally {
      setSaving(false);
    }
  };

  const onChangePassword = async (values) => {
    setChanging(true);
    try {
      const res = await request('auth/change-password', 'post', {
        current_password:      values.current_password,
        password:              values.password,
        password_confirmation: values.password_confirmation,
      });
      if (res?.message && !res?.errors) {
        message.success(res.message);
        passForm.resetFields();
      } else {
        message.error(res?.errors?.message || 'Failed to change password.');
      }
    } finally {
      setChanging(false);
    }
  };

  // dark mode styles
  const cardCls  = dark ? 'bg-gray-800 border-gray-700' : '';
  const textPri  = dark ? 'text-gray-100' : 'text-gray-800';
  const textSub  = dark ? 'text-gray-400' : 'text-gray-400';

  return (
    <div className={`max-w-3xl mx-auto py-6 flex flex-col gap-5 ${dark ? 'text-gray-100' : ''}`}>

      {/* ── Avatar + Name ── */}
      <Card className={cardCls}>
        <div className="flex items-center gap-6">
          <div className="relative">
            <Avatar
              size={90}
              src={avatarUrl}
              icon={!avatarUrl && <UserOutlined />}
              className="border-4 border-blue-100"
            />
            <Upload
              accept=".jpg,.jpeg,.png"
              maxCount={1}
              beforeUpload={() => false}
              fileList={fileList}
              onChange={({ fileList: fl }) => setFileList(fl)}
              showUploadList={false}
            >
              <button className="absolute bottom-0 right-0 w-7 h-7 bg-[#0f2744] rounded-full flex items-center justify-center text-white shadow cursor-pointer border-2 border-white">
                <EditOutlined style={{ fontSize: 12 }} />
              </button>
            </Upload>
          </div>
          <div>
            <div className={`text-xl font-bold ${textPri}`}>{profile?.name}</div>
            <div className={`text-sm mb-1 ${textSub}`}>{profile?.email}</div>
            <Tag color="blue" className="capitalize">{roleLabel}</Tag>
            {profile?.is_google_account && <Tag color="red" className="ml-1">Google Account</Tag>}
          </div>
        </div>
      </Card>

      {/* ── Account Info ── */}
      <Card title="Account Information" className={cardCls}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onSaveInfo}
          initialValues={{
            name:          profile?.name,
            phone:         profile?.phone,
            gender:        profile?.gender,
            address:       profile?.address,
            date_of_birth: profile?.date_of_birth ? dayjs(profile.date_of_birth) : null,
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="name" label="Full Name" rules={[{ required: true }]}>
              <Input prefix={<UserOutlined />} placeholder="Full name" size="large" />
            </Form.Item>
            <Form.Item name="phone" label="Phone Number">
              <Input prefix={<PhoneOutlined />} placeholder="Phone number" size="large" />
            </Form.Item>
            <Form.Item name="date_of_birth" label="Date of Birth">
              <DatePicker className="w-full" size="large" placeholder="YYYY-MM-DD" />
            </Form.Item>
            <Form.Item name="gender" label="Gender">
              <Select placeholder="Select gender" size="large">
                <Option value="male">Male</Option>
                <Option value="female">Female</Option>
                <Option value="other">Other</Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item name="address" label="Address">
            <Input prefix={<HomeOutlined />} placeholder="Address" size="large" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="Email">
              <Input prefix={<MailOutlined />} value={profile?.email} size="large" disabled />
            </Form.Item>
            <Form.Item label="Account Type">
              <Input value={profile?.is_google_account ? 'Google Account' : 'Email Account'} size="large" disabled />
            </Form.Item>
          </div>

          <Form.Item className="!mb-0">
            <Button type="primary" htmlType="submit" loading={saving} size="large"
              className="!bg-[#0f2744] !border-[#0f2744]">
              Save Changes
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* ── Change Password (hidden for Google accounts) ── */}
      {!profile?.is_google_account && (
        <Card title="Change Password" className={cardCls}>
          <Form form={passForm} layout="vertical" onFinish={onChangePassword}>
            <Form.Item name="current_password" label="Current Password" rules={[{ required: true }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="Current password" size="large" />
            </Form.Item>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="password" label="New Password"
                rules={[{ required: true }, { min: 8, message: 'Minimum 8 characters' }]}>
                <Input.Password prefix={<LockOutlined />} placeholder="New password" size="large" />
              </Form.Item>
              <Form.Item name="password_confirmation" label="Confirm Password"
                dependencies={['password']}
                rules={[
                  { required: true },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) return Promise.resolve();
                      return Promise.reject(new Error('Passwords do not match'));
                    },
                  }),
                ]}>
                <Input.Password prefix={<LockOutlined />} placeholder="Confirm password" size="large" />
              </Form.Item>
            </div>
            <Form.Item className="!mb-0">
              <Button type="primary" htmlType="submit" loading={changing} size="large" danger>
                Change Password
              </Button>
            </Form.Item>
          </Form>
        </Card>
      )}
    </div>
  );
}

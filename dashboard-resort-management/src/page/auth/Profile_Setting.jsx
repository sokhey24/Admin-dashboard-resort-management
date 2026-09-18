// import { useState, useEffect } from 'react';
// import {
//   Card, Avatar, Button, Form, Input, Select, DatePicker, Upload, Tabs, Table,
//   Switch, message, Tag, Spin, Empty, Badge, Timeline,
//   Divider, Space, Alert, Popconfirm
// } from 'antd';
// import {
//   UserOutlined, MailOutlined, PhoneOutlined, LockOutlined, HomeOutlined,
//   CameraOutlined, SaveOutlined, DesktopOutlined, MobileOutlined,
//   DeleteOutlined, LogoutOutlined, SafetyOutlined, SettingOutlined, HistoryOutlined
// } from '@ant-design/icons';
// import { useDarkMode } from '../../util/DarkModeContext';
// import { ProfileStore } from '../../store/ProfileStore';
// import { request } from '../../util/request';
// import dayjs from 'dayjs';
// import relativeTime from 'dayjs/plugin/relativeTime';

// dayjs.extend(relativeTime);

// const { Option } = Select;
// const { TabPane } = Tabs;
// const { TextArea } = Input;

// export default function Profile_Setting() {
//   const dark = useDarkMode();
//   const { profile, setProfile } = ProfileStore();
  
//   // States
//   const [loading, setLoading] = useState(false);
//   const [saving, setSaving] = useState(false);
//   const [uploadingAvatar, setUploadingAvatar] = useState(false);
//   const [changingPassword, setChangingPassword] = useState(false);
//   const [sessions, setSessions] = useState([]);
//   const [activities, setActivities] = useState([]);
//   const [statistics, setStatistics] = useState({});
//   const [preferences, setPreferences] = useState({});
//   const [fileList, setFileList] = useState([]);
  
//   // Forms
//   const [profileForm] = Form.useForm();
//   const [passwordForm] = Form.useForm();
//   const [preferencesForm] = Form.useForm();

//   // Load data on mount
//   useEffect(() => {
//     loadProfileData();
//     loadSessions();
//     loadActivities();
//     loadStatistics();
//     loadPreferences();
//   }, []);

//   // =====================================================================
//   // API Calls
//   // =====================================================================

//   const loadProfileData = async () => {
//     setLoading(true);
//     try {
//       const res = await request('profile', 'get');
//       if (res?.success && res?.data) {
//         setProfile(res.data);
//         profileForm.setFieldsValue({
//           name: res.data.name,
//           phone: res.data.phone,
//           gender: res.data.gender,
//           date_of_birth: res.data.date_of_birth ? dayjs(res.data.date_of_birth) : null,
//           address: res.data.address,
//         });
//       }
//     } catch (error) {
//       message.error('Failed to load profile');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const loadSessions = async () => {
//     try {
//       const res = await request('profile/sessions', 'get');
//       if (res?.success) {
//         setSessions(res.data.sessions || []);
//       }
//     } catch (error) {
//       console.error('Failed to load sessions');
//     }
//   };

//   const loadActivities = async () => {
//     try {
//       const res = await request('profile/activity', 'get');
//       if (res?.success) {
//         setActivities(res.data.activities || []);
//       }
//     } catch (error) {
//       console.error('Failed to load activities');
//     }
//   };

//   const loadStatistics = async () => {
//     try {
//       const res = await request('profile/statistics', 'get');
//       if (res?.success) {
//         setStatistics(res.data || {});
//       }
//     } catch (error) {
//       console.error('Failed to load statistics');
//     }
//   };

//   const loadPreferences = async () => {
//     try {
//       const res = await request('profile/preferences', 'get');
//       if (res?.success) {
//         const prefs = res.data.preferences || {};
//         setPreferences(prefs);
//         preferencesForm.setFieldsValue(prefs);
//       }
//     } catch (error) {
//       console.error('Failed to load preferences');
//     }
//   };

//   // =====================================================================
//   // Profile Update
//   // =====================================================================

//   const handleUpdateProfile = async (values) => {
//     setSaving(true);
//     try {
//       const formData = new FormData();
      
//       if (values.name) formData.append('name', values.name);
//       if (values.phone) formData.append('phone', values.phone);
//       if (values.gender) formData.append('gender', values.gender);
//       if (values.date_of_birth) {
//         formData.append('date_of_birth', values.date_of_birth.format('YYYY-MM-DD'));
//       }
//       if (values.address) formData.append('address', values.address);
      
//       const res = await request('profile', 'post', formData);
      
//       if (res?.success) {
//         message.success('Profile updated successfully');
//         setProfile(res.data);
//         loadProfileData();
//       } else {
//         message.error(res?.message || 'Failed to update profile');
//       }
//     } catch (error) {
//       message.error('Failed to update profile');
//     } finally {
//       setSaving(false);
//     }
//   };

//   // =====================================================================
//   // Avatar Upload
//   // =====================================================================

//   const handleAvatarUpload = async (file) => {
//     setUploadingAvatar(true);
//     try {
//       const formData = new FormData();
//       formData.append('avatar', file);
      
//       const res = await request('profile/avatar', 'post', formData);
      
//       if (res?.success) {
//         message.success('Avatar uploaded successfully');
//         loadProfileData();
//         setFileList([]);
//       } else {
//         message.error(res?.message || 'Failed to upload avatar');
//       }
//     } catch (error) {
//       message.error('Failed to upload avatar');
//     } finally {
//       setUploadingAvatar(false);
//     }
    
//     return false; // Prevent automatic upload
//   };

//   const handleDeleteAvatar = async () => {
//     setUploadingAvatar(true);
//     try {
//       const res = await request('profile/avatar', 'delete');
      
//       if (res?.success) {
//         message.success('Avatar deleted successfully');
//         loadProfileData();
//       } else {
//         message.error(res?.message || 'Failed to delete avatar');
//       }
//     } catch (error) {
//       message.error('Failed to delete avatar');
//     } finally {
//       setUploadingAvatar(false);
//     }
//   };

//   // =====================================================================
//   // Password Change
//   // =====================================================================

//   const handleChangePassword = async (values) => {
//     setChangingPassword(true);
//     try {
//       const res = await request('profile/change-password', 'post', values);
      
//       if (res?.success) {
//         message.success(res.message || 'Password changed successfully');
//         passwordForm.resetFields();
//         loadSessions(); // Refresh sessions after password change
//       } else {
//         message.error(res?.message || 'Failed to change password');
//       }
//     } catch (error) {
//       message.error('Failed to change password');
//     } finally {
//       setChangingPassword(false);
//     }
//   };

//   // =====================================================================
//   // Session Management
//   // =====================================================================

//   const handleRevokeSession = async (tokenId) => {
//     try {
//       const res = await request(`profile/sessions/${tokenId}`, 'delete');
      
//       if (res?.success) {
//         message.success('Session revoked successfully');
//         loadSessions();
//       } else {
//         message.error(res?.message || 'Failed to revoke session');
//       }
//     } catch (error) {
//       message.error('Failed to revoke session');
//     }
//   };

//   const handleRevokeAllOtherSessions = async () => {
//     try {
//       const res = await request('profile/sessions/revoke-all-others', 'post');
      
//       if (res?.success) {
//         message.success(res.message || 'Logged out from all other devices');
//         loadSessions();
//       } else {
//         message.error(res?.message || 'Failed to logout from other devices');
//       }
//     } catch (error) {
//       message.error('Failed to logout from other devices');
//     }
//   };

//   // =====================================================================
//   // Preferences Update
//   // =====================================================================

//   const handleUpdatePreferences = async (values) => {
//     try {
//       const res = await request('profile/preferences', 'put', values);
      
//       if (res?.success) {
//         message.success('Preferences updated successfully');
//         setPreferences(values);
//       } else {
//         message.error(res?.message || 'Failed to update preferences');
//       }
//     } catch (error) {
//       message.error('Failed to update preferences');
//     }
//   };

//   // =====================================================================
//   // Styles
//   // =====================================================================

//   const styles = {
//     container: dark ? 'bg-gray-900' : 'bg-gray-50',
//     card: dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
//     text: dark ? 'text-gray-100' : 'text-gray-900',
//     textSub: dark ? 'text-gray-400' : 'text-gray-600',
//     textMuted: dark ? 'text-gray-500' : 'text-gray-400',
//   };

//   const avatarUrl = profile?.profile_image_url;
//   // const roleLabel = profile?.roles?.[0]?.replaceAll('_', ' ') || 'User';
//   const accountId = profile?.account_id || 'N/A';

//   // =====================================================================
//   // Session Table Columns
//   // =====================================================================

//   const sessionColumns = [
//     {
//       title: 'Device',
//       dataIndex: 'name',
//       key: 'name',
//       render: (text, record) => (
//         <Space>
//           {record.name.includes('mobile') ? <MobileOutlined /> : <DesktopOutlined />}
//           <span>{text}</span>
//           {record.is_current && <Tag color="green">Current</Tag>}
//         </Space>
//       ),
//     },
//     {
//       title: 'Last Active',
//       dataIndex: 'last_used_at',
//       key: 'last_used_at',
//     },
//     {
//       title: 'Created',
//       dataIndex: 'created_at',
//       key: 'created_at',
//     },
//     {
//       title: 'Action',
//       key: 'action',
//       render: (_, record) => (
//         !record.is_current && (
//           <Button
//             size="small"
//             danger
//             onClick={() => handleRevokeSession(record.id)}
//             icon={<LogoutOutlined />}
//           >
//             Revoke
//           </Button>
//         )
//       ),
//     },
//   ];

//   // =====================================================================
//   // Render
//   // =====================================================================

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <Spin size="large" tip="Loading profile..." />
//       </div>
//     );
//   }

//   return (
//     <div className={`min-h-screen p-6 ${styles.container}`}>
//       <div className="max-w-7xl mx-auto">
        
//         {/* ========================= HEADER ========================= */}
//         <Card className={`mb-6 ${styles.card}`} bordered={false}>
//           <div className="flex items-start gap-6">
//             {/* Avatar */}
//             <div className="relative">
//               <Avatar
//                 size={120}
//                 src={avatarUrl}
//                 icon={!avatarUrl && <UserOutlined />}
//                 className="border-4 border-blue-100"
//               />
//               <Upload
//                 accept=".jpg,.jpeg,.png"
//                 maxCount={1}
//                 beforeUpload={handleAvatarUpload}
//                 fileList={fileList}
//                 onChange={({ fileList: fl }) => setFileList(fl)}
//                 showUploadList={false}
//               >
//                 <Button
//                   shape="circle"
//                   size="large"
//                   loading={uploadingAvatar}
//                   icon={<CameraOutlined />}
//                   className="!absolute !bottom-0 !right-0 !bg-[#FF6B00] !border-[#FF6B00] !text-white !shadow-lg"
//                 />
//               </Upload>
//             </div>

//             {/* Info */}
//             <div className="flex-1">
//               <div className="flex items-center gap-3 mb-2">
//                 <h1 className={`text-2xl font-bold ${styles.text}`}>
//                   {profile?.name}
//                 </h1>
//                 {/* <Tag color="blue" className="capitalize text-sm">{roleLabel}</Tag> */}
//                 {profile?.status === 'active' ? (
//                   <Badge status="success" text="Active" />
//                 ) : (
//                   <Badge status="error" text="Inactive" />
//                 )}
//               </div>
              
//               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
//                 <div>
//                   <div className={`text-sm ${styles.textMuted}`}>Email</div>
//                   <div className={`font-medium ${styles.text}`}>{profile?.email}</div>
//                 </div>
//                 <div>
//                   <div className={`text-sm ${styles.textMuted}`}>Phone</div>
//                   <div className={`font-medium ${styles.text}`}>{profile?.phone || 'N/A'}</div>
//                 </div>
//                 <div>
//                   <div className={`text-sm ${styles.textMuted}`}>Account ID</div>
//                   <div className={`font-medium ${styles.text}`}>{accountId}</div>
//                 </div>
//                 <div>
//                   <div className={`text-sm ${styles.textMuted}`}>Member Since</div>
//                   <div className={`font-medium ${styles.text}`}>{profile?.created_at_human}</div>
//                 </div>
//               </div>

//               {/* Statistics */}
//               <div className="flex gap-6 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
//                 <div>
//                   <div className="text-2xl font-bold text-[#FF6B00]">{statistics.total_bookings || 0}</div>
//                   <div className={`text-sm ${styles.textMuted}`}>Bookings</div>
//                 </div>
//                 <div>
//                   <div className="text-2xl font-bold text-[#FF6B00]">{statistics.total_reviews || 0}</div>
//                   <div className={`text-sm ${styles.textMuted}`}>Reviews</div>
//                 </div>
//                 <div>
//                   <div className="text-2xl font-bold text-[#FF6B00]">{statistics.active_sessions || 0}</div>
//                   <div className={`text-sm ${styles.textMuted}`}>Active Sessions</div>
//                 </div>
//                 <div>
//                   <div className="text-2xl font-bold text-[#FF6B00]">{statistics.account_age_days || 0}</div>
//                   <div className={`text-sm ${styles.textMuted}`}>Days</div>
//                 </div>
//               </div>

//               {profile?.profile_image && (
//                 <Popconfirm
//                   title="Delete avatar?"
//                   description="Are you sure you want to delete your profile picture?"
//                   onConfirm={handleDeleteAvatar}
//                   okText="Yes"
//                   cancelText="No"
//                 >
//                   <Button
//                     danger
//                     size="small"
//                     className="mt-4"
//                     icon={<DeleteOutlined />}
//                     loading={uploadingAvatar}
//                   >
//                     Remove Photo
//                   </Button>
//                 </Popconfirm>
//               )}
//             </div>
//           </div>
//         </Card>

//         {/* ========================= TABS ========================= */}
//         <Tabs defaultActiveKey="1" size="large">
          
//           {/* TAB 1: PROFILE INFORMATION */}
//           <TabPane
//             tab={
//               <span>
//                 <UserOutlined />
//                 Profile Information
//               </span>
//             }
//             key="1"
//           >
//             <Card className={styles.card} bordered={false}>
//               <Form
//                 form={profileForm}
//                 layout="vertical"
//                 onFinish={handleUpdateProfile}
//                 size="large"
//               >
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <Form.Item
//                     name="name"
//                     label="Full Name"
//                     rules={[{ required: true, message: 'Please enter your name' }]}
//                   >
//                     <Input prefix={<UserOutlined />} placeholder="Full name" />
//                   </Form.Item>

//                   <Form.Item name="phone" label="Phone Number">
//                     <Input prefix={<PhoneOutlined />} placeholder="Phone number" />
//                   </Form.Item>

//                   <Form.Item name="date_of_birth" label="Date of Birth">
//                     <DatePicker className="w-full" placeholder="Select date" />
//                   </Form.Item>

//                   <Form.Item name="gender" label="Gender">
//                     <Select placeholder="Select gender">
//                       <Option value="male">Male</Option>
//                       <Option value="female">Female</Option>
//                       <Option value="other">Other</Option>
//                     </Select>
//                   </Form.Item>
//                 </div>

//                 <Form.Item name="address" label="Address">
//                   <TextArea rows={3} placeholder="Enter your address" />
//                 </Form.Item>

//                 <Form.Item label="Email (Cannot be changed)">
//                   <Input prefix={<MailOutlined />} value={profile?.email} disabled />
//                 </Form.Item>

//                 <Form.Item>
//                   <Button
//                     type="primary"
//                     htmlType="submit"
//                     loading={saving}
//                     icon={<SaveOutlined />}
//                     size="large"
//                     className="!bg-[#FF6B00] !border-[#FF6B00]"
//                   >
//                     Save Changes
//                   </Button>
//                 </Form.Item>
//               </Form>
//             </Card>
//           </TabPane>

//           {/* TAB 2: SECURITY */}
//           <TabPane
//             tab={
//               <span>
//                 <SafetyOutlined />
//                 Security
//               </span>
//             }
//             key="2"
//           >
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
//               {/* Change Password */}
//               <Card title="Change Password" className={styles.card} bordered={false}>
//                 <Form
//                   form={passwordForm}
//                   layout="vertical"
//                   onFinish={handleChangePassword}
//                   size="large"
//                 >
//                   <Form.Item
//                     name="current_password"
//                     label="Current Password"
//                     rules={[{ required: true, message: 'Please enter current password' }]}
//                   >
//                     <Input.Password prefix={<LockOutlined />} placeholder="Current password" />
//                   </Form.Item>

//                   <Form.Item
//                     name="password"
//                     label="New Password"
//                     rules={[
//                       { required: true, message: 'Please enter new password' },
//                       { min: 8, message: 'Password must be at least 8 characters' },
//                     ]}
//                   >
//                     <Input.Password prefix={<LockOutlined />} placeholder="New password" />
//                   </Form.Item>

//                   <Form.Item
//                     name="password_confirmation"
//                     label="Confirm New Password"
//                     dependencies={['password']}
//                     rules={[
//                       { required: true, message: 'Please confirm your password' },
//                       ({ getFieldValue }) => ({
//                         validator(_, value) {
//                           if (!value || getFieldValue('password') === value) {
//                             return Promise.resolve();
//                           }
//                           return Promise.reject(new Error('Passwords do not match'));
//                         },
//                       }),
//                     ]}
//                   >
//                     <Input.Password prefix={<LockOutlined />} placeholder="Confirm password" />
//                   </Form.Item>

//                   <Alert
//                     message="Security Notice"
//                     description="Changing your password will log you out from all other devices."
//                     type="info"
//                     showIcon
//                     className="mb-4"
//                   />

//                   <Form.Item>
//                     <Button
//                       type="primary"
//                       danger
//                       htmlType="submit"
//                       loading={changingPassword}
//                       icon={<LockOutlined />}
//                       size="large"
//                       block
//                     >
//                       Change Password
//                     </Button>
//                   </Form.Item>
//                 </Form>
//               </Card>

//               {/* Active Sessions */}
//               <Card 
//                 title="Active Sessions" 
//                 className={styles.card} 
//                 bordered={false}
//                 extra={
//                   sessions.length > 1 && (
//                     <Popconfirm
//                       title="Logout from all devices?"
//                       description="This will end all sessions except the current one."
//                       onConfirm={handleRevokeAllOtherSessions}
//                       okText="Yes"
//                       cancelText="No"
//                     >
//                       <Button size="small" danger>
//                         Logout All Others
//                       </Button>
//                     </Popconfirm>
//                   )
//                 }
//               >
//                 <Table
//                   dataSource={sessions}
//                   columns={sessionColumns}
//                   rowKey="id"
//                   pagination={false}
//                   size="small"
//                 />
//               </Card>
//             </div>
//           </TabPane>

//           {/* TAB 3: PREFERENCES */}
//           <TabPane
//             tab={
//               <span>
//                 <SettingOutlined />
//                 Preferences
//               </span>
//             }
//             key="3"
//           >
//             <Card className={styles.card} bordered={false}>
//               <Form
//                 form={preferencesForm}
//                 layout="vertical"
//                 onValuesChange={(_, allValues) => handleUpdatePreferences(allValues)}
//                 size="large"
//               >
//                 <Divider orientation="left">Appearance</Divider>
                
//                 <Form.Item name="theme" label="Theme">
//                   <Select>
//                     <Option value="light">Light</Option>
//                     <Option value="dark">Dark</Option>
//                     <Option value="auto">Auto (System Default)</Option>
//                   </Select>
//                 </Form.Item>

//                 <Form.Item name="language" label="Language">
//                   <Select>
//                     <Option value="en">English</Option>
//                     <Option value="km">Khmer</Option>
//                     <Option value="zh">Chinese</Option>
//                     <Option value="th">Thai</Option>
//                   </Select>
//                 </Form.Item>

//                 <Divider orientation="left">Notifications</Divider>
                
//                 <Form.Item name={['notifications', 'email']} valuePropName="checked">
//                   <div className="flex items-center justify-between">
//                     <div>
//                       <div className={`font-medium ${styles.text}`}>Email Notifications</div>
//                       <div className={`text-sm ${styles.textMuted}`}>Receive notifications via email</div>
//                     </div>
//                     <Switch />
//                   </div>
//                 </Form.Item>

//                 <Form.Item name={['notifications', 'system']} valuePropName="checked">
//                   <div className="flex items-center justify-between">
//                     <div>
//                       <div className={`font-medium ${styles.text}`}>System Notifications</div>
//                       <div className={`text-sm ${styles.textMuted}`}>General system notifications</div>
//                     </div>
//                     <Switch />
//                   </div>
//                 </Form.Item>

//                 <Form.Item name={['notifications', 'booking']} valuePropName="checked">
//                   <div className="flex items-center justify-between">
//                     <div>
//                       <div className={`font-medium ${styles.text}`}>Booking Notifications</div>
//                       <div className={`text-sm ${styles.textMuted}`}>Booking confirmations and updates</div>
//                     </div>
//                     <Switch />
//                   </div>
//                 </Form.Item>

//                 <Form.Item name={['notifications', 'restaurant']} valuePropName="checked">
//                   <div className="flex items-center justify-between">
//                     <div>
//                       <div className={`font-medium ${styles.text}`}>Restaurant Notifications</div>
//                       <div className={`text-sm ${styles.textMuted}`}>Restaurant orders and reservations</div>
//                     </div>
//                     <Switch />
//                   </div>
//                 </Form.Item>

//                 <Form.Item name={['notifications', 'payment']} valuePropName="checked">
//                   <div className="flex items-center justify-between">
//                     <div>
//                       <div className={`font-medium ${styles.text}`}>Payment Notifications</div>
//                       <div className={`text-sm ${styles.textMuted}`}>Payment receipts and confirmations</div>
//                     </div>
//                     <Switch />
//                   </div>
//                 </Form.Item>

//                 <Form.Item name={['notifications', 'marketing']} valuePropName="checked">
//                   <div className="flex items-center justify-between">
//                     <div>
//                       <div className={`font-medium ${styles.text}`}>Marketing Emails</div>
//                       <div className={`text-sm ${styles.textMuted}`}>Promotional offers and updates</div>
//                     </div>
//                     <Switch />
//                   </div>
//                 </Form.Item>

//                 <Alert
//                   message="Preferences are saved automatically"
//                   type="success"
//                   showIcon
//                   className="mt-4"
//                 />
//               </Form>
//             </Card>
//           </TabPane>

//           {/* TAB 4: ACTIVITY HISTORY */}
//           <TabPane
//             tab={
//               <span>
//                 <HistoryOutlined />
//                 Activity History
//               </span>
//             }
//             key="4"
//           >
//             <Card className={styles.card} bordered={false}>
//               {activities.length > 0 ? (
//                 <Timeline
//                   mode="left"
//                   items={activities.map((activity) => ({
//                     color: activity.action.includes('login') ? 'green' : 'blue',
//                     label: activity.created_at,
//                     children: (
//                       <div>
//                         <div className={`font-medium ${styles.text}`}>{activity.description}</div>
//                         <div className={`text-sm ${styles.textMuted} mt-1`}>
//                           {activity.user_agent?.browser} on {activity.user_agent?.platform}
//                         </div>
//                         <div className={`text-xs ${styles.textMuted}`}>
//                           IP: {activity.ip_address}
//                         </div>
//                       </div>
//                     ),
//                   }))}
//                 />
//               ) : (
//                 <Empty description="No activity history" />
//               )}
//             </Card>
//           </TabPane>

//         </Tabs>
//       </div>
//     </div>
//   );
// }
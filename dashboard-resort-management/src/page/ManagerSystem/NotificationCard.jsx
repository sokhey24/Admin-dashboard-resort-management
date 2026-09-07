import { useEffect, useState } from 'react';
import { Button, Empty, Spin, message } from 'antd';
import { useDarkMode } from '../../util/DarkModeContext';
import { useNotificationStore } from '../../store/NotificationStore';
import { request } from '../../util/request';
import { fmtDateTime } from '../../util/fmtDateTime';

function NotificationCard() {
  const dark = useDarkMode();
  const { notifications, markRead, markAllRead, clearAll, syncFromBookings } = useNotificationStore();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('today');

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await request('admin/notifications', 'get');
      if (res?.data?.recent_bookings) {
        syncFromBookings(res.data.recent_bookings);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  // Filter notifications based on tab
  const today = new Date().toDateString();
  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'today') {
      return new Date(n.created_at).toDateString() === today;
    }
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = () => {
    markAllRead();
    message.success('All notifications marked as read');
  };

  const handleClearAll = () => {
    clearAll();
    message.success('All notifications cleared');
  };

  // Styles based on dark mode
  const containerBg = dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#D9E2EC]';
  const borderColor = dark ? 'border-gray-700' : 'border-gray-200';
  const titleColor = dark ? 'text-gray-100' : 'text-gray-900';
  const textColor = dark ? 'text-gray-400' : 'text-gray-500';
  const hoverBg = dark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50';
  const tabActive = dark ? 'text-blue-400 border-blue-400' : 'text-blue-600 border-blue-600';
  const tabInactive = dark ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className="w-full">
      <Spin spinning={loading}>
        <div className={`w-full rounded-xl border shadow-sm overflow-hidden ${containerBg}`}>
          {/* Header */}
          <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className={`text-lg font-semibold ${titleColor}`}>
                Notifications
              </h2>
              {unreadCount > 0 && (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  dark ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-600'
                }`}>
                  {unreadCount} new
                </span>
              )}
            </div>
            
            {/* Tabs + Actions */}
            <div className="flex items-center justify-between mt-3">
              {/* Tabs */}
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setActiveTab('today')}
                  className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
                    activeTab === 'today' ? tabActive : tabInactive
                  }`}
                >
                  Today
                </button>
                <button 
                  onClick={() => setActiveTab('previous')}
                  className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
                    activeTab === 'previous' ? tabActive : tabInactive
                  }`}
                >
                  Previous
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllRead}
                    className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400"
                  >
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button 
                    onClick={handleClearAll}
                    className="text-xs text-red-500 hover:text-red-600"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Notification List */}
          <div className="border-t border-gray-200 dark:border-gray-700 max-h-[400px] overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 text-center">
                <Empty 
                  description={
                    <span className={textColor}>
                      {activeTab === 'today' ? 'No notifications today' : 'No notifications'}
                    </span>
                  } 
                />
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => !notification.read && markRead(notification.id)}
                  className={`grid grid-cols-[10px_40px_1fr_auto] gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700 cursor-pointer transition-colors ${
                    notification.read ? '' : hoverBg
                  }`}
                >
                  {/* Blue notification dot for unread */}
                  <span className={`w-2.5 h-2.5 rounded-full self-center ${notification.read ? 'bg-transparent' : 'bg-blue-500'}`} />

                  {/* Profile avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                    dark ? 'bg-blue-800' : 'bg-blue-500'
                  }`}>
                    {notification.user_name?.charAt(0).toUpperCase() || 'G'}
                  </div>

                  {/* Name + Message */}
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold truncate ${titleColor}`}>
                      {notification.user_name || 'Guest'}
                    </p>
                    <p className={`text-xs truncate ${textColor}`}>
                      New booking: {notification.booking_code}
                    </p>
                    <p className={`text-xs font-medium truncate ${
                      dark ? 'text-blue-400' : 'text-blue-600'
                    }`}>
                      {notification.status?.replace('_', ' ').toUpperCase() || 'PENDING'}
                    </p>
                  </div>

                  {/* Time */}
                  <p className={`text-xs whitespace-nowrap self-center ${textColor}`}>
                    {notification.created_at ? fmtDateTime(notification.created_at) : 'Just now'}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Bottom */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <button className={`text-sm font-medium transition-colors ${
                dark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
              }`}>
                View previous notifications
              </button>
            </div>
          )}
        </div>
      </Spin>
    </div>
  );
}

export default NotificationCard;
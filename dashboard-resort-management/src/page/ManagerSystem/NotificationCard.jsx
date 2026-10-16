import { useMemo, useState } from 'react';
import { Empty, message, Pagination } from 'antd';
import {
  FiCalendar,
  FiShoppingBag,
  FiClock,
  FiCheck,
  FiBell,
  FiUser,
  FiMapPin,
  FiDollarSign,
  FiEye,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';
import { MdRestaurant, MdRoom, MdFastfood } from 'react-icons/md';

import { useDarkMode } from '../../util/DarkModeContext';
import { useNotificationStore } from '../../store/NotificationStore';

/** Map booking sync items from NotificationStore to card display shape. */
function mapStoreNotification(n) {
  const code = n.booking_code ?? n.reference ?? 'â€”';
  const status = n.status ?? 'pending';
  return {
    id: n.id,
    type: 'booking',
    customer: { name: n.user_name || 'Guest' },
    message: `Booking ${code} â€” ${String(status).replace(/_/g, ' ')}`,
    booking_code: code,
    reference: code,
    status,
    created_at: n.created_at,
    time: n.created_at,
    read: Boolean(n.read),
  };
}

function NotificationCard() {
  const dark = useDarkMode();

  const {
    notifications,
    markRead,
    markAllRead,
    clearAll,
  } = useNotificationStore();

  const [activeTab, setActiveTab] = useState('today');
  const [contentTab, setContentTab] = useState('booking');
  const [bookingPage, setBookingPage] = useState(1);
  const [roomPage, setRoomPage] = useState(1);
  const itemsPerPage = 5;

  const displayNotifications = useMemo(
    () => notifications.map(mapStoreNotification),
    [notifications]
  );

  const styles = {
    container: dark
      ? 'bg-gray-900 border-gray-700'
      : 'bg-white border-[#D9E2EC]',
    card: dark
      ? 'bg-gray-800 border-gray-700'
      : 'bg-white border-[#D9E2EC]',
    cardHover: dark
      ? 'hover:bg-gray-750'
      : 'hover:bg-[#F5F8FC]',
    title: dark
      ? 'text-gray-100'
      : 'text-[#102A43]',
    text: dark
      ? 'text-gray-400'
      : 'text-[#486581]',
    muted: dark
      ? 'text-gray-500'
      : 'text-[#829AB1]',
    divider: dark
      ? 'border-gray-700'
      : 'border-[#D9E2EC]',
    activeTab: dark
      ? 'border-[#FF6B00] text-[#FF6B00] bg-gray-800'
      : 'border-[#FF6B00] text-[#FF6B00] bg-white',
    inactiveTab: dark
      ? 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/70'
      : 'border-transparent text-[#486581] hover:text-[#102A43] hover:bg-white/70',
    badge: dark
      ? 'bg-gray-700 text-gray-300'
      : 'bg-[#F5F8FC] text-[#486581]',
  };

  const today = new Date().toDateString();

  const filteredNotifications = useMemo(() => {
    return displayNotifications.filter((notification) => {
      const notificationDate = notification.created_at || notification.time
        ? new Date(notification.created_at || notification.time).toDateString()
        : today;

      if (activeTab === 'today') {
        return notificationDate === today;
      }
      return notificationDate !== today;
    });
  }, [displayNotifications, activeTab, today]);

  const bookingNotifications = useMemo(() => {
    return filteredNotifications.filter((n) => {
      const type = (n.type || '').toLowerCase();
      return type === 'booking' || type === 'order' || type === 'restaurant_order' || n.booking_code;
    });
  }, [filteredNotifications]);

  const roomFoodNotifications = useMemo(() => {
    return filteredNotifications.filter((n) => {
      const type = (n.type || '').toLowerCase();
      return type === 'room' || type === 'food' || type === 'food_order';
    });
  }, [filteredNotifications]);

  const unreadCount = filteredNotifications.filter(n => !n.read).length;
  const bookingUnread = bookingNotifications.filter(n => !n.read).length;
  const roomUnread = roomFoodNotifications.filter(n => !n.read).length;

  const bookingTotalPages = Math.ceil(bookingNotifications.length / itemsPerPage) || 1;
  const roomTotalPages = Math.ceil(roomFoodNotifications.length / itemsPerPage) || 1;

  const paginatedBookingNotifications = useMemo(() => {
    const startIndex = (bookingPage - 1) * itemsPerPage;
    return bookingNotifications.slice(startIndex, startIndex + itemsPerPage);
  }, [bookingNotifications, bookingPage]);

  const paginatedRoomNotifications = useMemo(() => {
    const startIndex = (roomPage - 1) * itemsPerPage;
    return roomFoodNotifications.slice(startIndex, startIndex + itemsPerPage);
  }, [roomFoodNotifications, roomPage]);

  const handleMarkAllRead = () => {
    markAllRead();
    message.success('All notifications marked as read');
  };

  const handleClearAll = () => {
    clearAll();
    message.success('All notifications cleared');
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markRead(notification.id);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const StatusBadge = ({ status }) => {
    const statusConfig = {
      confirmed: { bg: 'bg-[#DCFCE7]', text: 'text-[#16A34A]', darkBg: 'bg-green-900/30', darkText: 'text-green-400' },
      pending: { bg: 'bg-[#FEF9C3]', text: 'text-[#854D0E]', darkBg: 'bg-yellow-900/30', darkText: 'text-yellow-400' },
      checked_in: { bg: 'bg-[#DBEAFE]', text: 'text-[#1E40AF]', darkBg: 'bg-blue-900/30', darkText: 'text-blue-400' },
      ready: { bg: 'bg-[#D1FAE5]', text: 'text-[#059669]', darkBg: 'bg-teal-900/30', darkText: 'text-teal-400' },
      available: { bg: 'bg-[#DCFCE7]', text: 'text-[#16A34A]', darkBg: 'bg-green-900/30', darkText: 'text-green-400' },
      cancelled: { bg: 'bg-[#FEE2E2]', text: 'text-[#991B1B]', darkBg: 'bg-red-900/30', darkText: 'text-red-400' },
      completed: { bg: 'bg-[#E0E7FF]', text: 'text-[#4338CA]', darkBg: 'bg-indigo-900/30', darkText: 'text-indigo-400' },
    };

    const config = statusConfig[status?.toLowerCase()] || statusConfig.pending;
    const bgClass = dark ? config.darkBg : config.bg;
    const textClass = dark ? config.darkText : config.text;

    return (
      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${bgClass} ${textClass}`}>
        {status?.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const BookingNotificationCard = ({ notification }) => {
    const customer = notification.customer || { name: notification.user_name || 'Guest' };
    const initial = customer.name?.charAt(0).toUpperCase() || 'G';
    const type = notification.type?.toLowerCase();
    const isOrder = type === 'order' || type === 'restaurant_order';

    return (
      <div
        onClick={() => handleNotificationClick(notification)}
        className={`
          group relative p-4 rounded-[10px] border cursor-pointer
          transition-all duration-200
          ${styles.card} ${styles.cardHover}
          ${!notification.read ? (dark ? 'bg-gray-800/80' : 'bg-[#FFF3E8]/30') : ''}
        `}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden border-2 border-[#D9E2EC]">
            <div className={`
                w-full h-full flex items-center justify-center font-semibold text-sm
                ${isOrder 
                  ? (dark ? 'bg-orange-900/40 text-orange-400' : 'bg-[#FFF3E8] text-[#FF6B00]')
                  : (dark ? 'bg-blue-900/40 text-blue-400' : 'bg-[#DBEAFE] text-[#1E40AF]')
                }
              `}>
              {initial}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className={`text-[15px] font-semibold ${styles.title}`}>
                {customer.name}
              </h3>
              <span className={`text-[12px] whitespace-nowrap ${styles.muted}`}>
                {formatTime(notification.created_at || notification.time)}
              </span>
            </div>
            <p className={`text-[13px] mb-2 ${styles.text}`}>
              {notification.message || notification.title || 'New notification'}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1 text-[12px] font-medium text-[#FF6B00]">
                {isOrder ? <MdRestaurant size={13} /> : <FiCalendar size={12} />}
                {notification.booking_code || notification.reference || 'N/A'}
              </span>
              <StatusBadge status={notification.status} />
              {!notification.read && (
                <span className="w-2 h-2 rounded-full bg-[#FF6B00]" />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const RoomFoodNotificationCard = ({ notification }) => {
    const type = notification.type?.toLowerCase();
    const isRoom = type === 'room';
    const icon = isRoom ? <MdRoom size={24} /> : <MdFastfood size={24} />;

    return (
      <div
        onClick={() => handleNotificationClick(notification)}
        className={`
          group relative p-4 rounded-[10px] border cursor-pointer
          transition-all duration-200
          ${styles.card} ${styles.cardHover}
          ${!notification.read ? (dark ? 'bg-gray-800/80' : 'bg-[#FFF3E8]/30') : ''}
        `}
      >
        <div className="flex items-start gap-3">
          <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${isRoom ? (dark ? 'bg-purple-900/40 text-purple-400' : 'bg-purple-100 text-purple-600') : (dark ? 'bg-orange-900/40 text-orange-400' : 'bg-orange-100 text-orange-600')}`}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className={`text-[15px] font-semibold ${styles.title}`}>
                {notification.title || 'Update'}
              </h3>
              <span className={`text-[12px] whitespace-nowrap ${styles.muted}`}>
                {formatTime(notification.created_at || notification.time)}
              </span>
            </div>
            <p className={`text-[13px] mb-2 ${styles.text}`}>
              {notification.description || notification.message}
            </p>
            {notification.metadata && (
              <p className={`text-[12px] ${styles.muted}`}>{notification.metadata}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <StatusBadge status={notification.status} />
              {!notification.read && (
                <span className="w-2 h-2 rounded-full bg-[#FF6B00]" />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`rounded-xl border p-4 ${styles.container}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <FiBell className="text-[#FF6B00]" />
          <h2 className={`text-lg font-bold ${styles.title}`}>Notifications</h2>
          {unreadCount > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${styles.badge}`}>
              {unreadCount} unread
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={handleMarkAllRead} className="text-xs font-semibold text-[#FF6B00] hover:underline">
            Mark all read
          </button>
          <button type="button" onClick={handleClearAll} className="text-xs font-semibold text-gray-500 hover:underline">
            Clear
          </button>
        </div>
      </div>

      <div className={`flex gap-2 border-b mb-4 ${styles.divider}`}>
        {['today', 'previous'].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px capitalize ${activeTab === tab ? styles.activeTab : styles.inactiveTab}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className={`flex gap-2 mb-4 ${styles.divider} border-b pb-2`}>
        <button
          type="button"
          onClick={() => setContentTab('booking')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${contentTab === 'booking' ? 'bg-[#FF6B00] text-white' : styles.badge}`}
        >
          Bookings {bookingUnread > 0 && `(${bookingUnread})`}
        </button>
        <button
          type="button"
          onClick={() => setContentTab('room')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${contentTab === 'room' ? 'bg-[#FF6B00] text-white' : styles.badge}`}
        >
          Room & food {roomUnread > 0 && `(${roomUnread})`}
        </button>
      </div>

      {contentTab === 'booking' ? (
        paginatedBookingNotifications.length === 0 ? (
          <Empty description="No booking notifications yet" className="py-8" />
        ) : (
          <div className="space-y-3">
            {paginatedBookingNotifications.map((n) => (
              <BookingNotificationCard key={n.id} notification={n} />
            ))}
            {bookingTotalPages > 1 && (
              <Pagination
                current={bookingPage}
                total={bookingNotifications.length}
                pageSize={itemsPerPage}
                onChange={setBookingPage}
                size="small"
                className="text-center"
              />
            )}
          </div>
        )
      ) : (
        paginatedRoomNotifications.length === 0 ? (
          <Empty description="No room or food notifications" className="py-8" />
        ) : (
          <div className="space-y-3">
            {paginatedRoomNotifications.map((n) => (
              <RoomFoodNotificationCard key={n.id} notification={n} />
            ))}
            {roomTotalPages > 1 && (
              <Pagination
                current={roomPage}
                total={roomFoodNotifications.length}
                pageSize={itemsPerPage}
                onChange={setRoomPage}
                size="small"
                className="text-center"
              />
            )}
          </div>
        )
      )}
    </div>
  );
}

export default NotificationCard;

import { useEffect, useMemo, useState } from 'react';
import { Empty, Spin, message, Pagination } from 'antd';
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
import { request } from '../../util/request';

// ── Sample frontend data for demonstration ────────────────────────
// This sample data structure can be replaced with Laravel API response
const SAMPLE_NOTIFICATIONS = {
  bookings: [
    {
      id: 'b1',
      type: 'booking',
      customer: { 
        name: 'Sok Dara', 
        avatar: 'https://i.pravatar.cc/150?img=1'
      },
      title: 'New room booking received',
      message: 'Deluxe Ocean Suite for 3 nights',
      reference: 'BK-2026-001',
      status: 'confirmed',
      time: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      read: false,
    },
    {
      id: 'b2',
      type: 'booking',
      customer: { 
        name: 'Chenda Ly', 
        avatar: 'https://i.pravatar.cc/150?img=5'
      },
      title: 'Booking check-in today',
      message: 'Junior Villa - Ready for check-in',
      reference: 'BK-2026-002',
      status: 'checked_in',
      time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      read: true,
    },
    {
      id: 'b3',
      type: 'order',
      customer: { 
        name: 'Virak Chen', 
        avatar: 'https://i.pravatar.cc/150?img=8'
      },
      title: 'New restaurant order',
      message: 'Seafood platter and drinks',
      reference: 'ORD-1024',
      status: 'pending',
      time: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      read: false,
    },
    {
      id: 'b4',
      type: 'booking',
      customer: { 
        name: 'Sophea Meas', 
        avatar: 'https://i.pravatar.cc/150?img=9'
      },
      title: 'Extended stay booking',
      message: 'Premium Suite for 7 nights',
      reference: 'BK-2026-003',
      status: 'confirmed',
      time: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      read: false,
    },
    {
      id: 'b5',
      type: 'order',
      customer: { 
        name: 'David Smith', 
        avatar: 'https://i.pravatar.cc/150?img=12'
      },
      title: 'Breakfast order',
      message: 'Continental breakfast for 4 people',
      reference: 'ORD-1025',
      status: 'ready',
      time: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      read: false,
    },
    {
      id: 'b6',
      type: 'booking',
      customer: { 
        name: 'Maria Garcia', 
        avatar: 'https://i.pravatar.cc/150?img=20'
      },
      title: 'Check-out completed',
      message: 'Deluxe Twin Room',
      reference: 'BK-2026-004',
      status: 'completed',
      time: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      read: true,
    },
    {
      id: 'b7',
      type: 'order',
      customer: { 
        name: 'Pheakdey Rith', 
        avatar: 'https://i.pravatar.cc/150?img=15'
      },
      title: 'Room service request',
      message: 'Lunch delivery to Room 205',
      reference: 'ORD-1026',
      status: 'pending',
      time: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      read: false,
    },
    {
      id: 'b8',
      type: 'booking',
      customer: { 
        name: 'Chen Wei', 
        avatar: 'https://i.pravatar.cc/150?img=33'
      },
      title: 'New booking inquiry',
      message: 'Family Suite for 5 guests',
      reference: 'BK-2026-005',
      status: 'pending',
      time: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
      read: false,
    },
  ],
  rooms: [
    {
      id: 'r1',
      type: 'room',
      title: 'Deluxe Ocean Suite',
      description: 'Room 301 - Now available for booking',
      status: 'available',
      image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=300&fit=crop',
      time: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      metadata: '2 Guests • Ocean View • 65 sqm',
      read: false,
    },
    {
      id: 'r2',
      type: 'food',
      title: 'Grilled SeafPlatterood ',
      description: 'Table 5 - Order is ready for serving',
      status: 'ready',
      image: 'https://honest-catch.com/cdn/shop/articles/honest-catch-genusswelt-pulpo-riesengarnelen-vom-grill-featured_eee43b49-dbe0-43dc-861b-806615b36631.jpg?v=1778248386&width=1024',
      time: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      metadata: 'Qty: 2 • $58.00',
      read: false,
    },
    {
      id: 'r3',
      type: 'room',
      title: 'Junior Villa One Bedroom',
      description: 'Room 105 - Maintenance completed',
      status: 'available',
      image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=300&fit=crop',
      time: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      metadata: '4 Guests • Garden View • 85 sqm',
      read: true,
    },
    {
      id: 'r4',
      type: 'food',
      title: 'Tropical Fruit Smoothies',
      description: 'Pool bar - Special order ready',
      status: 'ready',
      image: 'https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=400&h=300&fit=crop',
      time: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
      metadata: 'Qty: 4 • $24.00',
      read: false,
    },
    {
      id: 'r5',
      type: 'room',
      title: 'Premium Triple Balcony Sea View',
      description: 'Room 401 - Early check-in available',
      status: 'available',
      image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=400&h=300&fit=crop',
      time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      metadata: '3 Guests • Sea View • 75 sqm',
      read: false,
    },
    {
      id: 'r6',
      type: 'food',
      title: 'Chef Special Pizza',
      description: 'Restaurant - Order in preparation',
      status: 'pending',
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop',
      time: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
      metadata: 'Qty: 2 • $32.00',
      read: false,
    },
    {
      id: 'r7',
      type: 'food',
      title: 'Cocktail Selection',
      description: 'Beach bar - Order complete',
      status: 'ready',
      image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&h=300&fit=crop',
      time: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
      metadata: 'Qty: 6 • $72.00',
      read: false,
    },
    {
      id: 'r8',
      type: 'room',
      title: 'Deluxe Double Room',
      description: 'Room 208 - Cleaning completed',
      status: 'available',
      image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400&h=300&fit=crop',
      time: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
      metadata: '2 Guests • City View • 45 sqm',
      read: true,
    },
  ],
};

function NotificationCard() {
  const dark = useDarkMode();

  const {
    notifications,
    markRead,
    markAllRead,
    clearAll,
    syncFromBookings,
  } = useNotificationStore();

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('today');
  const [contentTab, setContentTab] = useState('booking'); // 'booking' or 'room'
  
  // Pagination states
  const [bookingPage, setBookingPage] = useState(1);
  const [roomPage, setRoomPage] = useState(1);
  const itemsPerPage = 5;

  // ---------------------------------------------------------
  // Load notifications
  // ---------------------------------------------------------
  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await request('admin/notifications', 'get');
      if (res?.data?.recent_bookings) {
        syncFromBookings(res.data.recent_bookings);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
      message.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  // ---------------------------------------------------------
  // Theme styles (following Manage_WebContent pattern)
  // ---------------------------------------------------------
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

  // ---------------------------------------------------------
  // Filter by Today / Previous
  // ---------------------------------------------------------
  const today = new Date().toDateString();

  const filteredNotifications = useMemo(() => {
    // Use API notifications if available, otherwise use sample data
    const sourceNotifications = notifications.length > 0 
      ? notifications 
      : [...SAMPLE_NOTIFICATIONS.bookings, ...SAMPLE_NOTIFICATIONS.rooms];

    return sourceNotifications.filter((notification) => {
      const notificationDate = notification.created_at || notification.time
        ? new Date(notification.created_at || notification.time).toDateString()
        : today;

      if (activeTab === 'today') {
        return notificationDate === today;
      }
      return notificationDate !== today;
    });
  }, [notifications, activeTab, today]);

  // ---------------------------------------------------------
  // Separate by type (booking/order vs room/food)
  // ---------------------------------------------------------
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

  // Get counts
  const unreadCount = filteredNotifications.filter(n => !n.read).length;
  const bookingUnread = bookingNotifications.filter(n => !n.read).length;
  const roomUnread = roomFoodNotifications.filter(n => !n.read).length;

  // ---------------------------------------------------------
  // Pagination
  // ---------------------------------------------------------
  const bookingTotalPages = Math.ceil(bookingNotifications.length / itemsPerPage);
  const roomTotalPages = Math.ceil(roomFoodNotifications.length / itemsPerPage);

  const paginatedBookingNotifications = useMemo(() => {
    const startIndex = (bookingPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return bookingNotifications.slice(startIndex, endIndex);
  }, [bookingNotifications, bookingPage]);

  const paginatedRoomNotifications = useMemo(() => {
    const startIndex = (roomPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return roomFoodNotifications.slice(startIndex, endIndex);
  }, [roomFoodNotifications, roomPage]);

  // ---------------------------------------------------------
  // Actions
  // ---------------------------------------------------------
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

  // ---------------------------------------------------------
  // Format time
  // ---------------------------------------------------------
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

  // ---------------------------------------------------------
  // Status badge
  // ---------------------------------------------------------
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

  // ---------------------------------------------------------
  // LEFT Column — Customer Booking/Order Notification
  // ---------------------------------------------------------
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
          {/* Avatar */}
          <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden border-2 border-[#D9E2EC]">
            {customer.avatar ? (
              <img 
                src={customer.avatar} 
                alt={customer.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center font-semibold text-sm ${
                    isOrder 
                      ? (dark ? 'bg-orange-900/40 text-orange-400' : 'bg-[#FFF3E8] text-[#FF6B00]')
                      : (dark ? 'bg-blue-900/40 text-blue-400' : 'bg-[#DBEAFE] text-[#1E40AF]')
                  }">${initial}</div>`;
                }}
              />
            ) : (
              <div className={`
                w-full h-full flex items-center justify-center font-semibold text-sm
                ${isOrder 
                  ? (dark ? 'bg-orange-900/40 text-orange-400' : 'bg-[#FFF3E8] text-[#FF6B00]')
                  : (dark ? 'bg-blue-900/40 text-blue-400' : 'bg-[#DBEAFE] text-[#1E40AF]')
                }
              `}>
                {initial}
              </div>
            )}
          </div>

          {/* Content */}
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

  // ---------------------------------------------------------
  // RIGHT Column — Room/Food Notification (richer card)
  // ---------------------------------------------------------
  const RoomFoodNotificationCard = ({ notification }) => {
    const type = notification.type?.toLowerCase();
    const isRoom = type === 'room';
    const icon = isRoom ? <MdRoom size={24} /> : <MdFastfood size={24} />;

    return (
      <div
        onClick={() => handleNotificationClick(notification)}
        className={`
          group relative rounded-[10px] border overflow-hidden cursor-pointer
          transition-all duration-200
          ${styles.card} ${styles.cardHover}
          ${!notification.read ? (dark ? 'bg-gray-800/80' : 'bg-[#F0F9FF]/50') : ''}
        `}
      >
        {/* Image/Icon Area */}
        <div className={`
          relative h-40 flex items-center justify-center
          ${dark ? 'bg-gray-700' : 'bg-[#F5F8FC]'}
        `}>
          {notification.image ? (
            <img src={notification.image} alt={notification.title} className="w-full h-full object-cover" />
          ) : (
            <div className={styles.muted}>
              {icon}
            </div>
          )}
          {!notification.read && (
            <span className="absolute top-2 right-2 w-2.5 h-3.5 rounded-full bg-[#FF6B00]" />
          )}
        </div>

        {/* Content Area */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className={`text-[15px] font-semibold ${styles.title}`}>
              {notification.title || 'Room Update'}
            </h3>
            <span className={`text-[12px] whitespace-nowrap ${styles.muted}`}>
              {formatTime(notification.created_at || notification.time)}
            </span>
          </div>

          <p className={`text-[13px] mb-3 ${styles.text}`}>
            {notification.description || 'Status update available'}
          </p>

          <div className="flex items-center justify-between gap-2 mb-3">
            <StatusBadge status={notification.status} />
            {notification.metadata && (
              <span className={`text-[12px] ${styles.muted}`}>
                {notification.metadata}
              </span>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNotificationClick(notification);
              message.info(`View ${isRoom ? 'Room' : 'Order'}: ${notification.title}`);
            }}
            className={`
              w-full py-2 px-4 rounded-[8px] text-[13px] font-semibold
              flex items-center justify-center gap-1.5
              transition-colors
              ${dark
                ? 'bg-[#FF6B00]/20 text-[#FF6B00] hover:bg-[#FF6B00]/30'
                : 'bg-[#FF6B00] text-white hover:bg-[#e05e00]'
              }
            `}
          >
            <FiEye size={14} />
            {isRoom ? 'View Room' : 'View Order'}
          </button>
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------
  // Render
  // ---------------------------------------------------------
  return (
    <div className="w-full" style={{ fontFamily: 'Inter, Poppins, sans-serif' }}>
      <Spin spinning={loading}>
        <div className={`w-full rounded-[10px] border shadow-sm overflow-hidden ${styles.container}`}>
          
          {/* ================= HEADER ================= */}
          <div className={`px-6 py-5 border-b ${styles.divider}`}>
            {/* Title Row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className={`text-[20px] font-bold ${styles.title} flex items-center gap-2`}>
                    <FiBell className="text-[#FF6B00]" size={20} />
                    Notifications
                  </h1>
                  {unreadCount > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FF6B00]/10 text-[#FF6B00] border border-[#FF6B00]/20">
                      {unreadCount} New
                    </span>
                  )}
                </div>
                <p className={`text-[13px] mt-1 ${styles.text}`}>
                  Monitor bookings, orders, rooms, and food services
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className={`
                      flex items-center gap-1.5 px-3 py-1.5 rounded-[8px]
                      text-[13px] font-semibold transition-colors
                      border
                      ${dark
                        ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
                        : 'border-[#D9E2EC] text-[#486581] hover:bg-[#F5F8FC]'
                      }
                    `}
                  >
                    <FiCheck size={13} />
                    Mark all read
                  </button>
                )}

                {filteredNotifications.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className={`
                      px-3 py-1.5 rounded-[8px] text-[13px] font-semibold
                      transition-colors border
                      ${dark
                        ? 'border-red-900/40 text-red-400 hover:bg-red-900/20'
                        : 'border-red-200 text-red-600 hover:bg-red-50'
                      }
                    `}
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>

            {/* Tabs Container */}
            <div className="flex overflow-x-auto" style={{ borderBottom: dark ? '2px solid #374151' : '2px solid #D9E2EC' }}>
              {/* Today/Previous Tabs */}
              <button
                onClick={() => setActiveTab('today')}
                className={`
                  flex items-center gap-2 px-4 py-2.5 text-[14px] font-semibold
                  whitespace-nowrap border-b-2 transition-colors -mb-[2px]
                  ${activeTab === 'today' ? styles.activeTab : styles.inactiveTab}
                `}
              >
                <FiClock size={14} />
                Today
              </button>

              <button
                onClick={() => setActiveTab('previous')}
                className={`
                  flex items-center gap-2 px-4 py-2.5 text-[14px] font-semibold
                  whitespace-nowrap border-b-2 transition-colors -mb-[2px]
                  ${activeTab === 'previous' ? styles.activeTab : styles.inactiveTab}
                `}
              >
                <FiCalendar size={14} />
                Previous
              </button>

              <div className="flex-1 border-b-2 border-transparent" />

              {/* Content Type Tabs */}
              <button
                onClick={() => setContentTab('booking')}
                className={`
                  flex items-center gap-2 px-4 py-2.5 text-[14px] font-semibold
                  whitespace-nowrap border-b-2 transition-colors -mb-[2px]
                  ${contentTab === 'booking' ? styles.activeTab : styles.inactiveTab}
                `}
              >
                <FiUser size={14} />
                Booking & Order
                {bookingUnread > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FF6B00] text-white">
                    {bookingUnread}
                  </span>
                )}
              </button>

              <button
                onClick={() => setContentTab('room')}
                className={`
                  flex items-center gap-2 px-4 py-2.5 text-[14px] font-semibold
                  whitespace-nowrap border-b-2 transition-colors -mb-[2px]
                  ${contentTab === 'room' ? styles.activeTab : styles.inactiveTab}
                `}
              >
                {/* <MdRoom size={14} /> */}
                {/* Room & Food
                {roomUnread > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FF6B00] text-white">
                    {roomUnread}
                  </span>
                )} */}
              </button>
            </div>
          </div>

          {/* ================= CONTENT ================= */}
          <div className="p-6">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              
              {/* LEFT — Customer Booking/Order */}
              <div className={`rounded-[10px] border overflow-hidden ${styles.card}`}>
                <div className={`px-5 py-4 border-b ${styles.divider}`} style={{ background: dark ? '#1F2937' : '#F5F8FC' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className={`text-[15px] font-semibold ${styles.title}`}>
                        Customer Booking & Order
                      </h2>
                      <p className={`text-[12px] mt-0.5 ${styles.muted}`}>
                        Recent booking and restaurant orders
                      </p>
                    </div>
                    {bookingUnread > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FF6B00]/10 text-[#FF6B00]">
                        {bookingUnread} New
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
                  {paginatedBookingNotifications.length === 0 ? (
                    <div className="py-12">
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                          <span className={styles.text}>
                            No booking or order notifications
                          </span>
                        }
                      />
                    </div>
                  ) : (
                    <>
                      {paginatedBookingNotifications.map((notification) => (
                        <BookingNotificationCard
                          key={notification.id}
                          notification={notification}
                        />
                      ))}
                      
                      {/* Pagination for Bookings */}
                      {bookingTotalPages > 1 && (
                        <div className="pt-4 flex items-center justify-between border-t" style={{ borderColor: dark ? '#374151' : '#D9E2EC' }}>
                          <span className={`text-[12px] ${styles.muted}`}>
                            Showing {((bookingPage - 1) * itemsPerPage) + 1} - {Math.min(bookingPage * itemsPerPage, bookingNotifications.length)} of {bookingNotifications.length}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setBookingPage(prev => Math.max(1, prev - 1))}
                              disabled={bookingPage === 1}
                              className={`
                                p-1.5 rounded-[6px] transition-colors
                                ${bookingPage === 1 
                                  ? 'opacity-40 cursor-not-allowed' 
                                  : (dark ? 'hover:bg-gray-700' : 'hover:bg-[#F5F8FC]')
                                }
                                ${styles.text}
                              `}
                            >
                              <FiChevronLeft size={16} />
                            </button>
                            
                            <div className="flex items-center gap-1">
                              {Array.from({ length: bookingTotalPages }, (_, i) => i + 1).map(page => (
                                <button
                                  key={page}
                                  onClick={() => setBookingPage(page)}
                                  className={`
                                    w-7 h-7 rounded-[6px] text-[13px] font-semibold transition-colors
                                    ${page === bookingPage
                                      ? 'bg-[#FF6B00] text-white'
                                      : (dark 
                                          ? 'text-gray-400 hover:bg-gray-700' 
                                          : 'text-[#486581] hover:bg-[#F5F8FC]')
                                    }
                                  `}
                                >
                                  {page}
                                </button>
                              ))}
                            </div>

                            <button
                              onClick={() => setBookingPage(prev => Math.min(bookingTotalPages, prev + 1))}
                              disabled={bookingPage === bookingTotalPages}
                              className={`
                                p-1.5 rounded-[6px] transition-colors
                                ${bookingPage === bookingTotalPages
                                  ? 'opacity-40 cursor-not-allowed' 
                                  : (dark ? 'hover:bg-gray-700' : 'hover:bg-[#F5F8FC]')
                                }
                                ${styles.text}
                              `}
                            >
                              <FiChevronRight size={16} />
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* RIGHT — Room/Food */}
              <div className={`rounded-[10px] border overflow-hidden ${styles.card}`}>
                <div className={`px-5 py-4 border-b ${styles.divider}`} style={{ background: dark ? '#1F2937' : '#F5F8FC' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className={`text-[15px] font-semibold ${styles.title}`}>
                        Room & Food
                      </h2>
                      <p className={`text-[12px] mt-0.5 ${styles.muted}`}>
                        Room availability and food orders
                      </p>
                    </div>
                    {roomUnread > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FF6B00]/10 text-[#FF6B00]">
                        {roomUnread} New
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
                  {paginatedRoomNotifications.length === 0 ? (
                    <div className="py-12">
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                          <span className={styles.text}>
                            No room or food notifications
                          </span>
                        }
                      />
                    </div>
                  ) : (
                    <>
                      {paginatedRoomNotifications.map((notification) => (
                        <RoomFoodNotificationCard
                          key={notification.id}
                          notification={notification}
                        />
                      ))}
                      
                      {/* Pagination for Rooms/Food */}
                      {roomTotalPages > 1 && (
                        <div className="pt-4 flex items-center justify-between border-t" style={{ borderColor: dark ? '#374151' : '#D9E2EC' }}>
                          <span className={`text-[12px] ${styles.muted}`}>
                            Showing {((roomPage - 1) * itemsPerPage) + 1} - {Math.min(roomPage * itemsPerPage, roomFoodNotifications.length)} of {roomFoodNotifications.length}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setRoomPage(prev => Math.max(1, prev - 1))}
                              disabled={roomPage === 1}
                              className={`
                                p-1.5 rounded-[6px] transition-colors
                                ${roomPage === 1 
                                  ? 'opacity-40 cursor-not-allowed' 
                                  : (dark ? 'hover:bg-gray-700' : 'hover:bg-[#F5F8FC]')
                                }
                                ${styles.text}
                              `}
                            >
                              <FiChevronLeft size={16} />
                            </button>
                            
                            <div className="flex items-center gap-1">
                              {Array.from({ length: roomTotalPages }, (_, i) => i + 1).map(page => (
                                <button
                                  key={page}
                                  onClick={() => setRoomPage(page)}
                                  className={`
                                    w-7 h-7 rounded-[6px] text-[13px] font-semibold transition-colors
                                    ${page === roomPage
                                      ? 'bg-[#FF6B00] text-white'
                                      : (dark 
                                          ? 'text-gray-400 hover:bg-gray-700' 
                                          : 'text-[#486581] hover:bg-[#F5F8FC]')
                                    }
                                  `}
                                >
                                  {page}
                                </button>
                              ))}
                            </div>

                            <button
                              onClick={() => setRoomPage(prev => Math.min(roomTotalPages, prev + 1))}
                              disabled={roomPage === roomTotalPages}
                              className={`
                                p-1.5 rounded-[6px] transition-colors
                                ${roomPage === roomTotalPages
                                  ? 'opacity-40 cursor-not-allowed' 
                                  : (dark ? 'hover:bg-gray-700' : 'hover:bg-[#F5F8FC]')
                                }
                                ${styles.text}
                              `}
                            >
                              <FiChevronRight size={16} />
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Spin>
    </div>
  );
}

export default NotificationCard;
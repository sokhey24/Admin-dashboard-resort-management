function formatNotificationDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function mapServerNotification(row) {
  return {
    id: row.id,
    title: row.title ?? 'Notification',
    message: row.message ?? '',
    date: formatNotificationDate(row.created_at),
    read: Boolean(row.read),
    type: row.type ?? row.category ?? 'system',
    bookingApiId: row.entity_type === 'booking' ? row.entity_id : undefined,
    url: row.url ?? null,
    server: true,
  };
}

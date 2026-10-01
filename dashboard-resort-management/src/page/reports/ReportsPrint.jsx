import dayjs from "dayjs";
import { fmtMoney, fmtPct } from "./reportHelpers";

export default function ReportsPrint({ data, filters, resorts, branches }) {
  if (!data) return null;

  const resortName = resorts.find((r) => String(r.id) === String(filters.resortId))?.name || "All Resorts";
  const branchName = branches.find((b) => String(b.id) === String(filters.branchId))?.name || "All Branches";
  const generated = dayjs().format("YYYY-MM-DD HH:mm");

  const summary = data.summary || {};
  const bookings = data.bookings || {};
  const revenue = data.revenue || {};
  const rooms = data.rooms || {};
  const guests = data.guests || {};
  const rows = data.daily?.rows || [];

  return (
    <div className="reports-print-document p-6 text-sm text-gray-900 bg-white">
      <div className="text-center mb-6 border-b pb-4">
        <h1 className="text-xl font-bold">Resort Operational Report</h1>
        <p className="text-gray-600 mt-1">
          {filters.dateFrom} — {filters.dateTo}
        </p>
        <p className="text-gray-500 text-xs mt-1">
          {resortName} · {branchName} · Generated {generated}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="border rounded p-3">
          <p className="text-xs uppercase text-gray-500">Bookings</p>
          <p className="text-lg font-bold">{summary.total_bookings ?? 0}</p>
        </div>
        <div className="border rounded p-3">
          <p className="text-xs uppercase text-gray-500">Revenue (paid)</p>
          <p className="text-lg font-bold">{fmtMoney(summary.revenue)}</p>
        </div>
        <div className="border rounded p-3">
          <p className="text-xs uppercase text-gray-500">Occupancy</p>
          <p className="text-lg font-bold">{fmtPct(summary.occupancy_rate)}</p>
        </div>
        <div className="border rounded p-3">
          <p className="text-xs uppercase text-gray-500">Guest headcount</p>
          <p className="text-lg font-bold">{summary.total_guests ?? 0}</p>
        </div>
      </div>

      <h2 className="font-semibold mb-2">Bookings</h2>
      <p className="mb-4 text-gray-700">
        Total {bookings.total ?? 0} — Pending {bookings.pending ?? 0}, Confirmed {bookings.confirmed ?? 0},
        Checked in {bookings.checked_in ?? 0}, Completed {bookings.completed ?? 0}, Cancelled {bookings.cancelled ?? 0}
      </p>

      <h2 className="font-semibold mb-2">Revenue</h2>
      <p className="mb-4 text-gray-700">
        Gross {fmtMoney(revenue.gross_revenue)} · Paid {fmtMoney(revenue.paid_amount)} · Pending {fmtMoney(revenue.pending_amount)}
        · Refunded {fmtMoney(revenue.refunded_amount)} · Discount {fmtMoney(revenue.discount_amount)}
      </p>

      <h2 className="font-semibold mb-2">Rooms</h2>
      <p className="mb-4 text-gray-700">
        {rooms.total ?? 0} rooms — Occupied {rooms.occupied ?? 0}, Available {rooms.available ?? 0},
        Maintenance {rooms.maintenance ?? 0} ({fmtPct(rooms.occupancy_rate)} occupancy)
      </p>

      <h2 className="font-semibold mb-2">Guests</h2>
      <p className="mb-6 text-gray-700">
        Headcount {guests.guest_headcount ?? 0} · Unique {guests.unique_guests ?? 0} · New {guests.new_guests ?? 0} · Returning {guests.returning_guests ?? 0}
      </p>

      <h2 className="font-semibold mb-2">Daily breakdown</h2>
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left py-1">Date</th>
            <th className="text-right py-1">Bookings</th>
            <th className="text-right py-1">Guests</th>
            <th className="text-right py-1">Paid</th>
            <th className="text-right py-1">Active stays</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.date} className="border-b border-gray-100">
              <td className="py-1">{row.date}</td>
              <td className="text-right py-1">{row.bookings}</td>
              <td className="text-right py-1">{row.guests}</td>
              <td className="text-right py-1">{fmtMoney(row.paid)}</td>
              <td className="text-right py-1">{row.active_stays}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

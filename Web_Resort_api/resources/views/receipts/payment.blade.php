<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Payment Receipt — {{ $data['payment_id'] ?? '' }}</title>
<style>
  /* ── Reset & Base ── */
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'DejaVu Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
    font-size: 12px;
    line-height: 1.55;
    color: #111827;
    background: #fff;
  }

  /* ── Page Layout ── */
  .page {
    width: 100%;
    max-width: 680px;
    margin: 0 auto;
    padding: 36px 40px 40px;
  }

  /* ── Header ── */
  .header {
    text-align: center;
    border-bottom: 2.5px solid #111827;
    padding-bottom: 18px;
    margin-bottom: 20px;
  }
  .header .logo {
    max-height: 56px;
    max-width: 160px;
    margin-bottom: 8px;
  }
  .header .business-name {
    font-size: 20px;
    font-weight: 700;
    letter-spacing: -0.3px;
    color: #111827;
  }
  .header .branch-name {
    font-size: 13px;
    color: #4b5563;
    margin-top: 2px;
  }
  .header .contact {
    font-size: 10px;
    color: #9ca3af;
    margin-top: 4px;
  }

  /* ── Receipt Title ── */
  .receipt-title-wrap {
    text-align: center;
    margin-bottom: 22px;
  }
  .receipt-title {
    display: inline-block;
    font-size: 14px;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    padding-bottom: 5px;
    border-bottom: 3px solid #111827;
    color: #111827;
  }
  .receipt-title.refund {
    color: #ea580c;
    border-color: #ea580c;
  }

  /* ── Status Badge ── */
  .status-badge {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 20px;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .status-paid      { background: #dcfce7; color: #166534; }
  .status-pending   { background: #fef9c3; color: #854d0e; }
  .status-refunded  { background: #ffedd5; color: #9a3412; }
  .status-cancelled { background: #fee2e2; color: #991b1b; }
  .status-failed    { background: #fee2e2; color: #991b1b; }

  /* ── Two-column layout ── */
  .two-col {
    display: table;
    width: 100%;
    margin-bottom: 16px;
  }
  .two-col .col {
    display: table-cell;
    width: 50%;
    vertical-align: top;
    padding-right: 12px;
  }
  .two-col .col:last-child {
    padding-right: 0;
    padding-left: 12px;
  }

  /* ── Block Section ── */
  .block {
    margin-bottom: 16px;
  }
  .block-title {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #9ca3af;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 4px;
    margin-bottom: 7px;
  }

  /* ── Row ── */
  .row {
    display: table;
    width: 100%;
    padding: 3px 0;
    border-top: none;
  }
  .row.border-top { border-top: 1px solid #e5e7eb; padding-top: 6px; margin-top: 2px; }
  .row .label {
    display: table-cell;
    color: #6b7280;
    font-size: 11px;
    width: 48%;
  }
  .row .value {
    display: table-cell;
    color: #111827;
    font-size: 11px;
    text-align: right;
    font-weight: 400;
  }
  .row .value.bold   { font-weight: 700; }
  .row .value.green  { color: #16a34a; font-weight: 700; }
  .row .value.orange { color: #ea580c; font-weight: 700; }
  .row .value.yellow { color: #d97706; }

  /* ── Divider ── */
  .divider {
    border: none;
    border-top: 1px solid #e5e7eb;
    margin: 14px 0;
  }
  .divider-thick {
    border: none;
    border-top: 2px solid #e5e7eb;
    margin: 18px 0;
  }

  /* ── Footer ── */
  .footer {
    border-top: 1px solid #e5e7eb;
    padding-top: 16px;
    margin-top: 8px;
    text-align: center;
  }
  .footer .thank-you {
    font-size: 13px;
    font-weight: 600;
    color: #111827;
    margin-bottom: 8px;
  }
  .footer .meta {
    font-size: 10px;
    color: #9ca3af;
    line-height: 1.6;
  }
  .footer .sys {
    font-size: 9px;
    color: #d1d5db;
    margin-top: 4px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  /* ── Notes box ── */
  .notes-box {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
    padding: 8px 10px;
    font-size: 11px;
    color: #374151;
    margin-bottom: 16px;
  }
</style>
</head>
<body>
<div class="page">

  {{-- ── Header ── --}}
  <div class="header">
    @php
      $logoSrc = $data['reference']['resort']['logo']
               ?? $data['reference']['restaurant']['logo']
               ?? null;
      $bizName = $data['reference']['resort']['name']
               ?? $data['reference']['restaurant']['name']
               ?? 'Grand Resort & Restaurant';
      $bizPhone = $data['reference']['resort']['phone']
                ?? $data['reference']['restaurant']['phone']
                ?? '';
      $bizEmail = $data['reference']['resort']['email']
                ?? $data['reference']['restaurant']['email']
                ?? '';
      $branchName = $data['reference']['branch']['name'] ?? null;
    @endphp

    @if($logoSrc)
      <img src="{{ public_path('storage/' . ltrim($logoSrc, '/storage/')) }}" alt="Logo" class="logo">
    @endif
    <div class="business-name">{{ $bizName }}</div>
    @if($branchName)
      <div class="branch-name">{{ $branchName }}</div>
    @endif
    <div class="contact">
      @if($bizPhone){{ $bizPhone }}@endif
      @if($bizPhone && $bizEmail) &nbsp;·&nbsp; @endif
      @if($bizEmail){{ $bizEmail }}@endif
    </div>
  </div>

  {{-- ── Receipt Title ── --}}
  @php
    $isRefund = strtolower($data['status'] ?? '') === 'refunded';
    $isResort = ($data['source'] ?? '') === 'resort';
    $title    = $isRefund ? 'REFUND RECEIPT' : 'PAYMENT RECEIPT';
  @endphp
  <div class="receipt-title-wrap">
    <span class="receipt-title {{ $isRefund ? 'refund' : '' }}">{{ $title }}</span>
  </div>

  {{-- ── Two-column: Receipt Info + Guest Info ── --}}
  <div class="two-col">
    <div class="col">
      <div class="block">
        <div class="block-title">Receipt Information</div>
        <div class="row">
          <span class="label">Payment ID</span>
          <span class="value bold">{{ $data['payment_id'] ?? '—' }}</span>
        </div>
        @if(!empty($data['transaction_id']))
        <div class="row">
          <span class="label">Transaction ID</span>
          <span class="value">{{ $data['transaction_id'] }}</span>
        </div>
        @endif
        @if(!empty($data['payment_reference']))
        <div class="row">
          <span class="label">Reference</span>
          <span class="value">{{ $data['payment_reference'] }}</span>
        </div>
        @endif
        <div class="row">
          <span class="label">Date</span>
          <span class="value">{{ $data['paid_at'] ? \Carbon\Carbon::parse($data['paid_at'])->format('d M Y') : '—' }}</span>
        </div>
        <div class="row">
          <span class="label">Time</span>
          <span class="value">{{ $data['paid_at'] ? \Carbon\Carbon::parse($data['paid_at'])->format('h:i:s A') : '—' }}</span>
        </div>
        <div class="row">
          <span class="label">Payment Method</span>
          <span class="value">{{ $data['payment_method'] ?? '—' }}</span>
        </div>
        @if(!empty($data['gateway']))
        <div class="row">
          <span class="label">Gateway</span>
          <span class="value">{{ $data['gateway'] }}</span>
        </div>
        @endif
        @if(!empty($data['card_last4']))
        <div class="row">
          <span class="label">Card</span>
          <span class="value">**** **** **** {{ $data['card_last4'] }}</span>
        </div>
        @endif
        <div class="row">
          <span class="label">Status</span>
          <span class="value">
            <span class="status-badge status-{{ strtolower($data['status'] ?? 'pending') }}">
              {{ ucfirst($data['status'] ?? 'Pending') }}
            </span>
          </span>
        </div>
      </div>
    </div>

    <div class="col">
      {{-- ── Guest Information ── --}}
      <div class="block">
        <div class="block-title">Guest Information</div>
        <div class="row">
          <span class="label">Name</span>
          <span class="value">{{ $data['guest']['name'] ?? '—' }}</span>
        </div>
        @if(!empty($data['guest']['id']))
        <div class="row">
          <span class="label">Guest ID</span>
          <span class="value">USR-{{ $data['guest']['id'] }}</span>
        </div>
        @endif
        <div class="row">
          <span class="label">Phone</span>
          <span class="value">{{ $data['guest']['phone'] ?? '—' }}</span>
        </div>
        <div class="row">
          <span class="label">Email</span>
          <span class="value">{{ $data['guest']['email'] ?? '—' }}</span>
        </div>
      </div>

      {{-- ── Source Information ── --}}
      @if($isResort)
      <div class="block">
        <div class="block-title">Booking Details</div>
        <div class="row">
          <span class="label">Booking ID</span>
          <span class="value bold">{{ $data['reference']['booking_code'] ?? '—' }}</span>
        </div>
        @php
          $rooms = collect($data['reference']['rooms'] ?? [])
                      ->pluck('room_number')
                      ->filter()
                      ->implode(', ');
        @endphp
        @if($rooms)
        <div class="row">
          <span class="label">Room / Villa</span>
          <span class="value">{{ $rooms }}</span>
        </div>
        @endif
        <div class="row">
          <span class="label">Check-in</span>
          <span class="value">{{ $data['reference']['check_in'] ? \Carbon\Carbon::parse($data['reference']['check_in'])->format('d M Y') : '—' }}</span>
        </div>
        <div class="row">
          <span class="label">Check-out</span>
          <span class="value">{{ $data['reference']['check_out'] ? \Carbon\Carbon::parse($data['reference']['check_out'])->format('d M Y') : '—' }}</span>
        </div>
        @if(!empty($data['reference']['status']))
        <div class="row">
          <span class="label">Booking Status</span>
          <span class="value">{{ ucwords(str_replace('_', ' ', $data['reference']['status'])) }}</span>
        </div>
        @endif
      </div>
      @else
      <div class="block">
        <div class="block-title">Order Details</div>
        <div class="row">
          <span class="label">Order ID</span>
          <span class="value bold">{{ $data['reference']['order_code'] ?? '—' }}</span>
        </div>
        @if(!empty($data['reference']['table']['table_number']))
        <div class="row">
          <span class="label">Table</span>
          <span class="value">{{ $data['reference']['table']['table_number'] }}</span>
        </div>
        @endif
        @if(!empty($data['reference']['table']['location']))
        <div class="row">
          <span class="label">Location</span>
          <span class="value">{{ $data['reference']['table']['location'] }}</span>
        </div>
        @endif
        <div class="row">
          <span class="label">Order Date</span>
          <span class="value">{{ $data['reference']['created_at'] ? \Carbon\Carbon::parse($data['reference']['created_at'])->format('d M Y') : '—' }}</span>
        </div>
        @if(!empty($data['reference']['status']))
        <div class="row">
          <span class="label">Order Status</span>
          <span class="value">{{ ucfirst($data['reference']['status']) }}</span>
        </div>
        @endif
      </div>
      @endif
    </div>
  </div>

  @php
    $bd = $data['breakdown'] ?? [];
    $currency = $data['currency'] ?? 'USD';
    $sym = $currency === 'USD' ? '$' : $currency . ' ';
    $fmt = fn($v) => $sym . number_format((float)($v ?? 0), 2);
    $pct = fn($v) => rtrim(rtrim(number_format((float)($v ?? 0), 2), '0'), '.');
  @endphp

  {{-- ── Room Charges (snapshot taken when the booking was made) ── --}}
  @if($isResort && !empty($data['reference']['rooms']))
  <div class="block">
    <div class="block-title">Room Charges</div>
    @foreach($data['reference']['rooms'] as $r)
    <div class="row">
      <span class="label">{{ $r['room_number'] ?? '—' }}{{ !empty($r['room_type']) ? ' · ' . $r['room_type'] : '' }}</span>
      <span class="value">{{ $fmt($r['price_per_night'] ?? 0) }} × {{ (int)($r['nights'] ?? 1) }} = {{ $fmt($r['subtotal'] ?? 0) }}</span>
    </div>
    @if(($r['discount_percent'] ?? 0) > 0)
    <div class="row">
      <span class="label">&nbsp;&nbsp;&nbsp;Discount {{ $pct($r['discount_percent']) }}%</span>
      <span class="value">− {{ $fmt($r['discount_amount'] ?? 0) }} = {{ $fmt($r['net_subtotal'] ?? 0) }}</span>
    </div>
    @endif
    @endforeach
  </div>
  @endif

  {{-- ── Payment Breakdown ── --}}
  <div class="block">
    <div class="block-title">Payment Breakdown</div>
    <div class="row">
      <span class="label">Original Subtotal</span>
      <span class="value">{{ $fmt($bd['subtotal'] ?? 0) }}</span>
    </div>
    @if(($bd['room_discount_total'] ?? 0) > 0)
    <div class="row">
      <span class="label">Room Discount ({{ $pct($bd['room_discount_percent'] ?? 0) }}%)</span>
      <span class="value">− {{ $fmt($bd['room_discount_total']) }}</span>
    </div>
    @endif
    @if(($bd['coupon_discount'] ?? 0) > 0)
    <div class="row">
      <span class="label">Coupon{{ !empty($bd['coupon_code']) ? ' (' . $bd['coupon_code'] . ')' : '' }}</span>
      <span class="value">− {{ $fmt($bd['coupon_discount']) }}</span>
    </div>
    @endif
    @if(($bd['discount'] ?? 0) > 0 && !isset($bd['room_discount_total']) && !isset($bd['coupon_discount']))
    <div class="row">
      <span class="label">Discount</span>
      <span class="value">− {{ $fmt($bd['discount'] ?? 0) }}</span>
    </div>
    @endif
    @if(($bd['discount'] ?? 0) > 0)
    <div class="row">
      <span class="label">Discounted Subtotal</span>
      <span class="value bold">{{ $fmt($bd['discounted_subtotal'] ?? (($bd['subtotal'] ?? 0) - ($bd['discount'] ?? 0))) }}</span>
    </div>
    @endif
    @if(($bd['tax'] ?? 0) > 0)
    <div class="row">
      <span class="label">Tax</span>
      <span class="value">{{ $fmt($bd['tax'] ?? 0) }}</span>
    </div>
    @endif
    @if(($bd['service_charge'] ?? 0) > 0)
    <div class="row">
      <span class="label">Service Charge</span>
      <span class="value">{{ $fmt($bd['service_charge'] ?? 0) }}</span>
    </div>
    @endif
    <div class="row border-top">
      <span class="label">Total Amount</span>
      <span class="value green">{{ $fmt($bd['total'] ?? $data['amount'] ?? 0) }}</span>
    </div>
    <div class="row">
      <span class="label">Paid Amount</span>
      <span class="value bold">{{ $fmt($bd['paid'] ?? 0) }}</span>
    </div>
    @if(($bd['balance'] ?? 0) > 0)
    <div class="row">
      <span class="label">Remaining Balance</span>
      <span class="value yellow">{{ $fmt($bd['balance'] ?? 0) }}</span>
    </div>
    @endif
    @if(($bd['refund'] ?? 0) > 0)
    <div class="row">
      <span class="label">Refund Amount</span>
      <span class="value orange">{{ $fmt($bd['refund'] ?? 0) }}</span>
    </div>
    @endif
    @if(!empty($data['refunded_at']))
    <div class="row">
      <span class="label">Refunded At</span>
      <span class="value">{{ \Carbon\Carbon::parse($data['refunded_at'])->format('d M Y, h:i A') }}</span>
    </div>
    @endif
  </div>

  {{-- ── Notes ── --}}
  @if(!empty($data['notes']))
  <div class="notes-box">
    <strong style="font-size:10px; color:#6b7280; text-transform:uppercase; letter-spacing:0.06em;">Note:</strong>
    <div style="margin-top:4px;">{{ $data['notes'] }}</div>
  </div>
  @endif

  {{-- ── Footer ── --}}
  <div class="footer">
    <div class="thank-you">Thank you for your payment.</div>
    <div class="meta">
      Generated: {{ \Carbon\Carbon::now()->format('d M Y, h:i:s A') }}<br>
      @if(!empty($data['generated_by']))
        Generated by: Admin #{{ $data['generated_by'] }}<br>
      @endif
    </div>
    <div class="sys">Resort Management System</div>
  </div>

</div>
</body>
</html>

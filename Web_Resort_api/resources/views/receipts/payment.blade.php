<!DOCTYPE html>
<html lang="km">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
<title>Invoice — {{ $doc['invoice']['invoice_number'] ?? $data['payment_id'] ?? '' }}</title>
<style>
  @font-face {
    font-family: 'KhmerFont';
    src: url('{{ storage_path("fonts/KantumruyPro-Regular.ttf") }}') format('truetype');
    font-weight: normal;
    font-style: normal;
  }
  @font-face {
    font-family: 'KhmerFont';
    src: url('{{ storage_path("fonts/Siemreap.ttf") }}') format('truetype');
    font-weight: bold;
    font-style: normal;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'KhmerFont', 'DejaVu Sans', sans-serif;
    font-size: 10.5px;
    color: #0f172a;
    background: #fff;
    line-height: 1.6;
  }
  .wrap { max-width: 360px; margin: 0 auto; border-radius: 8px; overflow: hidden; page-break-inside: avoid; }
  .header { background: #0b1a2e; color: #fff; padding: 12px 14px; }
  .header-table { width: 100%; border-collapse: collapse; }
  .brand-cell { vertical-align: middle; }
  .logo { width: 40px; height: 40px; border-radius: 6px; object-fit: cover; border: 2px solid #c9a22788; }
  .brand { font-size: 13px; font-weight: bold; color: #c9a227; text-transform: uppercase; }
  .sub { font-size: 8.5px; color: #cbd5e1; margin-top: 3px; }
  .amount-label { font-size: 8.5px; color: #94a3b8; text-align: right; }
  .amount { font-size: 17px; font-weight: bold; color: #c9a227; text-align: right; }
  .status-bar { padding: 7px 14px; border-bottom: 1px solid #e2c96b88; }
  .status-bar-table { width: 100%; }
  .status { font-size: 10px; font-weight: bold; text-align: right; text-transform: uppercase; }
  .status-paid { color: #15803d; }
  .status-pending { color: #a16207; }
  .body { padding: 4px 14px 14px; }
  .section {
    background: #f8fafc;
    margin: 9px -14px 4px;
    padding: 5px 14px;
    font-size: 9px;
    font-weight: bold;
    color: #475569;
    border-top: 1px solid #e2e8f0;
    border-bottom: 1px solid #e2e8f0;
  }
  .row { width: 100%; padding: 5px 0; border-bottom: 1px solid #e2c96b33; }
  .row-table { width: 100%; border-collapse: collapse; }
  .label { color: #334155; font-size: 9.5px; }
  .value { text-align: right; font-size: 9.5px; font-weight: 500; color: #0f172a; }
  .value-bold { font-weight: bold; }
  .total-line { border-bottom: 2px solid #0f172a; margin: 6px 0 2px; height: 0; }
  .balance-box { background: #faf3d4; border: 1px solid #e2c96b99; border-radius: 6px; padding: 7px 10px; margin-top: 4px; }
  .balance-table { width: 100%; }
  .balance-label { font-weight: bold; color: #0b1a2e; font-size: 9.5px; }
  .balance-value { font-size: 13.5px; font-weight: bold; color: #c9a227; text-align: right; }
  .footer { margin-top: 12px; padding-top: 8px; border-top: 1px dashed #cbd5e1; text-align: center; font-size: 8px; color: #94a3b8; line-height: 1.5; }
</style>
</head>
<body>
@php
  $fmt = fn ($v) => '$' . number_format((float) ($v ?? 0), 2);
  $fmtKhr = fn ($v) => number_format(round(((float) ($v ?? 0)) * 4100)) . ' ៛';
  $inv = $doc['invoice'] ?? [];
  $booking = $doc['booking'] ?? [];
  $guest = $doc['guest'] ?? [];
  $stay = $doc['stay'] ?? [];
  $bd = $doc['breakdown'] ?? [];
  $resort = $booking['resort'] ?? [];
  $brand = strtoupper($resort['name'] ?? 'SOLARA RESORT & SPA');
  $status = strtolower($inv['status'] ?? 'pending');
  $statusLabel = match ($status) {
    'paid' => 'បានទូទាត់រួច / PAID',
    'partial' => 'ទូទាត់មួយផ្នែក / PARTIAL',
    'pending' => 'រង់ចាំទូទាត់ / PENDING',
    default => strtoupper($status),
  };
  $statusClass = $status === 'paid' ? 'status-paid' : 'status-pending';
  $issued = !empty($inv['issued_at']) ? \Carbon\Carbon::parse($inv['issued_at']) : null;
  $issuedStr = $issued ? $issued->format('d/m/Y') . ' • ' . $issued->format('H:i') : '—';
  $account = !empty($guest['name'])
    ? $guest['name'] . (!empty($guest['id']) ? ' - ID ' . $guest['id'] : '')
    : '—';
  $payMethod = $doc['payments'][0]['payment_method'] ?? ($data['payment_method'] ?? '—');
  $paidBefore = max(0, (float)($bd['paid'] ?? 0) - (float)($doc['payments'][0]['amount'] ?? $data['amount'] ?? 0));
  $supportEmail = $resort['email'] ?? 'contact@solara-resort.com';
  $fmtDate = fn ($v) => $v ? \Carbon\Carbon::parse($v)->format('d/m/Y') : '—';
  $logoPath = $doc['logo_path'] ?? null;
  $totalAmount = (float) ($bd['total'] ?? 0);
@endphp
<div class="wrap">
  <div class="header">
    <table class="header-table">
      <tr>
        <td class="brand-cell">
          <table><tr>
            @if($logoPath && file_exists($logoPath))
            <td style="padding-right:8px;vertical-align:middle;"><img class="logo" src="{{ $logoPath }}" alt=""></td>
            @endif
            <td style="vertical-align:middle;">
              <div class="brand">{{ $brand }}</div>
              <div class="sub">វិក្កយបត្រ / INVOICE RECEIPT</div>
            </td>
          </tr></table>
        </td>
        <td style="vertical-align:top;">
          <div class="amount-label">សរុប / Amount</div>
          <div class="amount">{{ $fmt($totalAmount) }}</div>
          <div style="font-size: 8px; color: #e2c96b; text-align: right;">{{ $fmtKhr($totalAmount) }}</div>
        </td>
      </tr>
    </table>
  </div>
  <div class="status-bar">
    <table class="status-bar-table">
      <tr>
        <td><strong>វិក្កយបត្រ / Invoice</strong></td>
        <td class="status {{ $statusClass }}">{{ $statusLabel }}</td>
      </tr>
    </table>
  </div>
  <div class="body">
    <div class="section">ព័ត៌មានប្រតិបត្តិការ / Transaction Details</div>
    <div class="row"><table class="row-table"><tr><td class="label">លេខប្រតិបត្តិការ / Transaction No.</td><td class="value value-bold">{{ $inv['invoice_number'] ?? '—' }}</td></tr></table></div>
    <div class="row"><table class="row-table"><tr><td class="label">ប្រភេទ / Type</td><td class="value">ការស្នាក់នៅ / Stay & Accommodation</td></tr></table></div>
    <div class="row"><table class="row-table"><tr><td class="label">កាលបរិច្ឆេទ / Date &amp; Time</td><td class="value">{{ $issuedStr }}</td></tr></table></div>
    <div class="row"><table class="row-table"><tr><td class="label">ភ្ញៀវស្នាក់នៅ / Guest</td><td class="value">{{ $account }}</td></tr></table></div>
    <div class="row"><table class="row-table"><tr><td class="label">កូដកក់ / Booking Code</td><td class="value">{{ $booking['booking_code'] ?? '—' }}</td></tr></table></div>
    <div class="row"><table class="row-table"><tr><td class="label">វិធីសាស្ត្រទូទាត់ / Payment Method</td><td class="value">{{ strtoupper($payMethod) }}</td></tr></table></div>

    @if(!empty($stay['check_in']) || !empty($stay['check_out']))
    <div class="section">ព័ត៌មានការស្នាក់នៅ / Stay Details</div>
    <div class="row"><table class="row-table"><tr><td class="label">ថ្ងៃចូល / Check-in</td><td class="value">{{ $fmtDate($stay['check_in'] ?? null) }}</td></tr></table></div>
    <div class="row"><table class="row-table"><tr><td class="label">ថ្ងៃចេញ / Check-out</td><td class="value">{{ $fmtDate($stay['check_out'] ?? null) }}</td></tr></table></div>
    <div class="row"><table class="row-table"><tr><td class="label">ចំនួនយប់ / Nights</td><td class="value">{{ $stay['nights'] ?? '—' }} យប់</td></tr></table></div>
    @endif

    <div class="section">សេចក្តីសង្ខេបការទូទាត់ / Payment Summary</div>
    <div class="row"><table class="row-table"><tr><td class="label">តម្លៃដើម / Subtotal</td><td class="value">{{ $fmt($bd['subtotal'] ?? 0) }}</td></tr></table></div>
    @if(($bd['room_discount_total'] ?? 0) > 0)
    <div class="row"><table class="row-table"><tr><td class="label">បញ្ចុះតម្លៃបន្ទប់ / Room Discount</td><td class="value">- {{ $fmt($bd['room_discount_total']) }}</td></tr></table></div>
    @endif
    @if(($bd['coupon_discount'] ?? 0) > 0)
    <div class="row"><table class="row-table"><tr><td class="label">ប័ណ្ណបញ្ចុះតម្លៃ / Coupon</td><td class="value">- {{ $fmt($bd['coupon_discount']) }}</td></tr></table></div>
    @endif
    <div class="row"><table class="row-table"><tr><td class="label">ពន្ធរដ្ឋ / Tax</td><td class="value">{{ $fmt($bd['tax'] ?? 0) }}</td></tr></table></div>
    <div class="row"><table class="row-table"><tr><td class="label">សេវាកម្ម / Service Charge</td><td class="value">{{ $fmt($bd['service_charge'] ?? 0) }}</td></tr></table></div>
    <div class="total-line"></div>
    <div class="row">
      <table class="row-table">
        <tr>
          <td class="label"><strong>សរុប / Total Amount</strong></td>
          <td class="value value-bold">
            <div>{{ $fmt($bd['total'] ?? 0) }}</div>
            <div style="font-size: 8px; color: #a16207;">({{ $fmtKhr($bd['total'] ?? 0) }})</div>
          </td>
        </tr>
      </table>
    </div>

    <div class="section">សមតុល្យ / Balance</div>
    <div class="row"><table class="row-table"><tr><td class="label">បានបង់ពីមុន / Previous Paid</td><td class="value">{{ $fmt($paidBefore) }}</td></tr></table></div>
    <div class="row"><table class="row-table"><tr><td class="label">បានទូទាត់សរុប / Total Paid</td><td class="value">{{ $fmt($bd['paid'] ?? 0) }}</td></tr></table></div>
    <div class="balance-box">
      <table class="balance-table">
        <tr>
          <td class="balance-label">សមតុល្យនៅខ្វះ / Balance Due</td>
          <td class="balance-value">{{ $fmt($bd['balance'] ?? 0) }}</td>
        </tr>
      </table>
    </div>

    <div class="footer">
      <div>មានចម្ងល់? សូមទាក់ទងមកកាន់ {{ $supportEmail }}</div>
      <div style="margin-top:2px;">Questions? Contact customer care at {{ $supportEmail }}</div>
      <div style="margin-top:4px;font-style:italic;">វិក្កយបត្រនេះបង្កើតឡើងដោយប្រព័ន្ធស្វ័យប្រវត្តិ — មិនទាមទារហត្ថលេខា / Computer generated receipt</div>
    </div>
  </div>
</div>
</body>
</html>

<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Staff booking alert</title>
</head>
<body style="font-family: sans-serif; line-height: 1.5; color: #222;">
    <p><strong>{{ $kind === 'paid' ? 'Payment recorded' : 'New booking' }}</strong></p>
    <p>Booking: {{ $booking->booking_code }} (ID {{ $booking->id }})</p>
    <p>Guest: {{ $booking->user?->name }} — {{ $booking->user?->email }}</p>
    <p>Resort: {{ $booking->resort?->name }}</p>
    <p>Stay: {{ $booking->check_in?->toDateString() }} → {{ $booking->check_out?->toDateString() }}</p>
    <p>Total: {{ number_format((float) $booking->total_amount, 2) }} USD</p>
    @if($payment)
        <p>Payment {{ $payment->payment_id ?? $payment->id }}: {{ number_format((float) $payment->paid_amount, 2) }} USD ({{ $payment->payment_method ?? $payment->method }})</p>
    @endif
</body>
</html>

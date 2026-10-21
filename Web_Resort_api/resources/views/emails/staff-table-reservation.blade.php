<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Table reservation</title>
</head>
<body style="font-family: sans-serif; line-height: 1.5; color: #222;">
    <p><strong>Table reservation request #{{ $reservation->id }}</strong></p>
    <p>Guest: {{ $reservation->guest_name }} — {{ $reservation->guest_email }} — {{ $reservation->guest_phone }}</p>
    <p>When: {{ $reservation->reserved_at?->format('M j, Y g:i A') }}</p>
    <p>Party size: {{ $reservation->guests }}</p>
    @if($reservation->note)
        <p>Note: {{ $reservation->note }}</p>
    @endif
    <p>Status: {{ $reservation->status }}</p>
</body>
</html>

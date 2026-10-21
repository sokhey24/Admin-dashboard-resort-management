<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Booking confirmation</title>
</head>
<body style="font-family: sans-serif; line-height: 1.5; color: #222;">
    <p>Hello {{ $booking->user?->name ?? 'Guest' }},</p>
    <p>Thank you for your reservation at {{ $booking->resort?->name ?? 'Solara Resort' }}.</p>
    <p><strong>Reference:</strong> {{ $booking->booking_code }}</p>
    <p><strong>Check-in:</strong> {{ $booking->check_in?->format('M j, Y') }}</p>
    <p><strong>Check-out:</strong> {{ $booking->check_out?->format('M j, Y') }}</p>
    <p><strong>Status:</strong> {{ ucfirst(str_replace('_', ' ', $booking->status)) }}</p>
    <p>We will contact you if we need any further details. Payment instructions are available in your account when you are ready to pay.</p>
    <p>— Solara Resort</p>
</body>
</html>

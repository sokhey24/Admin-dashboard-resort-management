@extends('layouts.app')

@section('content')
    <div>
        @if($payment && $payment->isPaid())
            <h1>Payment Successful</h1>

            <p>
                Paid ${{ number_format($payment->amount, 2) }} {{ $payment->currency }}
                for {{ $payment->product->name }}.
            </p>

            <p>Reference: {{ $payment->md5 }}</p>
            <p>Confirmed at: {{ $payment->paid_at?->format('d M Y H:i') }}</p>
        @elseif($payment)
            <h1>Payment Not Confirmed</h1>

            <p>This order is currently <strong>{{ $payment->status }}</strong>.</p>
        @else
            <h1>Unknown Payment</h1>

            <p>We could not find that payment reference.</p>
        @endif

        <a href="{{ route('home') }}">Back to Home Page</a>
    </div>
@endsection

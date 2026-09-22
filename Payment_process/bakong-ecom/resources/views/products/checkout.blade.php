@extends('layouts.app')

@section('content')
    <div>
        <h2>{{ $product->name }}</h2>

        <img src="{{ asset($product->image) }}" alt="{{ $product->name }}">

        <p>{{ $product->description }}</p>

        <div>
            ${{ number_format($payment->amount, 2) }} {{ $payment->currency }}
        </div>

        <div>
            {!! QrCode::size(250)->margin(4)->generate($qr) !!}

            <p>Scan with the Bakong app to pay.</p>
            <p>Expires in <span id="seconds">{{ $payment->secondsRemaining() }}</span> seconds.</p>
            <p id="payment-status">Waiting for payment…</p>
        </div>

        <a href="{{ route('home') }}">Back</a>
    </div>

    <script>
        (function () {
            const endpoint = @json(route('verify.transaction'));
            const token = document.querySelector('meta[name="csrf-token"]').content;
            const md5 = @json($payment->md5);

            const secondsEl = document.getElementById('seconds');
            const statusEl = document.getElementById('payment-status');

            let timeLeft = {{ $payment->secondsRemaining() }};
            let stopped = false;

            function stop(message) {
                stopped = true;
                clearInterval(ticker);
                clearInterval(poller);
                statusEl.textContent = message;
            }

            // The backend is the only thing that decides whether a payment succeeded.
            async function check() {
                if (stopped) return;

                try {
                    const res = await fetch(endpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'X-CSRF-TOKEN': token,
                        },
                        body: JSON.stringify({ md5: md5 }),
                    });

                    const data = await res.json();

                    if (data.paid && data.redirect) {
                        stop('Payment confirmed. Redirecting…');
                        window.location.href = data.redirect;
                        return;
                    }

                    if (data.status === 'expired' || data.status === 'failed' || data.status === 'invalid') {
                        stop(data.message);
                        return;
                    }

                    statusEl.textContent = data.status === 'api_error'
                        ? data.message
                        : 'Waiting for payment…';
                } catch (error) {
                    statusEl.textContent = 'Network problem while checking payment.';
                }
            }

            const ticker = setInterval(function () {
                timeLeft -= 1;
                secondsEl.textContent = Math.max(0, timeLeft);

                if (timeLeft <= 0) {
                    check().then(function () {
                        if (!stopped) stop('This QR has expired. Please start again.');
                    });
                }
            }, 1000);

            const poller = setInterval(check, 3000);

            check();
        })();
    </script>
@endsection

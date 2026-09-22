<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>Bakong Payment</title>

    <link rel="stylesheet" href="{{ asset('style.css') }}">
</head>

<body>

    <div>
        <h1>KHQR Phone Shop</h1>
        <p>Experience digital payment experience</p>
    </div>

    <button>
        <a href="{{ route('home') }}">
            Buy Now
        </a>
    </button>
    @yield('content')
</body>

</html>
@extends('layouts.app')

@section('content')
<div>

    <h2>{{ $product->name }}</h2>

    <img src="{{ asset($product->image) }}" alt="{{ $product->name }}">

    <p>{{ $product->description }}</p>

    <div>
       {{ number_format($product->price, 2) }}
    </div>

    <form action="{{ route('checkout', $product->id) }}" method="POST">
        @csrf

        <button>
            Generate KHQR to Pay
        </button>
    </form>

</div>
@endsection
@extends('layouts.app')

@section('content')
    <div>
        <h1>Product List</h1>

        <div>
            @foreach($products as $product)
                <div>

                    <img src="{{ asset($product->image) }}"
                         alt="{{ $product->name }}">

                    <div>
                        <h3>{{ $product->name }}</h3>

                        <p>{{ $product->description }}</p>

                        <p>
                            <strong>
                                ${{ number_format($product->price, 2) }}
                            </strong>
                        </p>

                        <a href="{{ route('product.show', $product->id) }}">
                            Buy
                        </a>
                    </div>

                </div>
            @endforeach
        </div>
    </div>
@endsection
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product;
use Illuminate\Support\Facades\Storage;


class ProductController extends Controller
{
    public function index()
    {
        $products = Product::all();
        return view('products.index', compact('products'));
    }
    public function create()
    {
        return view('products.create');
    }
    public function store(Request $request)
    {
        $product = Product::create($request->all());
        return redirect()->route('products.index');
    }
    public function show($id)
    {
        $product = Product::findOrFail($id);
        return view('products.show', compact('product'));
    }
    public function edit($id)
    {
        $product = Product::find($id);
        return view('products.edit', compact('product'));
    }
    public function update(Request $request, $id)
    {
        $product = Product::find($id);
        $product->update($request->all());
        return redirect()->route('products.index');
    }
    public function destroy($id)
    {
        $product = Product::find($id);
        $product->delete();
        return redirect()->route('products.index');
    }
}

<?php

namespace App\Http\Controllers\Api\Room;

use App\Http\Controllers\Controller;
use App\Models\RoomImage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class RoomImageController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'room_id' => 'nullable|exists:rooms,id',
        ]);

        $query = RoomImage::query()->orderByDesc('is_primary')->latest();
        if ($request->filled('room_id')) {
            $query->where('room_id', $request->integer('room_id'));
        }

        return response()->json(['data' => $query->get()]);
    }

    public function show(RoomImage $roomImage): JsonResponse
    {
        return response()->json(['data' => $roomImage]);
    }

    public function store(Request $request): JsonResponse
    {
        if ($request->exists('is_primary')) {
            $request->merge(['is_primary' => $request->boolean('is_primary')]);
        }

        $data = $request->validate([
            'image' => 'required|image|max:2048',
            'room_id' => 'required|exists:rooms,id',
            'is_primary' => 'sometimes|boolean',
        ]);

        $path = $request->file('image')->store('rooms', 'public');
        $makePrimary = $request->boolean('is_primary')
            || ! RoomImage::where('room_id', $data['room_id'])->exists();

        if ($makePrimary) {
            RoomImage::where('room_id', $data['room_id'])->update(['is_primary' => false]);
        }

        $image = RoomImage::create([
            'room_id' => $data['room_id'],
            'image_path' => $path,
            'is_primary' => $makePrimary,
        ]);

        return response()->json(['data' => $image], 201);
    }

    public function update(Request $request, RoomImage $roomImage): JsonResponse
    {
        $data = $request->validate([
            'is_primary' => 'required|boolean',
        ]);

        if ($data['is_primary']) {
            RoomImage::where('room_id', $roomImage->room_id)
                ->where('id', '!=', $roomImage->id)
                ->update(['is_primary' => false]);
            $roomImage->update(['is_primary' => true]);
        } else {
            $roomImage->update(['is_primary' => false]);
            $this->ensurePrimary($roomImage->room_id);
        }

        return response()->json(['data' => $roomImage->fresh()]);
    }

    public function destroy(RoomImage $roomImage): JsonResponse
    {
        $roomId = $roomImage->room_id;
        if ($roomImage->image_path) {
            Storage::disk('public')->delete($roomImage->image_path);
        }
        $roomImage->delete();
        $this->ensurePrimary($roomId);

        return response()->json(null, 204);
    }

    private function ensurePrimary(int $roomId): void
    {
        if (RoomImage::where('room_id', $roomId)->where('is_primary', true)->exists()) {
            return;
        }

        $next = RoomImage::where('room_id', $roomId)->latest()->first();
        $next?->update(['is_primary' => true]);
    }
}

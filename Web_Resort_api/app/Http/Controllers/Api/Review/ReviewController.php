<?php

namespace App\Http\Controllers\Api\Review;

use App\Http\Controllers\Controller;
use App\Http\Requests\Review\IndexReviewRequest;
use App\Http\Resources\ReviewResource;
use App\Models\Review;
use App\Models\Room;
use App\Services\ReviewService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ReviewController extends Controller
{
    public function __construct(protected ReviewService $reviews) {}

    public function index(IndexReviewRequest $request): AnonymousResourceCollection
    {
        return ReviewResource::collection($this->reviews->paginate($request->validated(), $request->user()));
    }

    public function show(Review $review): ReviewResource
    {
        $this->reviews->assertAccessible($review, request()->user());

        return new ReviewResource($this->reviews->loadRelations($review));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'room_id' => 'required|exists:rooms,id',
            'rating'  => 'required|numeric|min:1|max:5',
            'title'   => 'nullable|string|max:180',
            'comment' => 'nullable|string',
        ]);

        $room = Room::query()->findOrFail($data['room_id']);
        $review = Review::create([
            'user_id' => auth()->id(),
            'room_id' => $room->id,
            'resort_id' => $room->resort_id,
            'rating' => $data['rating'],
            'title' => $data['title'] ?? null,
            'comment' => $data['comment'] ?? null,
            'status' => 'pending',
        ]);

        return (new ReviewResource($this->reviews->loadRelations($review)))
            ->response()
            ->setStatusCode(201);
    }

    public function update(Request $request, Review $review): ReviewResource
    {
        $data = $request->validate([
            'status'  => 'sometimes|in:pending,approved,rejected',
            'title'   => 'sometimes|nullable|string|max:180',
            'comment' => 'sometimes|nullable|string',
            'rating'  => 'sometimes|numeric|min:1|max:5',
        ]);
        $review->update($data);

        return new ReviewResource($this->reviews->loadRelations($review->fresh()));
    }

    public function destroy(Review $review): JsonResponse
    {
        $review->delete();

        return response()->json(null, 204);
    }
}

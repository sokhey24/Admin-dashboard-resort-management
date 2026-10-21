<?php

namespace App\Http\Controllers\Api\Review;

use App\Http\Controllers\Controller;
use App\Http\Requests\Review\IndexReviewRequest;
use App\Http\Requests\Review\StoreReviewRequest;
use App\Http\Requests\Review\UpdateCustomerReviewRequest;
use App\Http\Resources\ReviewResource;
use App\Models\Review;
use App\Services\ReviewService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ReviewController extends Controller
{
    public function __construct(protected ReviewService $reviews) {}

    public function index(IndexReviewRequest $request): AnonymousResourceCollection
    {
        $user = $request->user();
        $filters = $request->validated();
        $paginator = $this->reviews->paginate($filters, $user);

        $resource = ReviewResource::collection($paginator);

        if ($this->reviews->isPublicReviewConsumer($user) && ($filters['scope'] ?? '') !== 'mine') {
            $resource->additional([
                'summary' => $this->reviews->approvedPublicSummary($user, $filters),
            ]);
        }

        return $resource;
    }

    public function mine(IndexReviewRequest $request): AnonymousResourceCollection
    {
        $filters = array_merge($request->validated(), ['scope' => 'mine']);

        return ReviewResource::collection($this->reviews->paginate($filters, $request->user()));
    }

    public function show(Review $review): ReviewResource
    {
        $user = request()->user();
        if ($user) {
            $this->authorize('view', $review);
        }
        $this->reviews->assertAccessible($review, $user);

        return new ReviewResource($this->reviews->loadRelations($review));
    }

    public function store(StoreReviewRequest $request): JsonResponse
    {
        $review = $this->reviews->createCustomerReview(
            $request->user(),
            $request->validated()
        );

        return (new ReviewResource($this->reviews->loadRelations($review)))
            ->response()
            ->setStatusCode(201);
    }

    public function update(Request $request, Review $review): ReviewResource
    {
        $user = $request->user();
        $this->authorize('update', $review);
        $this->reviews->assertAccessible($review, $user);

        $data = $request->validate([
            'status'  => 'sometimes|in:pending,approved,rejected',
            'title'   => 'sometimes|nullable|string|max:180',
            'comment' => 'sometimes|nullable|string',
            'rating'  => 'sometimes|numeric|min:1|max:5',
        ]);
        $review->update($data);

        return new ReviewResource($this->reviews->loadRelations($review->fresh()));
    }

    public function updateCustomer(UpdateCustomerReviewRequest $request, Review $review): JsonResponse
    {
        $review = $this->reviews->updateCustomerReview(
            $review,
            $request->user(),
            $request->validated()
        );

        return (new ReviewResource($this->reviews->loadRelations($review)))
            ->response()
            ->setStatusCode(200);
    }

    public function destroy(Request $request, Review $review): JsonResponse
    {
        $user = $request->user();
        $this->authorize('delete', $review);
        if ($user?->isGuestAccount()) {
            $this->reviews->deleteCustomerReview($review, $user);
        } else {
            $this->reviews->assertAccessible($review, $user);
            $review->delete();
        }

        return response()->json(null, 204);
    }
}

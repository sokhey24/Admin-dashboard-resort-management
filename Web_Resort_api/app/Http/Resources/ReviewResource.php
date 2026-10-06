<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReviewResource extends JsonResource
{
    protected function exposeReviewerEmail(Request $request): bool
    {
        return $request->is('api/admin/*');
    }

    /** Public approved listing on the guest site — no moderation or booking metadata. */
    protected function isPublicApprovedListing(Request $request): bool
    {
        if ($request->is('api/admin/*')) {
            return false;
        }

        $path = trim($request->path(), '/');

        return $request->isMethod('GET')
            && $path === 'api/customer/reviews';
    }

    protected function formatRoomPayload($room, bool $publicList): array
    {
        $payload = [
            'room_number' => $room->room_number,
        ];

        if ($room->roomType) {
            $payload['room_type'] = $publicList
                ? ['name' => $room->roomType->name]
                : [
                    'id' => $room->roomType->id,
                    'name' => $room->roomType->name,
                ];
        }

        if (! $publicList) {
            $payload['id'] = $room->id;
        }

        return $payload;
    }

    public function toArray(Request $request): array
    {
        $room = $this->room ?: $this->booking?->rooms?->first();
        $branch = $room?->branch;
        $publicList = $this->isPublicApprovedListing($request);

        $data = [
            'id' => $this->id,
            'title' => $this->title,
            'comment' => $this->comment,
            'rating' => $this->rating !== null ? (float) $this->rating : null,
            'created_at' => optional($this->created_at)?->toIso8601String(),
            'user' => $this->whenLoaded('user', function () use ($request, $publicList) {
                $payload = [
                    'name' => $this->user?->name,
                    'profile_image' => $this->user?->profile_image,
                    'profile_image_url' => $this->user?->profile_image
                        ? asset('storage/'.$this->user->profile_image)
                        : null,
                ];
                if (! $publicList) {
                    $payload['id'] = $this->user?->id;
                }
                if ($this->exposeReviewerEmail($request)) {
                    $payload['email'] = $this->user?->email;
                }

                return $payload;
            }),
            'room' => $room ? $this->formatRoomPayload($room, $publicList) : null,
            'resort' => $this->whenLoaded('resort', fn () => $publicList ? [
                'name' => $this->resort?->name,
            ] : [
                'id' => $this->resort?->id,
                'name' => $this->resort?->name,
            ]),
            'branch' => $branch ? ($publicList ? [
                'name' => $branch->name,
            ] : [
                'id' => $branch->id,
                'name' => $branch->name,
            ]) : null,
        ];

        if (! $publicList) {
            $data['status'] = $this->status;
            $data['updated_at'] = optional($this->updated_at)?->toIso8601String();
            $data['booking'] = $this->whenLoaded('booking', fn () => $this->booking ? [
                'id' => $this->booking->id,
                'booking_code' => $this->booking->booking_code,
            ] : null);
        }

        return $data;
    }
}

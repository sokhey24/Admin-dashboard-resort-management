<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReviewResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $room = $this->room ?: $this->booking?->rooms?->first();
        $branch = $room?->branch;

        return [
            'id' => $this->id,
            'title' => $this->title,
            'comment' => $this->comment,
            'rating' => $this->rating !== null ? (float) $this->rating : null,
            'status' => $this->status,
            'created_at' => optional($this->created_at)?->toIso8601String(),
            'updated_at' => optional($this->updated_at)?->toIso8601String(),
            'user' => $this->whenLoaded('user', fn () => [
                'id' => $this->user?->id,
                'name' => $this->user?->name,
                'email' => $this->user?->email,
                'profile_image' => $this->user?->profile_image,
            ]),
            'room' => $room ? [
                'id' => $room->id,
                'room_number' => $room->room_number,
                'room_type' => $room->roomType ? [
                    'id' => $room->roomType->id,
                    'name' => $room->roomType->name,
                ] : null,
            ] : null,
            'resort' => $this->whenLoaded('resort', fn () => [
                'id' => $this->resort?->id,
                'name' => $this->resort?->name,
            ]),
            'branch' => $branch ? [
                'id' => $branch->id,
                'name' => $branch->name,
            ] : null,
            'booking' => $this->whenLoaded('booking', fn () => $this->booking ? [
                'id' => $this->booking->id,
                'booking_code' => $this->booking->booking_code,
            ] : null),
        ];
    }
}

<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Notifications\DatabaseNotification;

/** @mixin DatabaseNotification */
class UserNotificationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $data = is_array($this->data) ? $this->data : [];

        return [
            'id' => $this->id,
            'type' => $data['category'] ?? class_basename($this->type),
            'action' => $data['action'] ?? 'system',
            'title' => $data['title'] ?? null,
            'message' => $data['message'] ?? null,
            'booking_code' => $data['booking_code'] ?? null,
            'user_name' => $data['user_name'] ?? null,
            'status' => $data['status'] ?? null,
            'entity_type' => $data['entity_type'] ?? null,
            'entity_id' => $data['entity_id'] ?? null,
            'url' => $data['url'] ?? null,
            'read' => $this->read_at !== null,
            'read_at' => $this->read_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}

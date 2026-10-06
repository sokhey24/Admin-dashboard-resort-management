<?php

namespace App\Exceptions;

use Illuminate\Contracts\Support\Responsable;
use Illuminate\Http\JsonResponse;

/**
 * Thrown when selected rooms cannot be booked for the requested stay window.
 * Response includes safe availability metadata only (no guest or booking identifiers).
 */
class RoomUnavailableException extends \RuntimeException implements Responsable
{
    /**
     * @param  array<int, array<string, mixed>>  $unavailableRooms
     */
    public function __construct(
        string $message,
        public readonly array $unavailableRooms,
    ) {
        parent::__construct($message);
    }

    public function toResponse($request): JsonResponse
    {
        return response()->json([
            'message' => $this->getMessage(),
            'errors' => [
                'room_ids' => [$this->getMessage()],
            ],
            'availability' => [
                'unavailable_rooms' => $this->unavailableRooms,
            ],
        ], 422);
    }
}

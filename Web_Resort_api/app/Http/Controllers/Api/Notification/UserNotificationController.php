<?php

namespace App\Http\Controllers\Api\Notification;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserNotificationResource;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserNotificationController extends Controller
{
    public function __construct(protected NotificationService $notifications) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $paginator = $this->notifications->paginateForUser($user, $request->query());

        return response()->json([
            'data' => UserNotificationResource::collection($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
            'unread_count' => $this->notifications->unreadCountForUser($user),
        ]);
    }

    public function markRead(Request $request, string $notification): JsonResponse
    {
        $row = $this->notifications->markAsRead($request->user(), $notification);

        return response()->json([
            'success' => true,
            'data' => new UserNotificationResource($row),
            'unread_count' => $this->notifications->unreadCountForUser($request->user()),
        ]);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $this->notifications->markAllAsRead($request->user());

        return response()->json([
            'success' => true,
            'unread_count' => 0,
        ]);
    }
}

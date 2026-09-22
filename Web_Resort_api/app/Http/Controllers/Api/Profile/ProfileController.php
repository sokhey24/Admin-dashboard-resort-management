<?php

namespace App\Http\Controllers\Api\Profile;

use App\Http\Controllers\Controller;
use App\Http\Requests\Profile\ChangePasswordRequest;
use App\Http\Requests\Profile\ConfirmTwoFactorRequest;
use App\Http\Requests\Profile\DisableTwoFactorRequest;
use App\Http\Requests\Profile\UpdatePreferencesRequest;
use App\Http\Requests\Profile\UpdateProfileRequest;
use App\Http\Requests\Profile\UploadAvatarRequest;
use App\Services\ProfileService;
use App\Services\TwoFactorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function __construct(
        protected ProfileService $profileService,
        protected TwoFactorService $twoFactor
    ) {}

    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'data' => $this->profileService->formatUser($user),
        ]);
    }

    public function update(UpdateProfileRequest $request): JsonResponse
    {
        try {
            $user = $request->user();
            $data = $request->validated();

            if ($request->hasFile('profile_image')) {
                $data['profile_image'] = $request->file('profile_image');
            }

            $updatedUser = $this->profileService->updateProfile($user, $data);

            return response()->json([
                'success' => true,
                'message' => 'Profile updated successfully',
                'data' => $this->profileService->formatUser($updatedUser),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        try {
            $validated = $request->validated();

            $this->profileService->changePassword(
                $request->user(),
                $validated['current_password'],
                $validated['password']
            );

            return response()->json([
                'success' => true,
                'message' => 'Password changed successfully. You have been logged out from other devices.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function uploadAvatar(UploadAvatarRequest $request): JsonResponse
    {
        try {
            $user = $request->user();
            $avatarUrl = $this->profileService->uploadAvatar($user, $request->file('avatar'));

            return response()->json([
                'success' => true,
                'message' => 'Profile photo updated successfully',
                'data' => [
                    'avatar_url' => $avatarUrl,
                    'profile' => $this->profileService->formatUser($user->fresh(['roles'])),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function deleteAvatar(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $this->profileService->deleteAvatar($user);

            return response()->json([
                'success' => true,
                'message' => 'Profile photo removed successfully',
                'data' => $this->profileService->formatUser($user->fresh(['roles'])),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function sessions(Request $request): JsonResponse
    {
        $sessions = $this->profileService->getActiveSessions($request->user());

        return response()->json([
            'success' => true,
            'data' => [
                'sessions' => $sessions,
                'total' => count($sessions),
            ],
        ]);
    }

    public function revokeSession(Request $request, int $tokenId): JsonResponse
    {
        try {
            $revoked = $this->profileService->revokeSession($request->user(), $tokenId);

            if ($revoked) {
                return response()->json([
                    'success' => true,
                    'message' => 'Session revoked successfully',
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Session not found',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function revokeAllOtherSessions(Request $request): JsonResponse
    {
        $count = $this->profileService->revokeAllOtherSessions($request->user());

        return response()->json([
            'success' => true,
            'message' => "Logged out from {$count} other device(s)",
            'data' => [
                'revoked_count' => $count,
            ],
        ]);
    }

    public function activityHistory(Request $request): JsonResponse
    {
        $limit = (int) $request->input('limit', 50);
        $history = $this->profileService->getActivityHistory($request->user(), $limit);

        return response()->json([
            'success' => true,
            'data' => [
                'activities' => $history,
                'total' => count($history),
            ],
        ]);
    }

    public function updatePreferences(UpdatePreferencesRequest $request): JsonResponse
    {
        try {
            $merged = $this->profileService->updatePreferences(
                $request->user(),
                $request->validated()
            );

            return response()->json([
                'success' => true,
                'message' => 'Preferences updated successfully',
                'data' => [
                    'preferences' => $merged,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function getPreferences(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'preferences' => $this->profileService->getPreferences($request->user()),
            ],
        ]);
    }

    public function statistics(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->profileService->statistics($request->user()),
        ]);
    }

    public function twoFactorStatus(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'data' => [
                'enabled' => $this->twoFactor->isEnabled($user),
            ],
        ]);
    }

    public function twoFactorSetup(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($this->twoFactor->isEnabled($user)) {
            return response()->json([
                'success' => false,
                'message' => 'Two-factor authentication is already enabled.',
            ], 422);
        }

        $setup = $this->profileService->beginTwoFactorSetup($user);

        return response()->json([
            'success' => true,
            'message' => 'Scan the QR code with your authenticator app, then confirm with a 6-digit code.',
            'data' => $setup,
        ]);
    }

    public function twoFactorConfirm(ConfirmTwoFactorRequest $request): JsonResponse
    {
        try {
            $this->profileService->confirmTwoFactor($request->user(), $request->validated()['code']);

            return response()->json([
                'success' => true,
                'message' => 'Two-factor authentication is now enabled.',
                'data' => [
                    'enabled' => true,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function twoFactorDisable(DisableTwoFactorRequest $request): JsonResponse
    {
        try {
            $validated = $request->validated();
            $this->profileService->disableTwoFactor(
                $request->user(),
                $validated['password'],
                $validated['code'] ?? null
            );

            return response()->json([
                'success' => true,
                'message' => 'Two-factor authentication has been disabled.',
                'data' => [
                    'enabled' => false,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}

<?php
namespace App\Http\Controllers\Api\Auth;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\TwoFactorChallengeRequest;
use App\Models\User;
use App\Services\AuthService;
use App\Services\GuestProfileService;
use App\Services\ProfileService;
use App\Services\TwoFactorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function __construct(
        protected AuthService $service,
        protected ProfileService $profileService,
        protected TwoFactorService $twoFactor
    ) {}

    public function index(): JsonResponse
    {

        $users = User::all();
        if(!$users){
            return response()->json([
                'message' => 'No users found.'],
                 404);
        }
        return response()->json($users);
    }
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name'          => 'required|string|max:255',
            'email'         => 'required|email|unique:users,email',
            'phone'         => 'nullable|string|max:20|unique:users,phone',
            'password'      => 'required|string|min:8|confirmed',
            'gender'        => 'nullable|in:male,female,other',
            'date_of_birth' => 'nullable|date|before:today',
            'address'       => 'nullable|string|max:500',
            'profile_image' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
        ]);

        $data = $request->only('name', 'email', 'phone', 'password', 'gender', 'date_of_birth', 'address');

        if ($request->hasFile('profile_image')) {
            $data['profile_image'] = $request->file('profile_image');
        }

        $result = $this->service->register($data);

        return response()->json([
            'message'      => 'User registered successfully',
            'user'         => $result['user'],
            'access_token' => $result['access_token'],
            'token_type'   => $result['token_type'],
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $email = strtolower(trim((string) $request->email));
        $user = User::whereRaw('LOWER(email) = ?', [$email])->first();
        $storedHash = $user ? (string) ($user->getRawOriginal('password') ?: $user->password) : '';

        if (!$user || $storedHash === '' || !Hash::check($request->password, $storedHash)) {
            return response()->json(['message' => 'Invalid email or password.'], 401);
        }

        if ($user->status === 'inactive') {
            return response()->json(
                ['message' => 'Your account is inactive. Please contact the administrator.']
                , 403);
        }

        if ($this->twoFactor->isEnabled($user)) {
            $challengeToken = Str::random(64);
            Cache::put('2fa_challenge:' . $challengeToken, $user->id, now()->addMinutes(10));

            return response()->json([
                'message' => 'Two-factor authentication required.',
                'two_factor_required' => true,
                'challenge_token' => $challengeToken,
            ]);
        }

        return $this->completeLogin($user, $request);
    }

    public function twoFactorChallenge(TwoFactorChallengeRequest $request): JsonResponse
    {
        $cacheKey = '2fa_challenge:' . $request->validated()['challenge_token'];
        $userId = Cache::pull($cacheKey);

        if (!$userId) {
            return response()->json([
                'message' => 'This verification session has expired. Please sign in again.',
            ], 401);
        }

        $user = User::find($userId);
        if (!$user || $user->status === 'inactive') {
            return response()->json(['message' => 'Unable to complete sign in.'], 401);
        }

        $code = $request->validated()['code'];
        $secret = $this->twoFactor->decryptSecret($user->two_factor_secret);
        $verified = $secret && $this->twoFactor->verify($secret, $code);

        if (!$verified && $this->twoFactor->looksLikeRecoveryCode($code)) {
            $verified = $this->twoFactor->consumeRecoveryCode($user, $code);
        }

        if (!$verified) {
            Cache::put($cacheKey, $user->id, now()->addMinutes(10));

            return response()->json(['message' => 'Invalid authenticator or recovery code.'], 422);
        }

        return $this->completeLogin($user, $request);
    }

    private function completeLogin(User $user, Request $request): JsonResponse
    {
        $device = substr((string) $request->userAgent(), 0, 120) ?: 'auth_token';
        $user = $user->fresh(['roles']);

        $incoming = $user->currentAccessToken();
        if (is_object($incoming) && method_exists($incoming, 'delete')) {
            $incoming->delete();
        }

        $token = $user->createToken($device)->plainTextToken;
        $this->profileService->recordLogin($user);

        return response()->json([
            'message' => 'Login successful',
            'user' => $this->profileService->formatUser($user),
            'roles' => $user->roles->pluck('name'),
            'permissions' => $user->permissions(),
            'access_token' => $token,
            'token_type' => 'Bearer',
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('roles');
        return response()->json([
            'user'        => $this->profileService->formatUser($user),
            'roles'       => $user->roles->pluck('name'),
            'permissions' => $user->permissions(),
        ]);
    }
    public function show($id): JsonResponse
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json(['message' => 'User not found!'], 404);
        }
        return response()->json(['message' => 'User found successfully!', 'user' => $user]);
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $request->validate([
            'name'          => 'sometimes|string|max:255',
            'phone'         => 'sometimes|nullable|string|max:20|unique:users,phone,' . $user->id,
            'gender'        => 'sometimes|nullable|in:male,female,other',
            'date_of_birth' => 'sometimes|nullable|date|before:today',
            'address'       => 'sometimes|nullable|string|max:500',
            'profile_image' => 'sometimes|nullable|image|mimes:jpg,jpeg,png|max:2048',
        ]);

        $data = $request->only('name', 'phone', 'gender', 'date_of_birth', 'address');
        if ($request->hasFile('profile_image')) {
            $data['profile_image'] = $request->file('profile_image');
        }

        $fresh = $this->profileService->updateProfile($user, $data);

        return response()->json([
            'message' => 'Profile updated successfully',
            'user'    => $this->profileService->formatUser($fresh),
        ]);
    }

     public function logout(Request $request): JsonResponse
    {
        $user = $request->user();
        if($user){
                $request->user()->currentAccessToken()->delete();
        }
        return response()->json([
            'message' => 'Logged out successfully'
            ],200);
    }

    public function destroy(string $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json(['message' => 'User not found!'], 404);
        }

        if ($user->profile_image) {
            Storage::disk('public')->delete($user->profile_image);
        }

        $user->delete();

        return response()->json(['message' => 'User deleted successfully!'], 200);
    }


}

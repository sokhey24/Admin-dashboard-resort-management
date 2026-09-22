<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Mail\PasswordResetOtpMail;
use App\Models\PasswordResetOtp;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

class ForgotPasswordController extends Controller
{
    private const OTP_EXPIRY_MINUTES        = 10;
    private const RESET_TOKEN_EXPIRY_MINUTES = 15;
    private const MAX_ATTEMPTS              = 5;
    private const RESEND_COOLDOWN_SECONDS   = 60;

    // ── STEP 1: Send OTP ──────────────────────────────────────────────────

    public function sendOtp(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email|max:255']);

        // Rate limit: 5 requests per 10 minutes per email
        $key = 'forgot-password:' . strtolower($request->email);
        if (RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = RateLimiter::availableIn($key);
            return response()->json([
                'success' => false,
                'message' => "Too many requests. Please wait {$seconds} seconds before trying again.",
            ], 429);
        }
        RateLimiter::hit($key, 600);

        $smtpPass = (string) config('mail.mailers.smtp.password', '');
        $mailConfigured = $this->isMailConfigured();
        // #region agent log
        file_put_contents(base_path('../debug-432b20.log'), json_encode([
            'sessionId' => '432b20',
            'runId' => 'post-fix',
            'hypothesisId' => 'A',
            'location' => 'ForgotPasswordController.php:sendOtp',
            'message' => 'sendOtp mail config snapshot',
            'data' => [
                'mailer' => config('mail.default'),
                'host' => config('mail.mailers.smtp.host'),
                'port' => config('mail.mailers.smtp.port'),
                'scheme' => config('mail.mailers.smtp.scheme'),
                'encryption_env' => env('MAIL_ENCRYPTION'),
                'username_set' => filled(config('mail.mailers.smtp.username')),
                'password_set' => $smtpPass !== '',
                'password_len' => strlen($smtpPass),
                'password_has_spaces' => str_contains($smtpPass, ' '),
                'from' => config('mail.from.address'),
                'mail_configured' => $mailConfigured,
                'queue' => config('queue.default'),
            ],
            'timestamp' => (int) (microtime(true) * 1000),
        ]).PHP_EOL, FILE_APPEND);
        // #endregion

        if (!$mailConfigured) {
            // #region agent log
            file_put_contents(base_path('../debug-432b20.log'), json_encode([
                'sessionId' => '432b20',
                'runId' => 'post-fix',
                'hypothesisId' => 'B',
                'location' => 'ForgotPasswordController.php:sendOtp',
                'message' => 'isMailConfigured returned false',
                'data' => ['branch' => 'not_configured'],
                'timestamp' => (int) (microtime(true) * 1000),
            ]).PHP_EOL, FILE_APPEND);
            // #endregion
            return response()->json([
                'success' => false,
                'message' => 'Email service is not configured. Please contact the administrator.',
            ], 503);
        }

        // Email enumeration protection — always return same response
        $user = User::where('email', $request->email)->first();
        // #region agent log
        file_put_contents(base_path('../debug-432b20.log'), json_encode([
            'sessionId' => '432b20',
            'runId' => 'post-fix',
            'hypothesisId' => 'C',
            'location' => 'ForgotPasswordController.php:sendOtp',
            'message' => 'user lookup result',
            'data' => ['user_found' => (bool) $user],
            'timestamp' => (int) (microtime(true) * 1000),
        ]).PHP_EOL, FILE_APPEND);
        // #endregion

        if ($user) {
            try {
                $this->generateAndSendOtp($user);
            } catch (\Symfony\Component\Mailer\Exception\TransportException $e) {
                \Log::error('OTP SMTP transport error: ' . $e->getMessage());
                // #region agent log
                file_put_contents(base_path('../debug-432b20.log'), json_encode([
                    'sessionId' => '432b20',
                    'runId' => 'post-fix',
                    'hypothesisId' => 'A',
                    'location' => 'ForgotPasswordController.php:sendOtp:catch',
                    'message' => 'SMTP TransportException',
                    'data' => [
                        'exception' => get_class($e),
                        'error' => $e->getMessage(),
                    ],
                    'timestamp' => (int) (microtime(true) * 1000),
                ]).PHP_EOL, FILE_APPEND);
                // #endregion
                return response()->json([
                    'success' => false,
                    'message' => 'Unable to send the verification email. Please try again later.',
                ], 503);
            } catch (\Exception $e) {
                \Log::error('OTP mail failed: ' . $e->getMessage());
                // #region agent log
                file_put_contents(base_path('../debug-432b20.log'), json_encode([
                    'sessionId' => '432b20',
                    'runId' => 'post-fix',
                    'hypothesisId' => 'D',
                    'location' => 'ForgotPasswordController.php:sendOtp:catch',
                    'message' => 'generic exception during OTP send',
                    'data' => [
                        'exception' => get_class($e),
                        'error' => $e->getMessage(),
                        'file' => $e->getFile(),
                        'line' => $e->getLine(),
                    ],
                    'timestamp' => (int) (microtime(true) * 1000),
                ]).PHP_EOL, FILE_APPEND);
                // #endregion
                return response()->json([
                    'success' => false,
                    'message' => 'Unable to send the verification email. Please try again later.',
                ], 503);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'If an account exists for this email, a verification code has been sent.',
        ]);
    }

    // ── STEP 2: Verify OTP ────────────────────────────────────────────────

    public function verifyOtp(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'otp'   => 'required|digits:6',
        ]);

        // Rate limit: 10 attempts per 5 minutes per email
        $key = 'verify-otp:' . strtolower($request->email);
        if (RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = RateLimiter::availableIn($key);
            return response()->json([
                'success' => false,
                'message' => "Too many requests. Please wait {$seconds} seconds before trying again.",
            ], 429);
        }
        RateLimiter::hit($key, 300);

        $record = PasswordResetOtp::where('email', $request->email)
            ->where('used', false)
            ->whereNull('verified_at')
            ->latest()
            ->first();

        if (!$record) {
            return response()->json([
                'success' => false,
                'message' => 'No active verification code found. Please request a new one.',
            ], 422);
        }

        if ($record->isExpired()) {
            return response()->json([
                'success' => false,
                'message' => 'Verification code has expired. Please request a new one.',
            ], 422);
        }

        if ($record->isLocked()) {
            return response()->json([
                'success' => false,
                'message' => 'Too many invalid attempts. Please request a new code.',
            ], 422);
        }

        if (!Hash::check($request->otp, $record->otp)) {
            $record->increment('attempts');
            $remaining = self::MAX_ATTEMPTS - $record->fresh()->attempts;
            return response()->json([
                'success' => false,
                'message' => $remaining > 0
                    ? "Invalid verification code. {$remaining} attempt(s) remaining."
                    : 'Too many invalid attempts. Please request a new code.',
            ], 422);
        }

        // OTP correct — generate reset token
        $resetToken = Str::random(64);

        $record->update([
            'verified_at'            => now(),
            'reset_token'            => $resetToken,
            'reset_token_expires_at' => now()->addMinutes(self::RESET_TOKEN_EXPIRY_MINUTES),
        ]);

        return response()->json([
            'success'     => true,
            'message'     => 'OTP verified successfully.',
            'reset_token' => $resetToken,
        ]);
    }

    // ── STEP 3: Resend OTP ────────────────────────────────────────────────

    public function resendOtp(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email|max:255']);

        // Rate limit: 5 resends per 10 minutes per email
        $key = 'resend-otp:' . strtolower($request->email);
        if (RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = RateLimiter::availableIn($key);
            return response()->json([
                'success' => false,
                'message' => "Too many requests. Please wait {$seconds} seconds.",
            ], 429);
        }
        RateLimiter::hit($key, 600);

        $user = User::where('email', $request->email)->first();

        if (!$this->isMailConfigured()) {
            return response()->json([
                'success' => false,
                'message' => 'Email service is not configured. Please contact the administrator.',
            ], 503);
        }

        if ($user) {
            $existing = PasswordResetOtp::where('email', $request->email)
                ->where('used', false)
                ->whereNull('verified_at')
                ->latest()
                ->first();

            if ($existing && !$existing->canResend()) {
                $wait = $existing->secondsUntilResend();
                return response()->json([
                    'success' => false,
                    'message' => "Please wait {$wait} seconds before requesting another code.",
                ], 429);
            }

            try {
                $this->generateAndSendOtp($user);
            } catch (\Symfony\Component\Mailer\Exception\TransportException $e) {
                \Log::error('OTP resend SMTP transport error: ' . $e->getMessage());
                return response()->json([
                    'success' => false,
                    'message' => 'Unable to send the verification email. Please try again later.',
                ], 503);
            } catch (\Exception $e) {
                \Log::error('OTP resend mail failed: ' . $e->getMessage());
                return response()->json([
                    'success' => false,
                    'message' => 'Unable to send the verification email. Please try again later.',
                ], 503);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'If an account exists for this email, a new verification code has been sent.',
        ]);
    }

    // ── STEP 4: Reset Password ────────────────────────────────────────────

    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email'                 => 'required|email',
            'reset_token'           => 'required|string|size:64',
            'password'              => 'required|string|min:8|confirmed',
            'password_confirmation' => 'required|string',
        ]);

        $record = PasswordResetOtp::where('email', $request->email)
            ->where('reset_token', $request->reset_token)
            ->whereNotNull('verified_at')
            ->where('used', false)
            ->first();

        if (!$record) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired password reset token.',
            ], 422);
        }

        if ($record->isResetTokenExpired()) {
            return response()->json([
                'success' => false,
                'message' => 'Password reset token has expired. Please start over.',
            ], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found.',
            ], 422);
        }

        // Update password
        $user->update(['password' => Hash::make($request->password)]);

        // Revoke all Sanctum tokens (invalidate existing sessions)
        $user->tokens()->delete();

        // Invalidate this OTP record
        $record->update(['used' => true, 'reset_token' => null]);

        // Invalidate all other OTP records for this email
        PasswordResetOtp::where('email', $request->email)
            ->where('id', '!=', $record->id)
            ->delete();

        return response()->json([
            'success' => true,
            'message' => 'Password reset successfully. Please log in with your new password.',
        ]);
    }

    // ── Private: Generate & Send OTP ─────────────────────────────────────

    private function generateAndSendOtp(User $user): void
    {
        PasswordResetOtp::where('email', $user->email)->delete();

        $otp = (string) random_int(100000, 999999);

        $record = PasswordResetOtp::create([
            'email'        => $user->email,
            'otp'          => Hash::make($otp),
            'expires_at'   => now()->addMinutes(self::OTP_EXPIRY_MINUTES),
            'last_sent_at' => now(),
            'attempts'     => 0,
            'used'         => false,
        ]);
        // #region agent log
        file_put_contents(base_path('../debug-432b20.log'), json_encode([
            'sessionId' => '432b20',
            'runId' => 'post-fix',
            'hypothesisId' => 'E',
            'location' => 'ForgotPasswordController.php:generateAndSendOtp',
            'message' => 'OTP row created, sending mail',
            'data' => ['otp_stored_hashed' => true, 'expiry_minutes' => self::OTP_EXPIRY_MINUTES],
            'timestamp' => (int) (microtime(true) * 1000),
        ]).PHP_EOL, FILE_APPEND);
        // #endregion

        try {
            Mail::to($user->email)->send(new PasswordResetOtpMail(
                userName:         $user->name,
                otp:              $otp,
                expiresInMinutes: self::OTP_EXPIRY_MINUTES,
            ));
        } catch (\Throwable $e) {
            $record->delete();
            throw $e;
        }
    }

    private function isMailConfigured(): bool
    {
        $mailer = config('mail.default');

        if (in_array($mailer, ['log', 'array'])) {
            return true;
        }

        if ($mailer !== 'smtp') {
            return true;
        }

        $host = (string) config('mail.mailers.smtp.host', '');
        $user = (string) config('mail.mailers.smtp.username', '');
        $pass = (string) config('mail.mailers.smtp.password', '');

        if (empty($host) || empty($user) || empty($pass)) {
            return false;
        }

        $placeholders = ['your-', 'example.com', 'null'];
        foreach ($placeholders as $p) {
            if (str_contains(strtolower($user), $p) || str_contains(strtolower($pass), $p)) {
                return false;
            }
        }

        return true;
    }
}

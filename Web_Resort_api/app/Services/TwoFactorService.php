<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class TwoFactorService
{
    private const ISSUER = 'Resort Management';

    public function generateSecret(int $byteLength = 20): string
    {
        return $this->base32Encode(random_bytes($byteLength));
    }

    public function otpauthUrl(User $user, string $secret): string
    {
        $label = rawurlencode(self::ISSUER . ':' . $user->email);
        $query = http_build_query([
            'secret' => $secret,
            'issuer' => self::ISSUER,
            'algorithm' => 'SHA1',
            'digits' => 6,
            'period' => 30,
        ]);

        return "otpauth://totp/{$label}?{$query}";
    }

    public function verify(string $secret, string $code, int $window = 1): bool
    {
        $code = preg_replace('/\s+/', '', $code) ?? '';
        if (!preg_match('/^\d{6}$/', $code)) {
            return false;
        }

        $timeSlice = (int) floor(time() / 30);
        for ($i = -$window; $i <= $window; $i++) {
            if (hash_equals($this->totp($secret, $timeSlice + $i), $code)) {
                return true;
            }
        }

        return false;
    }

    /**
     * @return array<int, string> Plain-text recovery codes (shown once)
     */
    public function generateRecoveryCodes(int $count = 8): array
    {
        $codes = [];
        for ($i = 0; $i < $count; $i++) {
            $codes[] = strtoupper(Str::random(4) . '-' . Str::random(4));
        }

        return $codes;
    }

    /**
     * @param  array<int, string>  $plainCodes
     */
    public function hashRecoveryCodes(array $plainCodes): string
    {
        $hashed = array_map(fn (string $code) => Hash::make($code), $plainCodes);

        return encrypt(json_encode(array_values($hashed)));
    }

    public function consumeRecoveryCode(User $user, string $code): bool
    {
        if (!$user->two_factor_recovery_codes) {
            return false;
        }

        $stored = json_decode(decrypt($user->two_factor_recovery_codes), true);
        if (!is_array($stored)) {
            return false;
        }

        $normalized = strtoupper(trim($code));
        foreach ($stored as $index => $hashed) {
            if (Hash::check($normalized, $hashed) || Hash::check($code, $hashed)) {
                unset($stored[$index]);
                $user->forceFill([
                    'two_factor_recovery_codes' => encrypt(json_encode(array_values($stored))),
                ])->save();

                return true;
            }
        }

        return false;
    }

    public function decryptSecret(?string $encrypted): ?string
    {
        if (!$encrypted) {
            return null;
        }

        try {
            return decrypt($encrypted);
        } catch (\Throwable) {
            return null;
        }
    }

    public function isEnabled(User $user): bool
    {
        return !empty($user->two_factor_confirmed_at) && !empty($user->two_factor_secret);
    }

    private function totp(string $secret, int $counter): string
    {
        $binary = $this->base32Decode($secret);
        $time = pack('N*', 0) . pack('N*', $counter);
        $hash = hash_hmac('sha1', $time, $binary, true);
        $offset = ord(substr($hash, -1)) & 0x0F;
        $truncated = (
            ((ord($hash[$offset]) & 0x7F) << 24) |
            ((ord($hash[$offset + 1]) & 0xFF) << 16) |
            ((ord($hash[$offset + 2]) & 0xFF) << 8) |
            (ord($hash[$offset + 3]) & 0xFF)
        ) % 1000000;

        return str_pad((string) $truncated, 6, '0', STR_PAD_LEFT);
    }

    private function base32Encode(string $data): string
    {
        $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $binary = '';
        foreach (str_split($data) as $char) {
            $binary .= str_pad(decbin(ord($char)), 8, '0', STR_PAD_LEFT);
        }
        $chunks = str_split($binary, 5);
        $output = '';
        foreach ($chunks as $chunk) {
            $output .= $alphabet[bindec(str_pad($chunk, 5, '0'))];
        }

        return $output;
    }

    private function base32Decode(string $secret): string
    {
        $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $secret = strtoupper(preg_replace('/[^A-Z2-7]/', '', $secret) ?? '');
        $binary = '';
        foreach (str_split($secret) as $char) {
            $index = strpos($alphabet, $char);
            if ($index === false) {
                continue;
            }
            $binary .= str_pad(decbin($index), 5, '0', STR_PAD_LEFT);
        }
        $bytes = str_split($binary, 8);
        $output = '';
        foreach ($bytes as $byte) {
            if (strlen($byte) === 8) {
                $output .= chr(bindec($byte));
            }
        }

        return $output;
    }
}

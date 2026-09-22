<?php

declare(strict_types=1);

namespace KHQR\Models;

/**
 * NBC KHQR tag 99: creation (00) + expiration (01) in milliseconds.
 *
 * The installed khqr-gateway SDK only writes subtag 00. Current Bakong
 * bank apps reject that payload as "This QR code has expired".
 */
class Timestamp extends TagLengthString
{
    public function __construct(string $tag)
    {
        $createdMs = (string) (int) round(microtime(true) * 1000);
        $ttlSeconds = 300;

        if (function_exists('config')) {
            try {
                $configured = (int) config('services.bakong.qr_ttl_seconds');
                if ($configured > 0) {
                    $ttlSeconds = $configured;
                }
            } catch (\Throwable) {
            }
        }

        $expiresMs = (string) ((int) $createdMs + ($ttlSeconds * 1000));

        $value = (string) new TimestampMillisecond('00', $createdMs)
            .(string) new TimestampMillisecond('01', $expiresMs);

        parent::__construct($tag, $value);
    }
}

class TimestampMillisecond extends TagLengthString
{
    public function __construct(string $tag, string $value)
    {
        parent::__construct($tag, $value);
    }
}

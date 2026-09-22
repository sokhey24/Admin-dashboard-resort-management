<?php

namespace App\Services;

use SimpleSoftwareIO\QrCode\Facades\QrCode;

/**
 * Renders KHQR EMV strings the same way as Payment_process/bakong-ecom checkout.
 */
class KhqrQrImageService
{
    public function svg(string $qrPayload, int $size = 250, int $margin = 4): string
    {
        return (string) QrCode::size($size)->margin($margin)->generate($qrPayload);
    }
}

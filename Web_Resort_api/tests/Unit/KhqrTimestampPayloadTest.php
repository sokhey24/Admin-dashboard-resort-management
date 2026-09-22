<?php

namespace Tests\Unit;

use KHQR\BakongKHQR;
use KHQR\Helpers\KHQRData;
use KHQR\Models\IndividualInfo;
use Tests\TestCase;

class KhqrTimestampPayloadTest extends TestCase
{
    public function test_individual_qr_includes_creation_and_expiration_timestamps(): void
    {
        $response = BakongKHQR::generateIndividual(new IndividualInfo(
            bakongAccountID: 'demo@bkrt',
            merchantName: 'Solara Resort',
            merchantCity: 'Phnom Penh',
            currency: KHQRData::CURRENCY_USD,
            amount: 1.0,
        ));

        $qr = $response->data['qr'] ?? '';
        $this->assertNotSame('', $qr);
        $this->assertTrue(BakongKHQR::verify($qr)->isValid);

        // Tag 99 with both subtags 00 (created) and 01 (expires) — Payment_process/bakong-ecom fix.
        $this->assertMatchesRegularExpression('/99\d{2}0013\d{13}0113\d{13}/', $qr);
    }
}

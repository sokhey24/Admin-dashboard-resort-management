<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\StoreAIChatRequest;
use App\Services\GeminiConciergeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class AIChatController extends Controller
{
    public function __construct(protected GeminiConciergeService $concierge) {}

    public function store(StoreAIChatRequest $request): JsonResponse
    {
        $validated = $request->validated();

        try {
            $reply = $this->concierge->generateReply(
                $validated['messages'],
                isset($validated['branch_id']) ? (int) $validated['branch_id'] : null,
                $validated['language'] ?? 'en',
                $validated['catalog_context'] ?? null,
                $validated['branch_name'] ?? null,
            );

            return response()->json(['reply' => $reply]);
        } catch (RuntimeException $e) {
            return $this->runtimeErrorResponse($e);
        } catch (Throwable $e) {
            return $this->unexpectedErrorResponse($e);
        }
    }

    public function stream(StoreAIChatRequest $request): StreamedResponse|JsonResponse
    {
        $validated = $request->validated();

        try {
            return response()->stream(function () use ($validated) {
                $stream = $this->concierge->streamReply(
                    $validated['messages'],
                    isset($validated['branch_id']) ? (int) $validated['branch_id'] : null,
                    $validated['language'] ?? 'en',
                    $validated['catalog_context'] ?? null,
                    $validated['branch_name'] ?? null,
                );

                foreach ($stream as $delta) {
                    echo 'data: '.json_encode(['text' => $delta], JSON_UNESCAPED_UNICODE)."\n\n";
                    if (ob_get_level() > 0) {
                        ob_flush();
                    }
                    flush();
                }

                echo "data: [DONE]\n\n";
                if (ob_get_level() > 0) {
                    ob_flush();
                }
                flush();
            }, 200, [
                'Content-Type' => 'text/event-stream',
                'Cache-Control' => 'no-cache, no-transform',
                'Connection' => 'keep-alive',
                'X-Accel-Buffering' => 'no',
            ]);
        } catch (RuntimeException $e) {
            return $this->runtimeErrorResponse($e);
        } catch (Throwable $e) {
            return $this->unexpectedErrorResponse($e);
        }
    }

    protected function runtimeErrorResponse(RuntimeException $e): JsonResponse
    {
        if (str_contains($e->getMessage(), 'not configured')) {
            return response()->json([
                'message' => 'AI concierge is temporarily unavailable.',
            ], 503);
        }

        Log::warning('Gemini concierge runtime error', [
            'error' => $e->getMessage(),
        ]);

        return response()->json([
            'message' => 'Unable to complete your request. Please try again shortly.',
        ], 502);
    }

    protected function unexpectedErrorResponse(Throwable $e): JsonResponse
    {
        Log::error('Gemini concierge unexpected error', [
            'error' => $e->getMessage(),
        ]);

        return response()->json([
            'message' => 'Unable to complete your request. Please try again shortly.',
        ], 502);
    }
}

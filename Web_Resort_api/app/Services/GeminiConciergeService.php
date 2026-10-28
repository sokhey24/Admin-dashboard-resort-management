<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\Room;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

class GeminiConciergeService
{
    public function __construct(protected PricingService $pricing) {}

    /**
     * @param  array<int, array{role: string, text: string}>  $messages
     */
    public function generateReply(
        array $messages,
        ?int $branchId = null,
        string $language = 'en',
        ?string $catalogContext = null,
        ?string $branchName = null,
    ): string {
        $model = $this->modelName();
        $payload = $this->buildRequestPayload($messages, $branchId, $language, $catalogContext, $branchName);

        $endpoint = sprintf(
            'https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent',
            $model
        );

        $response = Http::timeout(60)
            ->acceptJson()
            ->withQueryParameters(['key' => $this->apiKey()])
            ->post($endpoint, $payload);

        if (! $response->successful()) {
            throw new RuntimeException('Gemini API request failed.');
        }

        $text = data_get($response->json(), 'candidates.0.content.parts.0.text');
        if (! is_string($text) || trim($text) === '') {
            throw new RuntimeException('Gemini returned an empty response.');
        }

        return trim($text);
    }

    /**
     * @return \Generator<int, string>
     */
    public function streamReply(
        array $messages,
        ?int $branchId = null,
        string $language = 'en',
        ?string $catalogContext = null,
        ?string $branchName = null,
    ): \Generator {
        $model = $this->modelName();
        $payload = $this->buildRequestPayload($messages, $branchId, $language, $catalogContext, $branchName);

        $endpoint = sprintf(
            'https://generativelanguage.googleapis.com/v1beta/models/%s:streamGenerateContent',
            $model
        );

        $response = Http::timeout(90)
            ->withOptions(['stream' => true])
            ->withQueryParameters(['key' => $this->apiKey(), 'alt' => 'sse'])
            ->post($endpoint, $payload);

        if (! $response->successful()) {
            throw new RuntimeException('Gemini stream request failed.');
        }

        $body = $response->toPsrResponse()->getBody();
        $buffer = '';
        $assembled = '';

        while (! $body->eof()) {
            $buffer .= $body->read(1024);
            while (($pos = strpos($buffer, "\n")) !== false) {
                $line = trim(substr($buffer, 0, $pos));
                $buffer = substr($buffer, $pos + 1);

                if ($line === '' || ! str_starts_with($line, 'data:')) {
                    continue;
                }

                $json = trim(substr($line, 5));
                if ($json === '' || $json === '[DONE]') {
                    continue;
                }

                $decoded = json_decode($json, true);
                if (! is_array($decoded)) {
                    continue;
                }

                $piece = data_get($decoded, 'candidates.0.content.parts.0.text');
                if (! is_string($piece) || $piece === '') {
                    continue;
                }

                $delta = $piece;
                if (str_starts_with($piece, $assembled)) {
                    $delta = substr($piece, strlen($assembled));
                }
                $assembled .= $delta;

                if ($delta !== '') {
                    yield $delta;
                }
            }
        }
    }

    protected function apiKey(): string
    {
        $apiKey = config('services.gemini.api_key');
        if (! is_string($apiKey) || $apiKey === '') {
            throw new RuntimeException('GEMINI_API_KEY is not configured.');
        }

        return $apiKey;
    }

    protected function modelName(): string
    {
        return (string) config('services.gemini.model', 'gemini-2.5-flash');
    }

    /**
     * @param  array<int, array{role: string, text: string}>  $messages
     */
    protected function buildRequestPayload(
        array $messages,
        ?int $branchId,
        string $language,
        ?string $catalogContext,
        ?string $branchName = null,
    ): array {
        return [
            'systemInstruction' => [
                'parts' => [['text' => $this->buildSystemInstruction($branchId, $language, $catalogContext, $branchName)]],
            ],
            'contents' => $this->formatContents($messages),
            'generationConfig' => [
                'temperature' => 0.65,
                'maxOutputTokens' => 1024,
            ],
        ];
    }

    /**
     * @param  array<int, array{role: string, text: string}>  $messages
     * @return array<int, array{role: string, parts: array<int, array{text: string}>}>
     */
    protected function formatContents(array $messages): array
    {
        return array_values(array_map(
            fn (array $message) => [
                'role' => $message['role'] === 'model' ? 'model' : 'user',
                'parts' => [['text' => $message['text']]],
            ],
            $messages
        ));
    }

    protected function buildSystemInstruction(
        ?int $branchId,
        string $language,
        ?string $catalogContext = null,
        ?string $branchName = null,
    ): string
    {
        $base = <<<'PROMPT'
You are "Reaksa", Solara Resort & Spa's ultra-luxury AI concierge.
Maintain multi-turn context: resolve "it", "that room", "how much is that?", and follow-up dates from prior messages.
Tone: five-star hospitality — warm, precise, never robotic.
Keep answers concise (2–4 sentences or short bullets) unless the guest asks for detail.
Use ONLY the live resort data sections below for prices and inventory; never invent rates.
When guests mention dates, answer confidently about possibility based on catalog, then invite them to confirm live availability via markdown links such as [View Kep Rooms](/branches/kep) or the site booking bar.
Standard check-in is 14:00 and check-out is 12:00 unless branch data says otherwise.
PROMPT;

        $context = $this->buildLiveResortContext($branchId);

        $locale = $language === 'km'
            ? "\n\nGuest locale: Khmer. Reply in polite, natural Khmer (ភាសាខ្មែរ) with gracious openings (សូមជម្រាបសួរ) unless they write in English."
            : "\n\nGuest locale: English. Reply in refined English with luxury hospitality tone.";

        $focus = '';
        if ($branchId !== null) {
            $label = is_string($branchName) && trim($branchName) !== ''
                ? trim($branchName)
                : "branch #{$branchId}";
            $focus = "\n\nThe guest is currently browsing the {$label} sanctuary (branch ID {$branchId}). Tailor recommendations, rates, and links to this location first.";
        }

        $clientCatalog = '';
        if (is_string($catalogContext) && trim($catalogContext) !== '') {
            $clientCatalog = "\n\n--- GUEST-SITE CATALOG SNAPSHOT ---\n".trim($catalogContext);
        }

        return trim($base.$locale.$focus."\n\n--- LIVE RESORT DATA (API) ---\n".$context.$clientCatalog);
    }

    protected function buildLiveResortContext(?int $focusBranchId): string
    {
        $branches = Branch::query()
            ->where('status', 'active')
            ->when(
                $focusBranchId,
                fn ($q) => $q->where('id', $focusBranchId),
                fn ($q) => $q->where(function ($inner) {
                    $inner->where('is_active', true)->orWhereNull('is_active');
                })
            )
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'city', 'province', 'checkin_time', 'checkout_time', 'description']);

        if ($branches->isEmpty()) {
            return 'No active branches are published at the moment.';
        }

        $startingPrices = $this->startingPricesByBranch($branches->pluck('id'));

        return $branches
            ->map(function (Branch $branch) use ($startingPrices) {
                $slug = $branch->slug ?: Str::slug($branch->name);
                $route = '/branches/'.$slug;
                $checkIn = $branch->checkin_time ?: '14:00';
                $checkOut = $branch->checkout_time ?: '12:00';
                $price = $startingPrices->get($branch->id);
                $priceLine = $price !== null
                    ? sprintf('Starting nightly rate from USD %s (available room inventory).', number_format($price, 2))
                    : 'Starting rates: contact concierge for current availability.';

                $blurb = Str::limit(strip_tags((string) $branch->description), 220);

                return sprintf(
                    "- %s (%s, %s) | Route: %s | Check-in %s, Check-out %s | %s%s",
                    $branch->name,
                    $branch->city ?: 'Cambodia',
                    $branch->province ?: '',
                    $route,
                    $checkIn,
                    $checkOut,
                    $priceLine,
                    $blurb !== '' ? " | {$blurb}" : ''
                );
            })
            ->implode("\n");
    }

    /**
     * @param  Collection<int, int>  $branchIds
     * @return Collection<int, float>
     */
    protected function startingPricesByBranch(Collection $branchIds): Collection
    {
        if ($branchIds->isEmpty()) {
            return collect();
        }

        $rooms = Room::query()
            ->whereIn('branch_id', $branchIds)
            ->where('status', 'available')
            ->whereHas('resort', fn ($r) => $r->where('status', 'active'))
            ->whereHas('roomType', fn ($t) => $t->where('status', 'active'))
            ->with(['roomType:id,discount_percent'])
            ->get(['id', 'branch_id', 'price_per_night', 'discount_percent', 'room_type_id']);

        $mins = [];
        foreach ($rooms as $room) {
            $price = (float) $room->price_per_night;
            $percent = $this->pricing->resolveDiscountPercent($room);
            $discounted = round($price - ($price * $percent / 100), 2);
            $branchId = (int) $room->branch_id;
            if (! isset($mins[$branchId]) || $discounted < $mins[$branchId]) {
                $mins[$branchId] = $discounted;
            }
        }

        return collect($mins);
    }
}

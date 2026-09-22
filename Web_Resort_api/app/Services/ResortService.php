<?php

namespace App\Services;

use App\Models\Resort;
use App\Models\Room;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ResortService
{
    public function __construct(protected PricingService $pricing) {}
    public function getAll(): \Illuminate\Database\Eloquent\Collection
    {
        return Resort::with(['branches', 'facilities'])->get();
    }

    public function getById(Resort $resort): Resort
    {
        return $resort->load(['branches', 'facilities', 'reviews', 'roomTypes']);
    }

    public function create(array $data): Resort
    {
        if (isset($data['logo']) && is_object($data['logo'])) {
            $data['logo'] = $data['logo']->store('resorts/logos', 'public');
        }
        if (isset($data['cover_image']) && is_object($data['cover_image'])) {
            $data['cover_image'] = $data['cover_image']->store('resorts/covers', 'public');
        }

        return Resort::create($data);
    }

    public function update(Resort $resort, array $data): Resort
    {
        if (isset($data['logo']) && is_object($data['logo'])) {
            if ($resort->logo) {
                Storage::disk('public')->delete($resort->logo);
            }
            $data['logo'] = $data['logo']->store('resorts/logos', 'public');
        }
        if (isset($data['cover_image']) && is_object($data['cover_image'])) {
            if ($resort->cover_image) {
                Storage::disk('public')->delete($resort->cover_image);
            }
            $data['cover_image'] = $data['cover_image']->store('resorts/covers', 'public');
        }

        $resort->update($data);

        return $resort->fresh();
    }

    public function delete(Resort $resort): void
    {
        if ($resort->logo) {
            Storage::disk('public')->delete($resort->logo);
        }
        if ($resort->cover_image) {
            Storage::disk('public')->delete($resort->cover_image);
        }

        $resort->delete();
    }

    /**
     * Public resort discovery — active resorts only, with catalog aggregates.
     */
    public function paginateForCustomer(array $filters): LengthAwarePaginator
    {
        $filters['status'] = 'active';

        return $this->paginateCatalog($filters, null);
    }

    /**
     * Admin listing — optional resort assignment scope for non-admin staff.
     */
    public function paginateForAdmin(array $filters, User $user): LengthAwarePaginator
    {
        $scope = null;
        if (! $user->isAdmin()) {
            $assigned = $user->assignedResortIds();
            if ($assigned !== []) {
                $scope = $assigned;
            }
        }

        return $this->paginateCatalog($filters, $scope);
    }

    protected function paginateCatalog(array $filters, ?array $resortIdScope): LengthAwarePaginator
    {
        $search = trim((string) ($filters['search'] ?? $filters['destination'] ?? ''));
        $perPage = min(50, max(1, (int) ($filters['per_page'] ?? 50)));

        $query = Resort::query()
            ->with(['facilities'])
            ->withCount(['branches', 'directRooms as rooms_count']);

        if ($resortIdScope !== null) {
            $query->whereIn('id', $resortIdScope);
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if ($search !== '') {
            $like = '%'.$search.'%';
            $query->where(function (Builder $q) use ($like) {
                $q->where('name', 'like', $like)
                    ->orWhere('city', 'like', $like)
                    ->orWhere('country', 'like', $like)
                    ->orWhere('address', 'like', $like);
            });
        }

        if (! empty($filters['city'])) {
            $query->where('city', 'like', '%'.trim((string) $filters['city']).'%');
        }

        if (! empty($filters['country'])) {
            $query->where('country', 'like', '%'.trim((string) $filters['country']).'%');
        }

        if (! empty($filters['branch_id'])) {
            $query->whereHas('branches', fn (Builder $b) => $b->where('id', (int) $filters['branch_id']));
        }

        $this->applyCatalogSort($query, (string) ($filters['sort'] ?? 'recommended'));

        $paginator = $query->paginate($perPage);
        $paginator->setCollection($this->attachCatalogMetrics($paginator->getCollection()));

        return $paginator;
    }

    protected function applyCatalogSort(Builder $query, string $sort): void
    {
        match ($sort) {
            'name' => $query->orderBy('name'),
            default => $query->orderByDesc('updated_at')->orderBy('name'),
        };
    }

    protected function attachCatalogMetrics(Collection $resorts): Collection
    {
        if ($resorts->isEmpty()) {
            return $resorts;
        }

        $ids = $resorts->pluck('id')->all();

        $roomRows = Room::query()
            ->with('roomType')
            ->whereIn('resort_id', $ids)
            ->get()
            ->groupBy('resort_id');

        $reviewStats = DB::table('reviews')
            ->selectRaw('resort_id, AVG(rating) as avg_rating, COUNT(*) as review_count')
            ->whereIn('resort_id', $ids)
            ->where('status', 'approved')
            ->groupBy('resort_id')
            ->get()
            ->keyBy('resort_id');

        $bookingCounts = DB::table('bookings')
            ->selectRaw('resort_id, COUNT(*) as booking_count')
            ->whereIn('resort_id', $ids)
            ->groupBy('resort_id')
            ->get()
            ->keyBy('resort_id');

        $roomTypeCounts = DB::table('rooms')
            ->selectRaw('resort_id, COUNT(DISTINCT room_type_id) as room_type_count')
            ->whereIn('resort_id', $ids)
            ->groupBy('resort_id')
            ->get()
            ->keyBy('resort_id');

        return $resorts->map(function (Resort $resort) use (
            $roomRows,
            $reviewStats,
            $bookingCounts,
            $roomTypeCounts
        ) {
            $rooms = $roomRows->get($resort->id, collect());
            $available = $rooms->where('status', 'available');

            $from = $this->lowestNightlyRate($available->isNotEmpty() ? $available : $rooms);

            $stats = $reviewStats->get($resort->id);
            $rating = $stats ? round((float) $stats->avg_rating, 2) : 0.0;
            $reviewCount = $stats ? (int) $stats->review_count : 0;
            $roomTypeCount = (int) ($roomTypeCounts->get($resort->id)?->room_type_count ?? 0);

            return $this->formatResortRow($resort, [
                'rooms_count'           => (int) ($resort->rooms_count ?? $rooms->count()),
                'room_type_count'       => $roomTypeCount,
                'available_rooms_count' => $available->count(),
                'branch_count'          => (int) ($resort->branches_count ?? 0),
                'booking_count'         => (int) ($bookingCounts->get($resort->id)?->booking_count ?? 0),
                'rating'                => $rating,
                'review_count'          => $reviewCount,
                'price_from'            => $from['price_from'],
                'price_from_original'   => $from['price_from_original'],
                'price_from_discount_percent' => $from['price_from_discount_percent'],
            ]);
        });
    }

    protected function lowestNightlyRate(Collection $rooms): array
    {
        $best = null;
        $bestPay = null;

        foreach ($rooms as $room) {
            $original = (float) $room->price_per_night;
            $percent = $this->pricing->resolveDiscountPercent($room);
            $pay = (float) $room->discounted_price_per_night;

            if ($best === null || $pay < $bestPay) {
                $best = ['price_from_original' => $original, 'price_from_discount_percent' => $percent];
                $bestPay = $pay;
            }
        }

        if ($best === null) {
            return [
                'price_from' => 0.0,
                'price_from_original' => 0.0,
                'price_from_discount_percent' => 0.0,
            ];
        }

        return [
            'price_from' => round($bestPay, 2),
            'price_from_original' => round($best['price_from_original'], 2),
            'price_from_discount_percent' => $best['price_from_discount_percent'],
        ];
    }

    protected function formatResortRow(Resort $resort, array $metrics): array
    {
        $row = $resort->toArray();
        $row['logo_url'] = $resort->logo ? Storage::disk('public')->url($resort->logo) : null;
        $row['cover_image_url'] = $resort->cover_image
            ? Storage::disk('public')->url($resort->cover_image)
            : null;

        return array_merge($row, $metrics);
    }
}

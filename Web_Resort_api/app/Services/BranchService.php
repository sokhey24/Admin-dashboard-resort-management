<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\Room;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class BranchService
{
    public function __construct(protected PricingService $pricing) {}

    public function paginateForCustomer(array $filters): LengthAwarePaginator
    {
        $filters['status'] = 'active';

        return $this->paginateCatalog($filters, null);
    }

    public function paginateForAdmin(array $filters, User $user): LengthAwarePaginator
    {
        $branchScope = null;
        if (! app(BranchAccessService::class)->bypassesBranchScope($user)) {
            $assigned = app(BranchAccessService::class)->assignedBranchIds($user);
            $branchScope = $assigned !== [] ? $assigned : [0];
        }

        return $this->paginateCatalog($filters, $branchScope);
    }

    protected function paginateCatalog(array $filters, ?array $branchIdScope): LengthAwarePaginator
    {
        $search = trim((string) ($filters['search'] ?? $filters['destination'] ?? ''));
        $perPage = min(50, max(1, (int) ($filters['per_page'] ?? 12)));

        $query = Branch::query()
            ->with(['resort.facilities'])
            ->withCount(['rooms as rooms_count']);

        if ($branchIdScope !== null) {
            $query->whereIn('id', $branchIdScope);
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['resort_id'])) {
            $query->where('resort_id', (int) $filters['resort_id']);
        }

        if ($search !== '') {
            $like = '%'.$search.'%';
            $query->where(function (Builder $q) use ($like) {
                $q->where('name', 'like', $like)
                    ->orWhere('city', 'like', $like)
                    ->orWhere('address', 'like', $like);
            });
        }

        if (! empty($filters['city'])) {
            $city = trim((string) $filters['city']);
            $query->where(function (Builder $q) use ($city) {
                $q->where('city', 'like', '%'.$city.'%')
                    ->orWhere('name', 'like', '%'.$city.'%');
            });
        }

        if (! empty($filters['branch_id'])) {
            $query->where('id', (int) $filters['branch_id']);
        }

        $query->orderBy('name');

        $paginator = $query->paginate($perPage);
        $paginator->setCollection($this->attachCatalogMetrics($paginator->getCollection()));

        return $paginator;
    }

    protected function attachCatalogMetrics(Collection $branches): Collection
    {
        if ($branches->isEmpty()) {
            return $branches;
        }

        $ids = $branches->pluck('id')->all();

        $roomRows = Room::query()
            ->with('roomType')
            ->whereIn('branch_id', $ids)
            ->get()
            ->groupBy('branch_id');

        $reviewStats = DB::table('reviews')
            ->join('rooms', 'reviews.room_id', '=', 'rooms.id')
            ->selectRaw('rooms.branch_id, AVG(reviews.rating) as avg_rating, COUNT(*) as review_count')
            ->whereIn('rooms.branch_id', $ids)
            ->where('reviews.status', 'approved')
            ->groupBy('rooms.branch_id')
            ->get()
            ->keyBy('branch_id');

        return $branches->map(function (Branch $branch) use ($roomRows, $reviewStats) {
            $rooms = $roomRows->get($branch->id, collect());
            $available = $rooms->where('status', 'available');
            $from = $this->lowestNightlyRate($available->isNotEmpty() ? $available : $rooms);
            $stats = $reviewStats->get($branch->id);

            return $this->formatBranchRow($branch, [
                'rooms_count' => (int) ($branch->rooms_count ?? $rooms->count()),
                'available_rooms_count' => $available->count(),
                'rating' => $stats ? round((float) $stats->avg_rating, 2) : 0.0,
                'review_count' => $stats ? (int) $stats->review_count : 0,
                'price_from' => $from['price_from'],
                'price_from_original' => $from['price_from_original'],
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

    public function formatBranchRow(Branch $branch, array $metrics = []): array
    {
        $row = $branch->toArray();
        $row['cover_image_url'] = $branch->cover_image
            ? Storage::disk('public')->url($branch->cover_image)
            : null;
        $row['brand'] = $branch->resort ? [
            'id' => $branch->resort->id,
            'name' => $branch->resort->name,
            'brand_name' => $branch->resort->brand_name ?? $branch->resort->name,
            'central_phone' => $branch->resort->central_phone ?? $branch->resort->phone,
            'central_email' => $branch->resort->central_email ?? $branch->resort->email,
            'logo_url' => $branch->resort->logo ? Storage::disk('public')->url($branch->resort->logo) : null,
            'terms_and_conditions' => $branch->resort->terms_and_conditions,
        ] : null;
        $row['facilities'] = $branch->resort?->facilities?->toArray() ?? [];

        return array_merge($row, $metrics);
    }

    public function formatBranchDetail(Branch $branch): array
    {
        $branch->loadMissing(['resort.facilities', 'rooms.roomType', 'rooms.images', 'roomTypes']);

        $rooms = $branch->rooms;
        $availableRooms = $rooms->where('status', 'available');
        $from = $this->lowestNightlyRate($availableRooms->isNotEmpty() ? $availableRooms : $rooms);

        $reviewStats = DB::table('reviews')
            ->join('rooms', 'reviews.room_id', '=', 'rooms.id')
            ->selectRaw('AVG(reviews.rating) as avg_rating, COUNT(*) as review_count')
            ->where('rooms.branch_id', $branch->id)
            ->where('reviews.status', 'approved')
            ->first();

        // Get unique room types available at this branch
        $branchRoomTypes = $branch->roomTypes;
        if ($branchRoomTypes->isEmpty()) {
            $branchRoomTypes = $rooms->pluck('roomType')->filter()->unique('id')->values();
        }

        $formattedRoomTypes = $branchRoomTypes->map(function ($rt) use ($rooms) {
            $matchingRooms = $rooms->where('room_type_id', $rt->id);
            $available = $matchingRooms->where('status', 'available');
            $rtArr = $rt->toArray();
            $rtArr['rooms_count'] = $matchingRooms->count();
            $rtArr['available_rooms_count'] = $available->count();
            $rtArr['discounted_base_price'] = $rt->discounted_base_price ?? $rt->base_price;

            return $rtArr;
        })->values();

        // Aggregate unique amenities from room types and facilities
        $amenities = collect();
        foreach ($branchRoomTypes as $rt) {
            if (is_array($rt->amenities)) {
                $amenities = $amenities->concat($rt->amenities);
            }
        }
        $facilities = $branch->resort?->facilities ?? collect();
        foreach ($facilities as $f) {
            $amenities->push($f->name);
        }
        $uniqueAmenities = $amenities->filter()->unique()->values()->all();

        return $this->formatBranchRow($branch, [
            'rooms_count' => $rooms->count(),
            'available_rooms_count' => $availableRooms->count(),
            'rating' => $reviewStats ? round((float) $reviewStats->avg_rating, 2) : 0.0,
            'review_count' => $reviewStats ? (int) $reviewStats->review_count : 0,
            'price_from' => $from['price_from'],
            'price_from_original' => $from['price_from_original'],
            'price_from_discount_percent' => $from['price_from_discount_percent'],
            'room_types' => $formattedRoomTypes,
            'amenities' => $uniqueAmenities,
            'facilities' => $facilities->toArray(),
        ]);
    }
}


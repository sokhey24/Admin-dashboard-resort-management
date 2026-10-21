<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DailyAuditReport extends Model
{
    public const STATUS_PENDING = 'pending';

    public const STATUS_RUNNING = 'running';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_FAILED = 'failed';

    protected $fillable = [
        'resort_id',
        'branch_id',
        'operational_date',
        'currency',
        'total_rooms',
        'sellable_rooms',
        'occupied_rooms',
        'maintenance_rooms',
        'available_rooms',
        'occupancy_rate',
        'room_revenue',
        'incidental_revenue',
        'adr',
        'revpar',
        'arrivals',
        'departures',
        'no_show_count',
        'status',
        'error_message',
        'metrics_meta',
        'run_count',
        'generated_at',
    ];

    protected $casts = [
        'operational_date' => 'date',
        'occupancy_rate' => 'float',
        'room_revenue' => 'float',
        'incidental_revenue' => 'float',
        'adr' => 'float',
        'revpar' => 'float',
        'metrics_meta' => 'array',
        'generated_at' => 'datetime',
    ];

    public function resort(): BelongsTo
    {
        return $this->belongsTo(Resort::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }
}

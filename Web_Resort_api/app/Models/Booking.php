<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Booking extends Model
{
    use SoftDeletes;

    public const STATUSES = ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'completed'];

    public const BLOCKING_STATUSES = ['pending', 'confirmed', 'checked_in'];

    public const TRANSITIONS = [
        'pending'     => ['confirmed', 'checked_in', 'cancelled'],
        'confirmed'   => ['checked_in', 'cancelled'],
        'checked_in'  => ['completed', 'cancelled'],
        'checked_out' => ['completed', 'cancelled'],
        'cancelled'   => [],
        'completed'   => [],
    ];

    protected $fillable = [
        'user_id', 'guest_id', 'resort_id', 'coupon_id', 'booking_code', 'source',
        'check_in', 'check_out', 'adults', 'children', 'nights',
        'subtotal', 'discount', 'room_discount_total', 'tax_amount', 'service_charge_amount',
        'total_amount', 'deposit_amount', 'balance_due',
        'status', 'special_requests', 'internal_notes',
        'confirmed_at', 'checked_in_at', 'checked_out_at', 'completed_at',
        'cancelled_at', 'cancelled_by', 'cancellation_reason', 'created_by',
    ];

    protected $casts = [
        'check_in' => 'datetime',
        'check_out' => 'datetime',
        'confirmed_at' => 'datetime',
        'checked_in_at' => 'datetime',
        'checked_out_at' => 'datetime',
        'completed_at' => 'datetime',
        'cancelled_at' => 'datetime',
    ];

    protected $appends = ['payment_status'];

    public function getPaymentStatusAttribute(): string
    {
        $balance = (float) ($this->attributes['balance_due'] ?? $this->balance_due ?? 0);
        $paid = (float) ($this->attributes['deposit_amount'] ?? $this->deposit_amount ?? 0);
        if ($balance <= 0.009) {
            return 'paid';
        }
        if ($paid > 0.009) {
            return 'partially_paid';
        }

        return 'unpaid';
    }

    public function user()       { return $this->belongsTo(User::class); }
    public function resort()     { return $this->belongsTo(Resort::class); }
    public function coupon()     { return $this->belongsTo(Coupon::class); }
    public function rooms()      { return $this->belongsToMany(Room::class, 'booking_rooms')->withPivot('price_per_night', 'nights', 'discount_percent', 'discount_amount', 'subtotal', 'net_subtotal'); }
    public function payment()    { return $this->hasOne(Payment::class)->latestOfMany(); }
    public function payments()   { return $this->hasMany(Payment::class); }
    public function invoice()    { return $this->hasOne(Invoice::class); }
    public function statusLogs() { return $this->hasMany(BookingStatusLog::class); }
    public function foodOrders() { return $this->hasMany(FoodOrder::class); }
}

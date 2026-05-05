<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommissionLedger extends Model
{
    use HasUuids;

    public $timestamps = false;
    protected $table = 'commission_ledger';

    protected $fillable = [
        'order_id', 'farmer_id', 'order_total', 'commission_rate',
        'commission_amount', 'farmer_earnings', 'status', 'released_at',
    ];

    protected $casts = [
        'commission_rate'   => 'decimal:4',
        'order_total'       => 'integer',
        'commission_amount' => 'integer',
        'farmer_earnings'   => 'integer',
        'released_at'       => 'datetime',
        'created_at'        => 'datetime',
    ];

    public function order(): BelongsTo { return $this->belongsTo(Order::class); }
    public function farmer(): BelongsTo { return $this->belongsTo(FarmerProfile::class, 'farmer_id'); }
}

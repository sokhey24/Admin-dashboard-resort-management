<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Support\Facades\Schema;
use Throwable;

class ActivityLogger
{
    public function log(
        User $user,
        string $action,
        string $description,
        ?array $changes = null
    ): void {
        try {
            if (!Schema::hasTable('activity_logs')) {
                return;
            }

            $columns = Schema::getColumnListing('activity_logs');
            $payload = [
                'user_id' => $user->id,
                'action' => $action,
                'description' => $description,
            ];

            if (in_array('ip_address', $columns, true)) {
                $payload['ip_address'] = request()->ip();
            }
            if (in_array('user_agent', $columns, true)) {
                $payload['user_agent'] = request()->userAgent();
            }
            if (in_array('changes', $columns, true) && $changes !== null) {
                $payload['changes'] = $changes;
            }
            if (in_array('model', $columns, true)) {
                $payload['model'] = 'User';
            }
            if (in_array('model_type', $columns, true)) {
                $payload['model_type'] = 'User';
            }
            if (in_array('model_id', $columns, true)) {
                $payload['model_id'] = $user->id;
            }

            ActivityLog::create($payload);
        } catch (Throwable) {
            // Activity logging must never block the primary action.
        }
    }
}

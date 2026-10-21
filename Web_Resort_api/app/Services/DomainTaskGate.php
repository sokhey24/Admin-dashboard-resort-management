<?php

namespace App\Services;

use App\Models\DomainTaskDedupe;
use Illuminate\Database\QueryException;

class DomainTaskGate
{
    /**
     * Claim a one-time domain side-effect (email, notification, etc.).
     * Returns false when the task was already claimed (safe for queue retries).
     */
    public function claim(string $taskKey): bool
    {
        try {
            DomainTaskDedupe::create(['task_key' => $taskKey]);

            return true;
        } catch (QueryException $e) {
            if ($this->isUniqueViolation($e)) {
                return false;
            }

            throw $e;
        }
    }

    protected function isUniqueViolation(QueryException $e): bool
    {
        $code = (string) $e->getCode();

        return in_array($code, ['23000', '23505'], true)
            || str_contains(strtolower($e->getMessage()), 'unique');
    }
}

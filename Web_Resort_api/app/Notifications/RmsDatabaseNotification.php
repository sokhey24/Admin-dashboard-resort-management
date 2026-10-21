<?php

namespace App\Notifications;

use Illuminate\Notifications\Notification;

abstract class RmsDatabaseNotification extends Notification
{
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Preference key under users.preferences.notifications.*
     */
    abstract public function preferenceCategory(): string;

    /**
     * @return array<string, mixed>
     */
    abstract public function toDatabase(object $notifiable): array;
}

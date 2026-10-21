<?php

namespace App\Http\Requests\Profile;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePreferencesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'theme' => 'sometimes|in:light,dark,auto',
            'language' => 'sometimes|in:en,km,zh,th',
            'notifications' => 'sometimes|array',
            'notifications.email' => 'sometimes|boolean',
            'notifications.system' => 'sometimes|boolean',
            'notifications.booking' => 'sometimes|boolean',
            'notifications.restaurant' => 'sometimes|boolean',
            'notifications.payment' => 'sometimes|boolean',
            'notifications.marketing' => 'sometimes|boolean',
            'favorites' => 'sometimes|array',
            'favorites.resorts' => 'sometimes|array|max:200',
            'favorites.resorts.*' => 'string|max:64',
            'favorites.rooms' => 'sometimes|array|max:200',
            'favorites.rooms.*' => 'string|max:64',
            'favorites.dishes' => 'sometimes|array|max:200',
            'favorites.dishes.*' => 'string|max:64',
        ];
    }

    public function messages(): array
    {
        return [
            'theme.in' => 'Theme must be light, dark, or auto',
            'language.in' => 'Language must be en, km, zh, or th',
            'notifications.*.boolean' => 'Notification preference must be true or false',
        ];
    }
}

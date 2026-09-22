<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('resorts', function (Blueprint $table) {
            $table->string('resort_type')->nullable()->after('description');
            $table->unsignedTinyInteger('stars')->default(4)->after('resort_type');
            $table->string('promo_tag')->nullable()->after('stars');
            $table->string('tagline')->nullable()->after('promo_tag');
            $table->string('cover_image')->nullable()->after('logo');
            $table->boolean('free_cancellation')->default(true)->after('status');
            $table->boolean('breakfast_options')->default(true)->after('free_cancellation');
            $table->boolean('featured')->default(false)->after('breakfast_options');
        });
    }

    public function down(): void
    {
        Schema::table('resorts', function (Blueprint $table) {
            $table->dropColumn([
                'resort_type',
                'stars',
                'promo_tag',
                'tagline',
                'cover_image',
                'free_cancellation',
                'breakfast_options',
                'featured',
            ]);
        });
    }
};

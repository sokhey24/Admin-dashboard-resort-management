<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('website_contents', function (Blueprint $table) {
            $table->id();
            $table->string('section')->index(); // hero, about, service, contact, team, footer
            $table->string('key');              // title, subtitle, description, image, logo ...
            $table->text('value')->nullable();  // text value
            $table->string('image_path')->nullable(); // image file path
            $table->timestamps();

            $table->unique(['section', 'key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('website_contents');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE recordings ADD UNIQUE INDEX recordings_full_path_unique (full_path(191))');
    }

    public function down(): void
    {
        Schema::table('recordings', function (Blueprint $table) {
            $table->dropUnique('recordings_full_path_unique');
        });
    }
};

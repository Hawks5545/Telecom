<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('recordings', function (Blueprint $table) {
            if (!Schema::hasColumn('recordings', 'full_path')) {
                $table->text('full_path')->nullable()->after('path');
            }
            if (!Schema::hasColumn('recordings', 'folder_path')) {
                $table->text('folder_path')->nullable()->after('full_path');
            }
            if (!Schema::hasColumn('recordings', 'original_created_at')) {
                $table->dateTime('original_created_at')->nullable()->after('fecha_grabacion');
            }
        });
    }

    public function down(): void
    {
        Schema::table('recordings', function (Blueprint $table) {
            $table->dropColumn(['full_path', 'folder_path', 'original_created_at']);
        });
    }
};

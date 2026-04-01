<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // PostgreSQL no necesita longitud en índices de texto
        Schema::table('recordings', function (Blueprint $table) {
            if (!$this->indexExists('recordings', 'recordings_full_path_unique')) {
                $table->unique('full_path', 'recordings_full_path_unique');
            }
        });
    }

    public function down(): void
    {
        Schema::table('recordings', function (Blueprint $table) {
            $table->dropUnique('recordings_full_path_unique');
        });
    }

    private function indexExists(string $table, string $index): bool
    {
        return DB::select("
            SELECT 1 FROM pg_indexes
            WHERE tablename = ? AND indexname = ?
        ", [$table, $index]) ? true : false;
    }
};

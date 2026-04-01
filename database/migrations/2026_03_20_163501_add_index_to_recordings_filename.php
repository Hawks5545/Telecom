<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('recordings', function (Blueprint $table) {
            if (!$this->indexExists('recordings', 'recordings_filename_index')) {
                $table->index('filename');
            }
        });
    }

    public function down(): void
    {
        Schema::table('recordings', function (Blueprint $table) {
            $table->dropIndex(['filename']);
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



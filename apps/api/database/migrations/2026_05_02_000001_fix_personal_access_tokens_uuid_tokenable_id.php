<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('personal_access_tokens')) {
            return;
        }

        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        // Legacy schema used bigint tokenable_id, but users.id is UUID.
        DB::table('personal_access_tokens')->truncate();
        DB::statement('DROP INDEX IF EXISTS personal_access_tokens_tokenable_type_tokenable_id_index');
        DB::statement('ALTER TABLE personal_access_tokens DROP COLUMN tokenable_id');
        DB::statement('ALTER TABLE personal_access_tokens ADD COLUMN tokenable_id uuid NOT NULL');
        DB::statement('CREATE INDEX personal_access_tokens_tokenable_type_tokenable_id_index ON personal_access_tokens (tokenable_type, tokenable_id)');
    }

    public function down(): void
    {
        // Intentionally no-op: reverting would break UUID-based user tokens.
    }
};

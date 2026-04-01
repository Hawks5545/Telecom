<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== MIGRACIÓN MySQL → PostgreSQL ===\n\n";

// 1. ROLES
echo "Migrando roles...\n";
DB::statement('TRUNCATE TABLE roles RESTART IDENTITY CASCADE');
$roles = DB::connection('mysql_temp')->table('roles')->get();
foreach ($roles as $role) {
    DB::table('roles')->insert([
        'id'           => $role->id,
        'name'         => $role->name,
        'display_name' => $role->display_name,
        'description'  => $role->description,
        'permissions'  => $role->permissions,
        'created_at'   => $role->created_at,
        'updated_at'   => $role->updated_at,
    ]);
}
echo "✅ Roles: " . count($roles) . "\n\n";

// 2. USERS
echo "Migrando usuarios...\n";
DB::statement('TRUNCATE TABLE users RESTART IDENTITY CASCADE');
$users = DB::connection('mysql_temp')->table('users')->get();
foreach ($users as $user) {
    DB::table('users')->insert([
        'id'                   => $user->id,
        'name'                 => $user->name,
        'email'                => $user->email,
        'cedula'               => $user->cedula,
        'role_id'              => $user->role_id,
        'password'             => $user->password,
        'is_active'            => $user->is_active,
        'must_change_password' => $user->must_change_password ?? false,
        'remember_token'       => $user->remember_token,
        'email_verified_at'    => $user->email_verified_at,
        'created_at'           => $user->created_at,
        'updated_at'           => $user->updated_at,
    ]);
}
echo "✅ Usuarios: " . count($users) . "\n\n";

// 3. STORAGE LOCATIONS
echo "Migrando storage_locations...\n";
DB::statement('TRUNCATE TABLE storage_locations RESTART IDENTITY CASCADE');
$locations = DB::connection('mysql_temp')->table('storage_locations')->get();
foreach ($locations as $loc) {
    DB::table('storage_locations')->insert([
        'id'          => $loc->id,
        'name'        => $loc->name,
        'path'        => $loc->path,
        'type'        => $loc->type,
        'is_active'   => $loc->is_active,
        'description' => $loc->description,
        'created_at'  => $loc->created_at,
        'updated_at'  => $loc->updated_at,
    ]);
}
echo "✅ Storage Locations: " . count($locations) . "\n\n";

// 4. SETTINGS
echo "Migrando settings...\n";
$settings = DB::connection('mysql_temp')->table('settings')->get();
foreach ($settings as $setting) {
    DB::table('settings')->updateOrInsert(
        ['key' => $setting->key],
        [
            'id'         => $setting->id,
            'key'        => $setting->key,
            'value'      => $setting->value,
            'created_at' => $setting->created_at,
            'updated_at' => $setting->updated_at,
        ]
    );
}
echo "✅ Settings: " . count($settings) . "\n\n";

// 5. AUDIT LOGS
echo "Migrando audit_logs...\n";
DB::statement('TRUNCATE TABLE audit_logs RESTART IDENTITY CASCADE');
$logs = DB::connection('mysql_temp')->table('audit_logs')->get();
foreach ($logs as $log) {
    DB::table('audit_logs')->insert([
        'id'         => $log->id,
        'user_id'    => $log->user_id,
        'action'     => $log->action,
        'details'    => $log->details,
        'metadata'   => $log->metadata,
        'ip_address' => $log->ip_address,
        'created_at' => $log->created_at,
        'updated_at' => $log->updated_at,
    ]);
}
echo "✅ Audit Logs: " . count($logs) . "\n\n";

// 6. RECORDINGS (en chunks por volumen)
echo "Migrando recordings (esto puede tardar varios minutos)...\n";
DB::statement('TRUNCATE TABLE recordings RESTART IDENTITY CASCADE');
$total    = DB::connection('mysql_temp')->table('recordings')->count();
$chunk    = 1000;
$migrated = 0;

DB::connection('mysql_temp')->table('recordings')->orderBy('id')->chunk($chunk, function ($records) use (&$migrated, $total) {
    $batch = [];
    foreach ($records as $rec) {
        $batch[] = [
            'id'                   => $rec->id,
            'storage_location_id'  => $rec->storage_location_id,
            'filename'             => $rec->filename,
            'full_path'            => $rec->full_path,
            'folder_path'          => $rec->folder_path,
            'size'                 => $rec->size,
            'duration'             => $rec->duration,
            'extension'            => $rec->extension,
            'cedula'               => $rec->cedula,
            'telefono'             => $rec->telefono,
            'campana'              => $rec->campana,
            'fecha_grabacion'      => $rec->fecha_grabacion,
            'original_created_at'  => $rec->original_created_at,
            'created_at'           => $rec->created_at,
            'updated_at'           => $rec->updated_at,
        ];
    }
    DB::table('recordings')->insert($batch);
    $migrated += count($records);
    echo "  Progreso: {$migrated}/{$total} (" . round(($migrated/$total)*100) . "%)\n";
});

echo "✅ Recordings: {$migrated}\n\n";

// Resetear secuencias en PostgreSQL
echo "Reseteando secuencias...\n";
$tables = ['roles', 'users', 'storage_locations', 'audit_logs', 'recordings', 'settings'];
foreach ($tables as $table) {
    DB::statement("SELECT setval('{$table}_id_seq', (SELECT MAX(id) FROM {$table}))");
}
echo "✅ Secuencias reseteadas\n\n";

echo "=== MIGRACIÓN COMPLETADA ===\n";

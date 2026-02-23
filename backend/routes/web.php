<?php

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;

Route::get('/__migrate', function () {
    abort_unless(request('key') === env('MIGRATE_KEY'), 403);

    Artisan::call('migrate', ['--force' => true]);
    return "Migrated:\n" . Artisan::output();
});

Route::get('/__db', function () {
    return DB::select('SELECT 1 as ok');
});
Route::get('/', function () {
    return response()->json([
        'status' => 'ok',
        'message' => 'Laravel backend running'
    ]);
});
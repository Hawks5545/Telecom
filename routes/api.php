<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\IndexingController; 
use App\Http\Controllers\FolderManagerController;
use App\Http\Controllers\ConfigurationController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\AuditController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\DashboardController;

// --- RUTAS PÚBLICAS ---
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'sendResetLink']);
Route::post('/password/reset', [AuthController::class, 'resetPassword']);

// --- RUTAS PROTEGIDAS ---
Route::middleware('auth:sanctum')->group(function () {
    
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Dashboard
    Route::get('/dashboard/stats', [DashboardController::class, 'getStats']);

    // Indexación
    Route::post('/indexing/scan', [IndexingController::class, 'scanFolder']);
    Route::post('/indexing/run', [IndexingController::class, 'runIndexing']);

    // Busqueda de grabaciones
    Route::get('/search/folders', [SearchController::class, 'getFolders']); 
    Route::get('/search/results', [SearchController::class, 'search']); 
    Route::get('/search/download/{id}', [SearchController::class, 'downloadItem']);
    Route::post('/search/download-zip', [SearchController::class, 'downloadZip']);
    Route::post('/search/move', [SearchController::class, 'moveRecordings']); 

    // Gestor de carpetas
    Route::get('/folder-manager/items', [FolderManagerController::class, 'getItems']);
    Route::get('/folder-manager/download/{id}', [FolderManagerController::class, 'downloadItem']);
    Route::get('/folder-manager/download-folder/{id}', [FolderManagerController::class, 'downloadFolder']);
    Route::post('/folder-manager/create', [FolderManagerController::class, 'createFolder']);
    Route::delete('/folder-manager/{id}', [FolderManagerController::class, 'deleteFolder']);
    Route::put('/folder-manager/{id}', [FolderManagerController::class, 'updateFolder']);

    // Auditoría
    Route::get('/audit/logs', [AuditController::class, 'index']);
    Route::get('/audit/users', [AuditController::class, 'getUsers']);

    // Reportes
    Route::get('/reports/users', [ReportController::class, 'getUsers']);
    Route::get('/reports/data', [ReportController::class, 'getData']);
    Route::get('/reports/pdf', [ReportController::class, 'downloadPdf']);

    // Usuarios
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);
    
    // Roles
    Route::get('/roles', [RoleController::class, 'index']);
    Route::post('/roles', [RoleController::class, 'store']);
    Route::put('/roles/{id}', [RoleController::class, 'update']);
    Route::delete('/roles/{id}', [RoleController::class, 'destroy']);

    // Configuración
    Route::get('/config/storage', [ConfigurationController::class, 'getStorageLocations']);
    Route::post('/config/storage', [ConfigurationController::class, 'addStorageLocation']);
    Route::delete('/config/storage/{id}', [ConfigurationController::class, 'deleteStorageLocation']);
    Route::put('/config/storage/{id}/toggle', [ConfigurationController::class, 'toggleStorageLocation']);
    Route::get('/config/settings', [ConfigurationController::class, 'getSettings']);
    Route::post('/config/settings', [ConfigurationController::class, 'saveSettings']);
});
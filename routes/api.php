<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\IndexingController; 
use App\Http\Controllers\FolderManagerController;
use App\Http\Controllers\ConfigurationController;

// --- RUTAS PÚBLICAS ---
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'sendResetLink']);

// RECTIFICACIÓN: Esta es la ruta que llama tu componente ResetPassword.jsx
Route::post('/password/reset', [AuthController::class, 'resetPassword']);

// --- RUTAS PROTEGIDAS ---
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    //Indexacion
    Route::post('/indexing/scan', [\App\Http\Controllers\IndexingController::class, 'scanFolder']);
    Route::post('/indexing/run', [\App\Http\Controllers\IndexingController::class, 'runIndexing']);

    //Gestor de carpetas
    Route::get('/folder-manager/items', [App\Http\Controllers\FolderManagerController::class, 'getItems']);
    Route::get('/folder-manager/download/{id}', [App\Http\Controllers\FolderManagerController::class, 'downloadItem']);
    Route::get('/folder-manager/download-folder/{id}', [FolderManagerController::class, 'downloadFolder']);

    // Usuarios
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);
    
    // Roles
    Route::get('/roles', [RoleController::class, 'index']);
    Route::post('/roles', [RoleController::class, 'store']);
    Route::delete('/roles/{id}', [RoleController::class, 'destroy']);
    Route::put('/roles/{id}', [RoleController::class, 'update']);
    Route::delete('/roles/{id}', [RoleController::class, 'destroy']);


    //Confugiracion
    Route::get('/config/storage', [App\Http\Controllers\ConfigurationController::class, 'getStorageLocations']);
    Route::post('/config/storage', [App\Http\Controllers\ConfigurationController::class, 'addStorageLocation']);
    Route::delete('/config/storage/{id}', [App\Http\Controllers\ConfigurationController::class, 'deleteStorageLocation']);
    Route::put('/config/storage/{id}/toggle', [App\Http\Controllers\ConfigurationController::class, 'toggleStorageLocation']);
    Route::get('/config/settings', [App\Http\Controllers\ConfigurationController::class, 'getSettings']);
    Route::post('/config/settings', [App\Http\Controllers\ConfigurationController::class, 'saveSettings']);

    Route::get('/user', function (Request $request) {
        return $request->user();
    });
});
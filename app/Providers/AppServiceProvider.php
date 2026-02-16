<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Auth\Notifications\ResetPassword; 

class AppServiceProvider extends ServiceProvider
{
   
    public function register(): void
    {
        
    }
    public function boot(): void
{
    ResetPassword::createUrlUsing(function (object $notifiable, string $token) {
        $frontendUrl = env('APP_URL'); 
        
        return "{$frontendUrl}/reset-password/{$token}?email={$notifiable->getEmailForPasswordReset()}";
    });
}
}

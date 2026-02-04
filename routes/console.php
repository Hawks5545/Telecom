<?php

use Illuminate\Support\Facades\Schedule;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

// Esta línea es opcional, suele venir por defecto
Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// --- AQUI ESTÁ LA CLAVE: PROGRAMAMOS TU ROBOT ---
// Le decimos a Laravel: "Intenta ejecutar el robot CADA MINUTO"
// (El robot internamente decidirá si trabaja o se vuelve a dormir según los 30 min)
Schedule::command('app:sync-recordings')->everyMinute()->withoutOverlapping();
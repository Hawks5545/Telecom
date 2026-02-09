<?php

namespace Tests\Browser;

use Laravel\Dusk\Browser;
use Tests\DuskTestCase;

class IndexingTest extends DuskTestCase
{
    public function test_admin_can_access_indexing_and_try_scan()
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('/login')
                    // --- 1. LOGIN ---
                    ->waitForText('TeleCom', 10)
                    ->press('Iniciar Sesión')
                    ->waitForText('Bienvenido', 10)
                    ->type('#emailInput', 'carlosaad75@gmail.com') 
                    ->type('#passwordInput', 'Admin123*')
                    ->press('Entrar')
                    ->waitForLocation('/dashboard')

                    // --- 2. NAVEGACIÓN ---
                    ->pause(1000)
                    ->clickLink('Indexación')
                    
                    // --- 3. VERIFICACIÓN DE UI ---
                    ->waitForText('Módulo de Indexación', 10)
                    
                    // CORRECCIÓN: Usamos el texto en mayúsculas como se ve en la imagen
                    ->assertSee('DETECTADAS (SCAN)')
                    ->assertSee('TOTAL EN BD')
                    
                    // Verificamos que el botón de Indexar existe (aunque esté deshabilitado)
                    ->assertSee('Iniciar Indexación')

                    // --- 4. SIMULACIÓN DE ESCANEO ---
                    // Escribimos en el input grande
                    ->type('input[placeholder="Ingresa la ruta de la carpeta a escanear"]', 'C:/audios_prueba')
                    
                    // Damos clic en el botón de Escanear (Texto exacto de tu botón)
                    ->press('Escanear Carpeta')

                    // --- 5. VERIFICAR LOGS ---
                    // Esperamos ver el log de inicio
                    ->waitForText('Iniciando escaneo en:', 10);
        });
    }
}
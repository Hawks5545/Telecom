<?php

namespace Tests\Browser;

use Laravel\Dusk\Browser;
use Tests\DuskTestCase;

class SearchTest extends DuskTestCase
{
    /**
     * Prueba de Búsqueda de Grabaciones
     */
    public function test_user_can_search_recordings()
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('/login')
                    // --- PASO 1: LOGIN COMPLETO ---
                    ->waitForText('TeleCom', 10)
                    ->press('Iniciar Sesión')
                    ->waitForText('Bienvenido', 10)
                    ->type('#emailInput', 'carlosaad75@gmail.com') 
                    ->type('#passwordInput', 'Admin123*')
                    ->press('Entrar')
                    ->waitForLocation('/dashboard')

                    // --- PASO 2: IR AL BUSCADOR ---
                    // Esperamos un momento para asegurar que el menú es clicable
                    ->pause(1000) 
                    ->clickLink('Búsqueda Grabaciones')
                    
                    // --- PASO 3: REALIZAR BÚSQUEDA ---
                    ->waitForText('Búsqueda de Grabaciones', 10)
                    ->type('cedula', '1098') // Escribimos en el input name="cedula"
                    ->press('Buscar')

                    // --- PASO 4: VERIFICAR RESULTADOS ---
                    ->pause(2000) // Esperamos a que la API responda
                    ->assertSee('Peso'); // Verificamos que cargó la tabla
        });
    }
}
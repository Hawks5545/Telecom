<?php

namespace Tests\Browser;

use Laravel\Dusk\Browser;
use Tests\DuskTestCase;

class LogoutTest extends DuskTestCase
{
    /**
     * Prueba de Cerrar Sesión (Corrección de Tiempos)
     */
    public function test_user_can_logout()
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
                    
                    // Esperamos estar seguros en el dashboard
                    ->waitForLocation('/dashboard')
                    ->waitForText('Dashboard', 10) // Asegura que cargó el texto principal
                    
                    // --- PASO 2: CERRAR SESIÓN ---
                    // Esperamos que el icono sea visible y le damos clic
                    ->waitFor('.bi-box-arrow-right', 10)
                    ->click('.bi-box-arrow-right') 

                    // --- PASO 3: VERIFICACIÓN (EL CAMBIO CLAVE) ---
                    // Esperamos un texto que SOLO está en la pantalla de login.
                    // Esto obliga al robot a esperar a que la redirección termine.
                    ->waitForText('Accede a la plataforma', 15) 
                    
                    ->assertPathIs('/login');
        });
    }
}
<?php

namespace Tests\Browser;

use Laravel\Dusk\Browser;
use Tests\DuskTestCase;

class LoginTest extends DuskTestCase
{
    /**
     * Prueba de Login Exitoso (Pasando por WelcomePanel -> LoginForm)
     */
    public function test_admin_can_login_correctly()
    {
        $this->browse(function (Browser $browser) {
            $browser->visit('/login')
                    // 1. PRIMERA PANTALLA: WELCOME PANEL
                    // Esperamos ver el título principal o el botón
                    ->waitForText('TeleCom', 10) 
                    
                    // Damos clic en el botón para ir al formulario
                    // Dusk busca botones por su texto visible
                    ->press('Iniciar Sesión') 
                    
                    // 2. SEGUNDA PANTALLA: LOGIN FORM
                    // Ahora sí esperamos la palabra "Bienvenido"
                    ->waitForText('Bienvenido', 10) 
                    
                    // Llenamos los datos (asegúrate de usar los IDs correctos)
                    ->type('#emailInput', 'carlosaad75@gmail.com') 
                    ->type('#passwordInput', 'Admin123*') // <--- ¡PON TU CLAVE REAL!
                    
                    // Clic en "Entrar"
                    ->press('Entrar') 
                    
                    // 3. TERCERA PANTALLA: DASHBOARD
                    ->waitForLocation('/dashboard')
                    ->assertPathIs('/dashboard')
                    ->assertSee('Dashboard');
        });
    }
}
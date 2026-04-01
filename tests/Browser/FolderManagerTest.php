<?php

namespace Tests\Browser;

use Laravel\Dusk\Browser;
use Tests\DuskTestCase;

class FolderManagerTest extends DuskTestCase
{
    public function test_admin_can_access_folder_manager()
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
                    ->clickLink('Gestor de Carpetas')
                    
                    // --- 3. VERIFICACIÓN ---
                    ->waitForText('Gestión de Carpetas', 10)
                    ->assertPresent('input[placeholder="..."]') // Filtro Buscar
                    
                    // Verificamos columnas clave de la tabla
                    ->assertSee('Nombre')
                    ->assertSee('Info / Peso')
                    
                    // Verificamos que cargó la tabla (ya sea vacía o con datos)
                    // Si está vacía dice "0 resultados", si tiene datos dice "Mostrando"
                    ->assertSee('resultados'); 
        });
    }
}
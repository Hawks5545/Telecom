import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: [
                'resources/css/app.scss', // Asegúrate de que esto coincida con lo que tenías
                'resources/js/app.jsx'
            ],
            refresh: true,
        }),
        react(),
    ],
    // --- AGREGA ESTO PARA SILENCIAR LAS ADVERTENCIAS ---
    css: {
        preprocessorOptions: {
            scss: {
                // Borramos 'mixed-decls' de aquí
                silenceDeprecations: ['import', 'global-builtin', 'color-functions', 'if-function'],
            },
        },
    },
});
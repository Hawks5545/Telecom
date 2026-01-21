import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: [
                'resources/css/app.scss', // Se cambia  css por scss para usar Bootstrap
                'resources/js/app.jsx',   // Se cambia .js por .jsx para React
            ],
            refresh: true,
        }),
        react(),
    ],
});
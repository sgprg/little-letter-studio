import { defineConfig } from 'vite';
export default defineConfig({ base:'./', build:{ target:'es2022', sourcemap:false }, server:{ port:5173 }, preview:{ port:4173 } });

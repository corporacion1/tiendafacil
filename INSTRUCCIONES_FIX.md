# INSTRUCCIONES URGENTES PARA REPARACION

## PROBLEMA ACTUAL

La app tiene ChunkLoadError de Next.js.
La cache esta corrompida.

## SOLUCION PASO A PASO

### PASO 1: DETENER SERVIDOR
En tu terminal donde corre npm run dev, presiona:
Ctrl+C

### PASO 2: LIMPIAR CACHE NEXT.JS
En la terminal, ejecuta:
rm -rf .next
rm -rf node_modules/.cache

### PASO 3: REINSTALAR DEPENDENCIAS
npm install

### PASO 4: LIMPIAR NPM
npm cache clean --force

### PASO 5: REINICIAR SERVIDOR
npm run dev

### PASO 6: ESPERAR 1-2 MINUTOS
Esperaes que el servidor compile completamente.
Debe aparecer: Local: http://localhost:3000

### PASO 7: ABRIR APP
Ve a http://localhost:3000

## SI NO FUNCIONA

Intenta (elimina todo y reinstala):
rm -rf .next
rm -rf node_modules  
rm package-lock.json
npm install
npm run dev

## SI NADA FUNCIONA

Contacta con los detalles del error.

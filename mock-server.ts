/**
 * Mock Server para desarrollo y testing
 * Ejecutar: bunx tsx mock-server.ts
 * o: npm run mock:server
 * 
 * El servidor siempre corre en puerto 3002
 */

import { createMockServer } from "./mockServer"

const PORT = 3002

console.log(`Iniciando Mock Server en puerto ${PORT}...`)
createMockServer(PORT)

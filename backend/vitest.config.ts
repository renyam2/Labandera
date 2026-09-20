import { defineConfig } from 'vitest/config'
import dotenv from 'dotenv'

dotenv.config()

export default defineConfig({
  test: {
    environment: 'node',
    // Una sola secuencia: los tests comparten la base de datos de desarrollo.
    fileParallelism: false,
    include: ['tests/**/*.test.ts'],
  },
})

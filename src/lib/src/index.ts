// FoodLoop shared library — código portável (zero DOM, zero Node-only).
export * from './schemas/index.js';
export * from './domain/index.js';
export { ErrorCode } from './errors/codes.js';
export * as api from './api/index.js';
export const VERSION = '0.0.1';

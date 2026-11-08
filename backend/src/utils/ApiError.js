import { ERRORS } from './errorCatalog.js';

/** Operational error: always created from a catalog code so status, code and Arabic message stay consistent. */
export default class ApiError extends Error {
  constructor(code, details) {
    const entry = ERRORS[code] || ERRORS.INTERNAL_ERROR;
    super(entry[1]);
    this.name = 'ApiError';
    this.code = ERRORS[code] ? code : 'INTERNAL_ERROR';
    this.statusCode = entry[0];
    this.status = this.statusCode >= 500 ? 'error' : 'fail';
    this.isOperational = true;
    if (details) this.details = details;
  }
}

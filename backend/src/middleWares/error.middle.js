import ApiError from '../utils/ApiError.js';
import { logError } from '../utils/logger.js';

export const notFound = (_req, _res, next) => next(new ApiError('ROUTE_NOT_FOUND'));

const isDbDown = (e) =>
  ['MongooseServerSelectionError', 'MongoServerSelectionError', 'MongoNetworkError', 'MongoNetworkTimeoutError'].includes(e?.name) ||
  /buffering timed out/i.test(e?.message || '');

/** Converts anything thrown into a safe, coded response. Raw messages never reach the client. */
export const errorHandler = (err, req, res, _next) => {
  let apiError = err;
  if (!(err instanceof ApiError)) {
    if (err?.type === 'entity.parse.failed') apiError = new ApiError('INVALID_JSON');
    else if (err?.type === 'entity.too.large') apiError = new ApiError('PAYLOAD_TOO_LARGE');
    else if (err?.code === 'LIMIT_FILE_SIZE') apiError = new ApiError('IMAGE_TOO_LARGE');
    else if (err?.code === 'LIMIT_UNEXPECTED_FILE' || err?.name === 'MulterError') apiError = new ApiError('IMAGE_REQUIRED');
    else if (err?.code === 11000) apiError = new ApiError('EMAIL_EXISTS');
    else if (err?.name === 'ValidationError' || err?.name === 'CastError') apiError = new ApiError('VALIDATION_ERROR');
    else if (isDbDown(err)) apiError = new ApiError('SERVICE_UNAVAILABLE');
    else apiError = new ApiError('INTERNAL_ERROR');
    if (apiError.statusCode >= 500) logError(err, req);
  } else if (apiError.statusCode >= 500) logError(err.cause || err, req);

  if (res.headersSent) return;
  const body = { statusCode: apiError.statusCode, status: apiError.status, code: apiError.code, message: apiError.message };
  if (apiError.details) body.details = apiError.details;
  res.status(apiError.statusCode).json(body);
};

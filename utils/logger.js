const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

class Logger {
  constructor(context) {
    this.context = context;
  }

  _formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level,
      context: this.context,
      message,
      ...(data && { data: this._sanitizeData(data) }),
    };
    return JSON.stringify(logData);
  }

  _sanitizeData(data) {
    // Deep clone the data to avoid modifying the original
    const clonedData = JSON.parse(JSON.stringify(data));
    
    // List of sensitive fields to redact
    const sensitiveFields = ['password', 'token', 'secret', 'key'];
    
    const redact = (obj) => {
      if (!obj || typeof obj !== 'object') return obj;
      
      Object.keys(obj).forEach(key => {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object') {
          redact(obj[key]);
        }
      });
      
      return obj;
    };

    return redact(clonedData);
  }

  debug(message, data = null) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(this._formatMessage('DEBUG', message, data));
    }
  }

  info(message, data = null) {
    console.log(this._formatMessage('INFO', message, data));
  }

  warn(message, data = null) {
    console.warn(this._formatMessage('WARN', message, data));
  }

  error(message, error = null, additionalData = null) {
    const errorData = error ? {
      message: error.message,
      name: error.name,
      stack: error.stack,
      ...(error.code && { code: error.code }),
      ...additionalData
    } : additionalData;

    console.error(this._formatMessage('ERROR', message, errorData));
  }

  // Special method for auth-related logging
  authEvent(event, data = null) {
    this.info(`Auth Event: ${event}`, data);
  }

  // Special method for cookie-related logging
  cookieOperation(operation, cookieName, options = null) {
    this.debug(`Cookie ${operation}`, {
      cookie: cookieName,
      ...(options && { options: this._sanitizeData(options) })
    });
  }
}

// Create loggers for different contexts
export const createLogger = (context) => new Logger(context);

// Create commonly used loggers
export const authLogger = createLogger('auth');
export const middlewareLogger = createLogger('middleware');
export const apiLogger = createLogger('api');

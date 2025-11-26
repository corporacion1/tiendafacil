// Simple environment-aware logger
// - In development: all levels output
// - In production: only warn/error output (debug/info are no-ops)
// You can force debug logs by setting NEXT_PUBLIC_DEBUG_LOGS=true

const isProd = process.env.NODE_ENV === 'production';
const forceDebug = process.env.NEXT_PUBLIC_DEBUG_LOGS === 'true';

function fmt(args: any[]) {
  return args;
}

export const logger = {
  debug: (...args: any[]) => {
    if (!isProd || forceDebug) {
      // eslint-disable-next-line no-console
      console.debug(...fmt(args));
    }
  },
  info: (...args: any[]) => {
    if (!isProd || forceDebug) {
      // eslint-disable-next-line no-console
      console.info(...fmt(args));
    }
  },
  warn: (...args: any[]) => {
    // eslint-disable-next-line no-console
    console.warn(...fmt(args));
  },
  error: (...args: any[]) => {
    // eslint-disable-next-line no-console
    console.error(...fmt(args));
  },
};

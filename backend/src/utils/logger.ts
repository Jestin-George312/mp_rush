/**
 * Minimal logger utility.
 * Wraps console methods with timestamps and level labels.
 * Swap internals with winston later without changing call sites.
 */

const timestamp = () => new Date().toISOString();

const logger = {
    info: (msg: string, ...args: unknown[]) => {
        console.info(`[${timestamp()}] INFO:  ${msg}`, ...args);
    },
    warn: (msg: string, ...args: unknown[]) => {
        console.warn(`[${timestamp()}] WARN:  ${msg}`, ...args);
    },
    error: (msg: string, ...args: unknown[]) => {
        console.error(`[${timestamp()}] ERROR: ${msg}`, ...args);
    },
    debug: (msg: string, ...args: unknown[]) => {
        if (process.env.NODE_ENV !== 'production') {
            console.debug(`[${timestamp()}] DEBUG: ${msg}`, ...args);
        }
    },
};

export default logger;

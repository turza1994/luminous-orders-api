function formatMessage(level: string, message: string, meta?: Record<string, unknown>): string {
    const entry: Record<string, unknown> = {
        timestamp: new Date().toISOString(),
        level,
        message,
    };
    if (meta && Object.keys(meta).length > 0) {
        entry.meta = meta;
    }
    return JSON.stringify(entry);
}

export const logger = {
    info(message: string, meta?: Record<string, unknown>) {
        console.log(formatMessage("info", message, meta));
    },
    error(message: string, meta?: Record<string, unknown>) {
        console.error(formatMessage("error", message, meta));
    },
    warn(message: string, meta?: Record<string, unknown>) {
        console.warn(formatMessage("warn", message, meta));
    },
};

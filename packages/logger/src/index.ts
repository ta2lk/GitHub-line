export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'STEP';

export interface StructuredLog {
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  requestId?: string;
  userId?: string;
  projectId?: string;
  buildId?: string;
  metadata?: Record<string, any>;
}

export class Logger {
  private serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  private log(level: LogLevel, message: string, ctx?: {
    requestId?: string;
    userId?: string;
    projectId?: string;
    buildId?: string;
    metadata?: Record<string, any>;
  }) {
    const entry: StructuredLog = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      message,
      requestId: ctx?.requestId,
      userId: ctx?.userId,
      projectId: ctx?.projectId,
      buildId: ctx?.buildId,
      metadata: ctx?.metadata
    };

    const formatted = `[${entry.timestamp}] [${entry.level}] [${entry.service}] ${message}`;
    if (level === 'ERROR') {
      console.error(formatted, entry.metadata || '');
    } else if (level === 'WARN') {
      console.warn(formatted, entry.metadata || '');
    } else {
      console.log(formatted);
    }
  }

  debug(msg: string, ctx?: any) { this.log('DEBUG', msg, ctx); }
  info(msg: string, ctx?: any) { this.log('INFO', msg, ctx); }
  warn(msg: string, ctx?: any) { this.log('WARN', msg, ctx); }
  error(msg: string, ctx?: any) { this.log('ERROR', msg, ctx); }
  step(msg: string, ctx?: any) { this.log('STEP', msg, ctx); }
}

export const createLogger = (serviceName: string) => new Logger(serviceName);

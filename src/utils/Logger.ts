/**
 * 日志记录工具类
 * 用于代码审查过程中的日志记录
 */

// Node.js console 声明
declare const console: {
  debug: (message?: any, ...optionalParams: any[]) => void;
  info: (message?: any, ...optionalParams: any[]) => void;
  warn: (message?: any, ...optionalParams: any[]) => void;
  error: (message?: any, ...optionalParams: any[]) => void;
};

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export class Logger {
  private context: string;
  private logLevel: LogLevel;

  constructor(context: string = 'CodeReviewMCP', logLevel: LogLevel = LogLevel.INFO) {
    this.context = context;
    this.logLevel = logLevel;
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const baseMessage = `[${timestamp}] [${level}] [${this.context}] ${message}`;
    
    if (data) {
      return `${baseMessage}\n${JSON.stringify(data, null, 2)}`;
    }
    
    return baseMessage;
  }

  debug(message: string, data?: any): void {
    if (this.logLevel <= LogLevel.DEBUG) {
      console.debug(this.formatMessage('DEBUG', message, data));
    }
  }

  info(message: string, data?: any): void {
    if (this.logLevel <= LogLevel.INFO) {
      console.info(this.formatMessage('INFO', message, data));
    }
  }

  warn(message: string, data?: any): void {
    if (this.logLevel <= LogLevel.WARN) {
      console.warn(this.formatMessage('WARN', message, data));
    }
  }

  error(message: string, data?: any): void {
    if (this.logLevel <= LogLevel.ERROR) {
      console.error(this.formatMessage('ERROR', message, data));
    }
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  setContext(context: string): void {
    this.context = context;
  }
}
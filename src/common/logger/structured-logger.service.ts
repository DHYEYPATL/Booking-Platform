import { ConsoleLogger, Injectable, Scope } from '@nestjs/common';
import { als } from './als';

@Injectable({ scope: Scope.TRANSIENT })
export class StructuredLogger extends ConsoleLogger {
  log(message: any, context?: string) {
    this.printFormatted('info', message, context);
  }

  error(message: any, stack?: string, context?: string) {
    this.printFormatted('error', message, context, stack);
  }

  warn(message: any, context?: string) {
    this.printFormatted('warn', message, context);
  }

  debug(message: any, context?: string) {
    this.printFormatted('debug', message, context);
  }

  verbose(message: any, context?: string) {
    this.printFormatted('verbose', message, context);
  }

  private printFormatted(level: string, message: any, context?: string, stack?: string) {
    const store = als.getStore();
    const requestId = store?.requestId;

    if (process.env.NODE_ENV === 'production') {
      const logObject = {
        timestamp: new Date().toISOString(),
        level,
        context: context || this.context,
        message: typeof message === 'object' ? message : String(message),
        ...(requestId ? { requestId } : {}),
        ...(stack ? { stack } : {}),
      };
      console.log(JSON.stringify(logObject));
    } else {
      // Fallback to pretty ConsoleLogger in development
      const formattedContext = context ? `[${context}]` : '';
      const formattedRequestId = requestId ? ` [ReqID: ${requestId}]` : '';
      const decoratedMessage = `${formattedRequestId} ${message}`;
      
      if (level === 'error') {
        super.error(decoratedMessage, stack, context);
      } else if (level === 'warn') {
        super.warn(decoratedMessage, context);
      } else if (level === 'debug') {
        super.debug(decoratedMessage, context);
      } else if (level === 'verbose') {
        super.verbose(decoratedMessage, context);
      } else {
        super.log(decoratedMessage, context);
      }
    }
  }
}

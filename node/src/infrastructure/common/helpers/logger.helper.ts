import { Logger as NestjsLogger } from '@nestjs/common'
import { ELoggerType } from '~/domain/enums/common.enum'

export class Logger {
  static log(name: string, type: ELoggerType, message: string, stack?: any): void {
    const logger: NestjsLogger = new NestjsLogger(name)

    switch (type) {
      case ELoggerType.DEBUG:
        logger.debug(message, stack)
        break

      case ELoggerType.WARNING:
        logger.warn(message, stack)
        break

      case ELoggerType.ERROR:
        logger.error(message, stack)
        break

      default:
        logger.log(message, stack)
        break
    }
  }
}

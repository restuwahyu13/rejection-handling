import { IncomingMessage, OutgoingMessage, Server } from 'node:http'
import { Socket } from 'node:net'
import { INestApplication } from '@nestjs/common'

import { Logger } from '~/infrastructure/common/helpers/logger.helper'
import { Cluster } from '~/infrastructure/common/helpers/cluster.helper'
import { ELoggerType } from '~/domain/enums/common.enum'

export class GracefulShutdown {
  private connection: Map<string, any> = undefined
  private env: string = 'development'
  private gracefulShutdownTimer: number = 0
  private signals: string[] = []

  constructor() {
    this.connection = new Map()
    this.env = process.env.NODE_ENV || 'development'
    this.gracefulShutdownTimer = this.env === 'development' ? 5000 : 15000
    this.signals = ['SIGTERM', 'SIGINT', 'SIGQUIT', 'SIGHUP', 'SIGABRT', 'SIGALRM', 'SIGUSR1', 'SIGUSR2']
  }

  private log(type: ELoggerType, message: string, stack?: any): void {
    Logger.log(type === ELoggerType.INFO ? 'GracefulShutdown' : 'ApplicationError', type, message, stack)
  }

  private cleanup(signal: string): void {
    process.removeAllListeners()
    process.kill(process.pid, signal)
    process.exit(0)
  }

  private event(): void {
    process
      .on('uncaughtException', (err: Error, _origin: NodeJS.UncaughtExceptionOrigin) => {
        if (err) this.log(ELoggerType.ERROR, `uncaughtException: ${err?.message}`, err)
      })
      .on('uncaughtExceptionMonitor', (err: Error, _origin: NodeJS.UncaughtExceptionOrigin) => {
        if (err) this.log(ELoggerType.ERROR, `uncaughtExceptionMonitor: ${err?.message}`, err)
      })
      .on('unhandledRejection', (reason: unknown, _promise: Promise<unknown>) => {
        if (reason) this.log(ELoggerType.ERROR, `unhandledRejection: ${reason}`, reason)
      })
      .on('rejectionHandled', (reason: unknown, _promise: Promise<unknown>) => {
        if (reason) this.log(ELoggerType.ERROR, `rejectionHandled: ${reason}`, reason)
      })
  }

  private sleep(timer: number): Promise<any> {
    return new Promise((resolve) => setTimeout(resolve, timer))
  }

  private close(server: Server, signal: string): void {
    const socket: Socket = this.connection.get('connection')
    if (!socket?.destroyed) {
      socket?.destroy()
    }

    server.close(async (err) => {
      process.nextTick(() => {
        this.connection.clear()

        if (!err) {
          this.log(ELoggerType.INFO, `Gracefull shutdown PID ${process.pid} successfully`)
          this.cleanup(signal)
        } else {
          this.log(ELoggerType.INFO, `Gracefull shutdown PID ${process.pid} successfully`)
          this.cleanup(signal)
        }
      })

      await this.sleep(this.gracefulShutdownTimer)
    })
  }

  listen(app: INestApplication, port: number, cb: () => void): void {
    const server: Server = app.getHttpServer()

    server.on('connection', (socket: Socket): void => {
      if (socket) {
        this.connection.set('connection', socket)
      } else {
        socket.destroy()
      }
    })

    server.on('request', (req: IncomingMessage, _res: OutgoingMessage): void => {
      const socketRequest: Socket = req.socket
      const socketConnection: Socket = this.connection.get('connection')

      if (!(socketRequest instanceof Socket) || !(socketConnection instanceof Socket)) {
        this.connection.clear()
        this.connection.set('connection', socketRequest)
      }
    })

    this.event()

    this.signals.forEach((event: string) => {
      if (this.env === 'development') {
        process.on(event, (signal: string): void => {
          this.log(ELoggerType.INFO, `Application ${this.env} received signal: ${signal}`)
          this.close(server, signal)
        })
      } else {
        process.on(event, (signal: string): void => {
          this.log(ELoggerType.INFO, `Application ${this.env} received signal: ${signal}`)
          this.close(server, signal)
        })
      }
    })

    new Cluster().thread(process.env.SINGLE_THREAD === 'true' ? true : false, () => server.listen.bind(app.listen(port, cb)))
  }
}

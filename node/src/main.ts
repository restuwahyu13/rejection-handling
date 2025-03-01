import 'reflect-metadata'
import 'express-async-errors'
import { INestApplicationContext, ValidationPipe, VersioningType } from '@nestjs/common'
import { NestExpressApplication } from '@nestjs/platform-express'
import { NestFactory } from '@nestjs/core'
import zlib from 'node:zlib'
import express from 'express'
import helmet from 'helmet'
import hpp from 'hpp'
import nocache from 'nocache'
import compression from 'compression'

import { AppErrorException } from '~/app.exception'
import { AppInterceptor } from '~/app.interceptor'
import { AppModule } from '~/app.module'
import { GracefulShutdown } from '~/infrastructure/common/helpers/graceful.helper'
import { Logger } from '~/infrastructure/common/helpers/logger.helper'
import { EnvService } from '~/infrastructure/common/configs/env.config'
import { ELoggerType } from '~/domain/enums/common.enum'

class ApplicationServer {
  private app: NestExpressApplication
  private env: EnvService

  private async setupApplication(): Promise<void> {
    this.app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true, forceCloseConnections: true, moduleIdGeneratorAlgorithm: 'deep-hash' })
  }

  private serviceContextGetter(): void {
    const ctx: INestApplicationContext = this.app.select(AppModule)
    this.env = ctx.get(EnvService)
  }

  private globalConfig(): void {
    this.app.useGlobalPipes(new ValidationPipe({ transform: true }))
    this.app.useGlobalFilters(new AppErrorException())
    this.app.useGlobalInterceptors(new AppInterceptor())
    this.app.enableVersioning({ type: VersioningType.URI })
    this.app.enableShutdownHooks()
    this.app.enableCors()
    this.app.disable('x-powered-by')
  }

  private globalMiddleware(): void {
    this.app.use(nocache())
    this.app.use(helmet())
    this.app.use(express.json({ limit: +process.env.INBOUND_SIZE_MAX }))
    this.app.use(express.raw({ limit: +process.env.INBOUND_SIZE_MAX }))
    this.app.use(express.urlencoded({ limit: +process.env.INBOUND_SIZE_MAX, extended: true }))
    this.app.use(hpp({ checkBody: true, checkQuery: true, checkBodyOnlyForContentType: 'application/json' }))
    this.app.use(
      compression({
        strategy: zlib.constants.Z_RLE,
        level: zlib.constants.Z_BEST_COMPRESSION,
        memLevel: zlib.constants.Z_BEST_COMPRESSION,
      }),
    )
  }

  private serverListen(): void {
    const rejection: boolean = JSON.parse(this.env.REJECTION_HANDLER)
    const port: number = this.env.PORT

    if (rejection) new GracefulShutdown().listen(this.app, port, () => Logger.log('ApplicationServer', ELoggerType.INFO, `Server listening on port: ${port} + With REJECTION_HANDLER`))
    else this.app.listen(port, () => Logger.log('ApplicationServer', ELoggerType.INFO, `Server listening on port: ${port} + Without REJECTION_HANDLER`))
  }

  async bootstrapping(): Promise<void> {
    await this.setupApplication()
    this.serviceContextGetter()
    this.globalConfig()
    this.globalMiddleware()
    this.serverListen()
  }
}

/**
 * @description boostraping app and run app with env development | production | staging
 */

;((): void => {
  new ApplicationServer().bootstrapping()
})()

import { ConfigModule } from '@nestjs/config'
import { Module } from '@nestjs/common'

import { ApplicationController } from '~/app.controller'
import { ApplicationService } from '~/app.service'
import { EnvService } from '~/infrastructure/common/configs/env.config'
import { Validate } from '~/infrastructure/common/helpers/validate.helper'

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      expandVariables: true,
      isGlobal: true,
      cache: true,
      validate: Validate.env,
    }),
  ],
  controllers: [ApplicationController],
  providers: [EnvService, ApplicationService],
  exports: [EnvService],
})
export class AppModule {}

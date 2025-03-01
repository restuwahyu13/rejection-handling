import { IsBooleanString, IsEnum, IsNotEmpty, IsNumber } from 'class-validator'
import { ConfigService } from '@nestjs/config'
import { Injectable } from '@nestjs/common'

import { EEnvirontment } from '~/domain/enums/common.enum'

export class Validator {
  @IsNotEmpty()
  @IsEnum(EEnvirontment)
  NODE_ENV: EEnvirontment

  @IsNotEmpty()
  @IsNumber()
  PORT: number

  @IsNotEmpty()
  @IsNumber()
  INBOUND_SIZE_MAX: number

  @IsNotEmpty()
  @IsBooleanString()
  REJECTION_HANDLER: string
}

@Injectable()
export class EnvService extends Validator {
  constructor(private configService: ConfigService) {
    super()

    this.NODE_ENV = this.configService.get<EEnvirontment>('NODE_ENV')
    this.PORT = this.configService.get<number>('PORT')
    this.INBOUND_SIZE_MAX = this.configService.get<number>('INBOUND_SIZE_MAX')
    this.REJECTION_HANDLER = this.configService.get<string>('REJECTION_HANDLER')
  }
}

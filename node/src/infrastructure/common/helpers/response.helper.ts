import { HttpStatus as status } from '@nestjs/common'
import { OutgoingMessage } from 'node:http'
import { Response } from 'express'

import { IResponse } from '~/domain/interfaces/common.interface'
import { Logger } from '~/infrastructure/common/helpers/logger.helper'
import { ELoggerType } from '~/domain/enums/common.enum'

export const response = <T = any>(options: Partial<IResponse>, res?: Response): T => {
  const apiResponse: Partial<IResponse> = {}
  const errCode: string = 'GENERAL_ERROR'
  const errMessage: string = 'Application is busy please try again later!'

  if (options instanceof Error) {
    const message: string = `
    =============================================
    ======== Response Exception [Error] =========
    =============================================

      name: ${options.name}
      message: ${options.message}
      stack: ${options.stack}

    =============================================
    =============================================
    =============================================
    `

    Logger.log('AppErrorException', ELoggerType.ERROR, message, options)
  }

  options.stat_code = options.stat_code ?? status.INTERNAL_SERVER_ERROR

  if (!options.stat_code && !options.message && !options.error) {
    options.err_code = errCode
    options.error = errMessage
  } else if (options?.errors || options instanceof Error) {
    apiResponse.stat_code = options.stat_code
    apiResponse.err_code = errCode
    apiResponse.error = errMessage

    if (options?.errors) {
      delete apiResponse.stat_code
      delete apiResponse.err_code
      delete apiResponse.error

      apiResponse.errors = options.errors
    }

    options = apiResponse
  }

  for (const i of Object.keys(options)) {
    if (options[i] === undefined) {
      delete options[i]
    }
  }

  if (res instanceof OutgoingMessage) {
    return res.status(!options?.errors ? options.stat_code : status.UNPROCESSABLE_ENTITY).json({ ...options }) as any
  }

  return { ...options } as any
}

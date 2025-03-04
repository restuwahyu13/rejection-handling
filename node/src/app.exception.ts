import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus as status } from '@nestjs/common'
import { HttpArgumentsHost } from '@nestjs/common/interfaces'
import { Response } from 'express'
import { OutgoingMessage } from 'node:http'
import validator from 'validator'

import { Logger } from '~/infrastructure/common/helpers/logger.helper'
import { ELoggerType } from '~/domain/enums/common.enum'

@Catch()
export class AppErrorException implements ExceptionFilter {
  private statCode: number = status.INTERNAL_SERVER_ERROR
  private errCode: string = 'GENERAL_ERROR'
  private errMessage: string = 'Application is busy please try again later!'

  private setLogError(name: string, type: ELoggerType, error: any): void {
    if (error instanceof HttpException) {
      const message: string = `
      ====================================================
      ======== ${name} [HttpException] =========
      ====================================================

        name: ${error?.name}
        code: ${error?.getStatus()}
        message: ${error?.message}
        response: ${JSON.stringify(error?.getResponse())}
        stack: ${error?.stack}

      ====================================================
      ====================================================
      ====================================================
          `

      Logger.log(name, type, message, error)
      this.statCode = error && !Number.isNaN(error?.getStatus()) ? error?.getStatus() : status.INTERNAL_SERVER_ERROR

      const resMessage: any = error?.getResponse()
      const customErrMessage = resMessage.hasOwnProperty('message') ? resMessage?.message : resMessage

      this.errMessage = error && !validator.isEmpty(error?.message) ? customErrMessage : this.errMessage
    } else if (error instanceof Error) {
      const message: string = `
      ============================================
      ======== ${name} [Error] =========
      ============================================

        name: ${error?.name}
        message: ${error?.message}
        response: ${JSON.stringify(error)}
        stack: ${error?.stack}

      ============================================
      ============================================
      ============================================
          `

      Logger.log(name, type, message, error)
    } else {
      const message: string = `
      =============================================
      ======== ${name} [Common] =========
      =============================================

        name: ${error?.name}
        message: ${error?.message}
        response: ${JSON.stringify(error)}
        stack: ${error?.stack}

      =============================================
      =============================================
      =============================================
          `

      Logger.log(name, type, message, error)
      this.statCode = error && error?.stat_code ? error.stat_code : this.statCode
      this.errMessage = error && error?.error ? error.error : this.errMessage
    }
  }

  private setDefaultErrMsgAndErrCode(statCode: number): { err_code: string; error?: string } {
    if (statCode === status.INTERNAL_SERVER_ERROR) {
      this.errCode = 'GENERAL_ERROR'
      this.errMessage = 'Application between service is busy please try again later!'
    } else if (statCode === status.BAD_GATEWAY) {
      this.errCode = 'SERVICE_ERROR'
      this.errMessage = 'Application communication between server busy try again later!'
    } else if (statCode === status.SERVICE_UNAVAILABLE) {
      this.errCode = 'SERVICE_UNAVAILABLE'
      this.errMessage = 'Application communication between server not available try again later!'
    } else if (statCode === status.GATEWAY_TIMEOUT) {
      this.errCode = 'SERVICE_TIMEOUT'
      this.errMessage = 'Application communication between server timeout try again later!'
    } else if (statCode === status.CONFLICT) {
      this.errCode = 'DUPLICATE_RESOURCE'
    } else if (statCode === status.UNPROCESSABLE_ENTITY) {
      this.errCode = 'INVALID_REQUEST'
    } else if (statCode === status.PRECONDITION_FAILED) {
      this.errCode = 'REQUEST_COULD_NOT_BE_PROCESSED'
    } else if (statCode === status.FORBIDDEN) {
      this.errCode = 'ACCESS_DENIED'
    } else if (statCode === status.UNAUTHORIZED) {
      this.errCode = 'UNAUTHORIZED_TOKEN'
    } else if (statCode === status.NOT_FOUND) {
      this.errCode = 'UNKNOWN_RESOURCE'
    }

    return { err_code: this.errCode, error: this.errMessage }
  }

  catch(exception: HttpException, host: ArgumentsHost): OutgoingMessage {
    const args: HttpArgumentsHost = host.switchToHttp()
    const res: Response = args.getResponse<Response>()
    const error: Record<string, any> = exception

    if (error instanceof HttpException) {
      this.setLogError('ApplicationError', ELoggerType.ERROR, error)
      args.getNext()
    } else if (error instanceof Error) {
      this.setLogError('ApplicationError', ELoggerType.ERROR, error)
      args.getNext()
    } else {
      this.setLogError('ApplicationError', ELoggerType.ERROR, error)
      args.getNext()
    }

    if (this.statCode === status.BAD_REQUEST) {
      this.statCode = status.UNPROCESSABLE_ENTITY
    } else if (this.statCode === status.FAILED_DEPENDENCY) {
      this.statCode = status.INTERNAL_SERVER_ERROR
    }

    const customErrorMsgAndErrCode: { err_code: string; error?: string } = this.setDefaultErrMsgAndErrCode(this.statCode)
    if (customErrorMsgAndErrCode.err_code) {
      this.errCode = customErrorMsgAndErrCode.err_code
    } else if (customErrorMsgAndErrCode.err_code && customErrorMsgAndErrCode.error) {
      this.errCode = customErrorMsgAndErrCode.err_code
      this.errMessage = customErrorMsgAndErrCode.error
    }

    return res.status(this.statCode).json({ stat_code: this.statCode, err_code: this.errCode, error: this.errMessage })
  }
}

import { CallHandler, ExecutionContext, HttpStatus, Injectable, HttpStatus as status } from '@nestjs/common'
import { HttpArgumentsHost, NestInterceptor } from '@nestjs/common/interfaces'
import { Observable, map } from 'rxjs'
import { Request, Response } from 'express'
import { OutgoingMessage } from 'node:http'

@Injectable()
export class AppInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<OutgoingMessage> {
    const ctx: HttpArgumentsHost = context.switchToHttp()
    const req: Request = ctx.getRequest()
    const res: Response = ctx.getResponse()

    return next.handle().pipe(
      map((value) => {
        if (req.method === 'POST' && res.statusCode === HttpStatus.CREATED) {
          res.status(status.OK)
        }

        return value
      }),
    )
  }
}

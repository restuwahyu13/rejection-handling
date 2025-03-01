import { Injectable, HttpStatus as status } from '@nestjs/common'
import { response } from '~/infrastructure/common/helpers/response.helper'

@Injectable()
export class ApplicationService {
  ping() {
    return response({ stat_code: status.OK, message: 'Ping!' })
  }

  pingRejection() {
    Promise.reject('Rejection handler')
    return response({ stat_code: status.OK, message: 'Ping Rejection!' })
  }
}

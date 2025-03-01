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

  pingRejectionHandling() {
    try {
      const numbs: number[] = [1, 2, 3, 4, 5]
      let sum: number = 0

      numbs.forEach((n: number) => {
        try {
          Promise.reject('Rejection handler')
          sum += n
        } catch (e) {
          throw response(e)
        }
      })

      return response({ stat_code: status.OK, message: 'Ping Rejection Handling!' })
    } catch (e) {
      throw response(e)
    }
  }
}

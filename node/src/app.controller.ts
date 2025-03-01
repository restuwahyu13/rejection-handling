import { All, Controller } from '@nestjs/common'
import { ApplicationService } from '~/app.service'

@Controller('ping')
export class ApplicationController {
  constructor(private applicationService: ApplicationService) {}

  @All('/')
  ping() {
    return this.applicationService.ping()
  }

  @All('/rejection')
  pingRejection() {
    return this.applicationService.pingRejection()
  }
}

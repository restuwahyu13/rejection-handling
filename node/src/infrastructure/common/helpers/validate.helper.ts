import { HttpStatus as status } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { ValidationError, validateSync } from 'class-validator'

import { Validator } from '~/infrastructure/common/configs/env.config'
import { response } from '~/infrastructure/common/helpers/response.helper'

export class Validate {
  static env(config: Record<string, any>) {
    const validatedConfig: Validator = plainToInstance(Validator, config, {
      enableImplicitConversion: true,
      enableCircularCheck: true,
    })

    const validationErrors: ValidationError[] = validateSync(validatedConfig, {
      enableDebugMessages: true,
      strictGroups: true,
      skipMissingProperties: false,
      validationError: { target: false, value: true },
    })

    if (validationErrors.length > 0) {
      throw response({ stat_code: status.PRECONDITION_FAILED, errors: validationErrors })
    }

    return validatedConfig
  }
}

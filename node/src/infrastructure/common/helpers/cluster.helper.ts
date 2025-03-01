import os from 'node:os'
import cluster, { Cluster as NodeCluster, Worker } from 'node:cluster'
import { EventEmitter } from 'node:events'

import { ELoggerType } from '~/domain/enums/common.enum'
import { Logger } from '~/infrastructure/common/helpers/logger.helper'

export class Cluster {
  private cluster: NodeCluster = undefined
  private event: EventEmitter = undefined
  private cpus: number = 0

  constructor() {
    this.cluster = cluster
    this.event = new EventEmitter()
    this.cpus = os.cpus().length / 2
  }

  private log(type: ELoggerType, message: string, stack?: any): void {
    Logger.log(type === ELoggerType.INFO ? 'ClusterMode' : 'ApplicationError', type, message, stack)
  }

  private cleanup(worker: Worker): void {
    worker.removeAllListeners()
    worker.destroy()
    process.kill(worker.process.pid, worker.process.signalCode)
    process.exit(0)
  }

  thread(singleThread: boolean, handler: () => void): void {
    if (!singleThread && cluster.isPrimary) {
      for (let i = 1; i <= this.cpus; i++) {
        this.cluster.fork()
      }

      this.event.on('workers', (worker: Worker) => {
        if (worker) {
          if (worker.isDead()) {
            worker.send(worker)
          } else {
            worker.send(`Worker [THREAD] ${worker.id} online with [PID] ${worker.process.pid}`)
          }
        }
      })

      this.cluster.on('online', (worker: Worker) => {
        this.log(ELoggerType.INFO, `Worker [THREAD] ${worker.id} online with [PID] ${worker.process.pid}`)
        this.event.emit('workers', worker)
      })

      this.cluster.on('exit', (code: number, signal: string) => {
        this.log(ELoggerType.INFO, `Worker has teminated received code ${code} and [SIGNAL] ${signal}`)

        for (let i = 1; i <= this.cpus; i++) {
          this.cluster.fork()
        }
      })
    } else if (!singleThread && cluster.isWorker) {
      process.on('message', (chunk: any) => {
        if (chunk instanceof Worker) {
          process.nextTick(() => this.cleanup(chunk))
          this.log(ELoggerType.INFO, `Worker [THREAD] ${chunk.id} and process [PID] ${chunk.process.pid} has teminated`)
        } else {
          this.log(ELoggerType.INFO, chunk)
        }
      })
      handler()
    } else {
      handler()
    }
  }
}

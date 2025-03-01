# Rejection Handling

 Berikut adalah bagaimana cara menghandle error rejection yang tidak diketahui asalnya darimana baik itu dari **external library** atau dari **human error** yang dimana bisa menyebabkan aplikasi menjadi crash, dengan implementasi cara seperti ini diharapkan aplikasi yang dijalan tidak crash saat terjadi error yang tidak diketahui asalnya darimana.

 ## Cara Golang

 ```go
func unhandledRejection(w http.ResponseWriter) {
	if w != nil {
		if err := recover(); err != nil {
			log.Printf("unhandledRejection Panic: %s", err)
			w.Write([]byte("Application busy, pleas try again later!"))
		}
	}
}
 ```

 ## Cara NodeJS

 ```ts
  private event(): void {
    process
      .on('uncaughtException', (err: Error, _origin: NodeJS.UncaughtExceptionOrigin) => {
        if (err) this.log(ELoggerType.ERROR, `uncaughtException: ${err?.message}`, err)
      })
      .on('uncaughtExceptionMonitor', (err: Error, _origin: NodeJS.UncaughtExceptionOrigin) => {
        if (err) this.log(ELoggerType.ERROR, `uncaughtExceptionMonitor: ${err?.message}`, err)
      })
      .on('unhandledRejection', (reason: unknown, _promise: Promise<unknown>) => {
        if (reason) this.log(ELoggerType.ERROR, `unhandledRejection: ${reason}`, reason)
      })
      .on('rejectionHandled', (reason: unknown, _promise: Promise<unknown>) => {
        if (reason) this.log(ELoggerType.ERROR, `rejectionHandled: ${reason}`, reason)
      })
  }
 ```# rejection-handling
# rejection-handling

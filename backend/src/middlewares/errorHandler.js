import log from "../utils/logger.js"

const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500
    const message = err.isOperational ? err.message : 'Something went wrong';

    if(statusCode >= 500) {
        log.error({err}, 'unhandled error')
    } else {
        log.warn({
            err:err.message},
            'handled operation error'
            )
        }

    res.status(statusCode).json({
        error:message
    })

}

export default errorHandler;

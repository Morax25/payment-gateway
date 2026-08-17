import {z} from 'zod'
export const validate = (schema) => {
    return (req,res,next) => {
        const result = schema.safeParse(req.body)
        if(!result.success) {
            return res.status(400).json({
                error:result.error.flatten()
            })
        }
        req.body = result.data;
        next()
    }

}

export const validateParams = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      return res.status(400).json({
        error: result.error.flatten(),
      });
    }

    req.params = result.data;

    next();
  };
};


export const validateQuery = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      return res.status(400).json({
        error: result.error.flatten(),
      });
    }

    res.locals.query = result.data;

    next();
  };
};

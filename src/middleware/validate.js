import Joi from "joi";

export const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: error.details.map((d) => d.message),
    });
  }
  next();
};

export const schema = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    name: Joi.string().min(2).required(),
  }),
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
  chat: Joi.object({
    name: Joi.string().min(3).max(20).required(),
  }),
  message: Joi.object({
    text: Joi.string().min(1).required(),
  }),
  invite: Joi.object({
    email: Joi.string().email().required(),
  }),
};

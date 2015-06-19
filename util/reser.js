var ERR_TYPE = {
  MISSING: 'missing',
  INVALID: 'invalid',
  MISSING_FIELD: 'missing_field',
  ALREADY_EXISTS: 'already_exist'
};

var reser = {
  ERR_TYPE: ERR_TYPE,

  err: function(res, field, code) {
    return {
      resource: res,
      field: field,
      code: code
    };
  },

  res: function(msg, errs) {
    if (!errs) {
      return {
        msg: msg
      };
    }

    return {
      msg: msg,
      errs: errs.length ? errs : [errs]
    };
  }
};

module.exports = reser;


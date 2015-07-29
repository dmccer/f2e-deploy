/**
 * 错误类型
 * @readonly
 * @enum {string}
 */
var ERR_TYPE = {
  MISSING: 'missing',
  INVALID: 'invalid',
  MISSING_FIELD: 'missing_field',
  ALREADY_EXISTS: 'already_exist'
};

/**
 * 错误项
 * @param {string} res - 资源描述
 * @param {string} field - 错误字段
 * @param {string} code - 错误类型
 * @constructor
 */
function ErrItem(res, field, code) {
  this.resource = res;
  this.field = field;
  this.code = code;
}

/**
 * 错误响应结果
 * @param {string} msg 错误信息提示
 * @param {Array<ErrItem>} errs 所有错误项
 * @constructor
 */
function ErrResult(msg, errs) {
  this.msg = msg;
  this.errs = errs;
}

/**
 * 错误响应器
 */
var reser = {
  /**
   * 错误类型
   * @type {ERR_TYPE}
   */
  ERR_TYPE: ERR_TYPE,

  /**
   * 构建错误对象
   * @static
   * @param {string} res - 资源描述
   * @param {string} field - 错误字段
   * @param {string} code - 错误类型
   * @returns {ErrItem}
   */
  err: function(res, field, code) {
    return new ErrItem(res, field, code);
  },

  /**
   * 构建错误响应结果
   * @static
   * @param {string} msg - 错误信息提示
   * @param {Array<ErrItem>} errs - 所有错误项
   * @returns {ErrResult}
   */
  res: function(msg, errs) {
    if (!errs || errs.length) {
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


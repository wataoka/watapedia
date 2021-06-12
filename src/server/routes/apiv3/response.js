const toArrayIfNot = require('../../../lib/util/toArrayIfNot');

const ErrorV3 = require('../../models/vo/error-apiv3');

const addCustomFunctionToResponse = (express, crowi) => {

  express.response.apiv3 = function(obj = {}, status = 200) { // not arrow function
    // obj must be object
    if (typeof obj !== 'object' || obj instanceof Array) {
      throw new Error('invalid value supplied to res.apiv3');
    }

    this.status(status).json({ data: obj });
  };

  express.response.apiv3Err = function(_err, status = 400, info) { // not arrow function
    if (!Number.isInteger(status)) {
      throw new Error('invalid status supplied to res.apiv3Err');
    }

    let errors = toArrayIfNot(_err);
    errors = errors.map((e) => {
      if (e instanceof ErrorV3) {
        return e;
      }
      if (e instanceof Error) {
        return new ErrorV3(e.message, null, e.stack);
      }
      if (typeof e === 'string') {
        return { message: e };
      }

      throw new Error('invalid error supplied to res.apiv3Err');
    });

    this.status(status).json({ errors, info });
  };
};

module.exports = addCustomFunctionToResponse;

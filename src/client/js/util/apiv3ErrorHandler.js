// API v3 sends an array of errors in res.data.errors.
// API v3 errors need to extracted from an error object in order to properly handle them.

import toArrayIfNot from '../../../lib/util/toArrayIfNot';

const logger = require('@alias/logger')('growi:apiv3');

const apiv3ErrorHandler = (_err, header = 'Error') => {
  // extract api errors from general 400 err
  const err = _err.response ? _err.response.data.errors : _err;
  const errs = toArrayIfNot(err);

  for (const err of errs) {
    logger.error(err.message);
  }

  return errs;
};

export default apiv3ErrorHandler;

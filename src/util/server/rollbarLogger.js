import Rollbar from 'rollbar';
import omit from 'lodash/omit';
import isFunction from 'lodash/isFunction';
import { bunyanLevelToRollbarLevelName } from '../common/rollbar';

/**
 * @description Custom bunyan stream that transports to Rollbar from a node process.
 * See https://rollbar.com/docs/notifier/node_rollbar/ for integration details
 *
 * @param  {Object} token, codeVersion, and environment
 * @returns {Object} new Rollbar instance
 */
export default function ServerRollbarLogger({ token, codeVersion, environment }) {
  // https://rollbar.com/docs/notifier/rollbar.js/#quick-start-server
  const rollbar = new Rollbar({
    accessToken: token,
    captureUncaught: true,
    captureUnhandledRejections: true,
    code_version: codeVersion,
    environment,
  });

  return rollbar;
}

/**
 * Transport to Rollbar
 * @description handles `err` and `req` properties, attaches any custom data,
 * and calls the appropriate Rollbar method.
 *
 * @param  {Object} data
 * @returns {undefined}
 */
ServerRollbarLogger.prototype.write = function (data = {}) {
  const rollbarLevelName = bunyanLevelToRollbarLevelName(data.level);
  const scopeData = omit(data, ['req', 'level']);
  const payload = Object.assign({ level: rollbarLevelName }, scopeData);

  // https://rollbar.com/docs/notifier/rollbar.js/#rollbarlog-1
  const logFn = Rollbar[rollbarLevelName];

  if (isFunction(logFn)) {
    logFn(data.msg, data.err, data.req, payload);
  } else {
    Rollbar.error(data.msg, data.err, data.req, payload);
  }
};

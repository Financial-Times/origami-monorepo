'use strict';

var Logger = require('./logger');

/**
 * @class Errors
 */
function Errors() {
	this.ravenClient = null;

	/**
	 * The initialised state of the object.
	 * @type {bool}
	 */
	this.initialised = false;

	this.logger = null;
	this._logEventHandler = this.handleLogEvent.bind(this);

	// While not initialised, any caught errors are buffered.
	this._errorBuffer = [];

	// Cache the declarative config String to avoid reading the DOM more than
	// once, once initialised, the reference to the string is released for GC.
	this._declarativeConfigString = false;
}

/**
 * Initialises the Error object with a Raven dependency.
 *
 * All options are optional, if a configuration option is missing, the module
 * will try to initialise using any configuration found in the DOM using the
 * script config tag.
 *
 * @example
 * <!-- DOM configuration settings -->
 * <script type="application/json" data-o-errors-config>
 * {
 *   "sentryEndpoint": "https://dsn@app.getsentry.com/123"
 * }
 * </script>
 *
 * @param options {Object}
 * @param options.sentryEndpoint {String}  - Optional if configued via the DOM, Required if not, must be a valid {@link https://app.getsentry.com/docs/platforms/|Sentry DSN}.
 * @param options.siteVersion    {String}  - Optional, optionally the version of the code the page is running. This tags each error with the code version
 * @param options.logLevel       {String}  - Optional, see {@link Logger.level} for valid names
 * @param options.disabled       {Boolean} - Optional, If `true`, disable o-errors reporting.
 * @param raven   {Object}   - The Raven JS client object.
 * @returns {Errors}
 */
Errors.prototype.init = function(options, raven) {
	if (this.initialised) {
		return this;
	}

	var hasDeclarativeConfig = this._hasDeclarativeConfig();
	var configMissing = !(hasDeclarativeConfig || options);

	// In main.js an event listener is bound to 'o.DOMContentLoaded', this
	// calls 'init' without arguments with the intention of configuring from
	// the declarative config if it exists.  If the declarative markup doesn't
	// exist, we do nothing so that the consumer has the option of
	// configuring imperatively by calling `init` with options themselves.
	if (configMissing) {
		return this;
	}

	options = options || {};

	if (hasDeclarativeConfig) {
		options = this._initialiseDeclaratively(options);
	}

	// If errors is configured to be disabled, (options.disabled = true),
	// then stub this.report, turn off logging (which turns them into noops),
	// and return 'initialised' before installing raven.
	var isErrorsDisabled = options.disabled;

	var logLevel = isErrorsDisabled ? Logger.off : options.logLevel;
	var defaultLogLength = 10;
	this.logger = new Logger(defaultLogLength, logLevel);

	if (isErrorsDisabled) {
		this.report = function() {};
		this.wrapWithContext = function() {};
		this.initialised = true;
		return this;
	}

	if (!options.sentryEndpoint) {
		throw new Error('Could not initialise o-errors: Sentry endpoint and auth configuration missing.');
	}


	this._configureAndInstallRaven(options, raven);

	document.addEventListener('oErrors.log', this._logEventHandler);

	this.initialised = true;

	this._flushBufferedErrors();
	return this;
};

Errors.prototype._configureAndInstallRaven = function(options, raven) {

	// To control the initialisation of the third party code (Raven)
	// we include it only at init time see "http://origami.ft.com/docs/syntax/js/#initialisation"
	//
	// It is optional so that it can be mocked in tests
	if (!(raven || this.ravenClient)) {
		raven = require('raven-js');
	}

	this.ravenClient = raven;

	var sentryEndpoint = options.sentryEndpoint;
	var shouldSendError = this._shouldSendError.bind(this);
	var updatePayloadBeforeSend = this._updatePayloadBeforeSend.bind(this);

	var ravenOptions = {
		shouldSendCallback: shouldSendError,
		dataCallback: updatePayloadBeforeSend
	};

	if (options.siteVersion) {
		ravenOptions.release = options.siteVersion;
	}


	this.ravenClient.config(sentryEndpoint, ravenOptions);
	this.ravenClient.install();
};

/**
 * Flush any errors that are buffered in `this._errorBuffer`.
 * @private
 */
Errors.prototype._flushBufferedErrors = function() {
	if (!this.initialised) {
		return;
	}

	var errors = this;
	this._errorBuffer.forEach(function(bufferedError) {
		errors.report(bufferedError.error, bufferedError.context);
	});

	// Clear the buffer, deleting references we hold to any buffered errors
	this._errorBuffer = [];
};

/**
 * Report an Error object to the error aggregator.
 *
 * @param {Error}  error    - The error object to report.
 * @param {Object} context  - Optional context to attach to the Error in the
 *                            aggregator
 * @return {Error} - The passed in error
 */
Errors.prototype.report = function(error, context) {
	if (!this.initialised) {
		this._errorBuffer.push({ error: error, context: context });
		return error;
	}

	context = context || {};

	// Raven, for some reason completely ignores the contents of
	// error.message... to get around this, we attach the error message to the
	// context object.
	if (error.message) {
		context.errormessage = error.message;
	}

	this.ravenClient.captureException(error, context);
	return error;
};

/**
 * Report an error to the error aggregator.
 *
 * @example
 * // Reports a caught Error generated by the Promise
 * fetch('example.com').then(doSomething).catch(oErrors.error);
 *
 * @example
 * // Reports and re-throws the caught error
 * try {
 *   doSomething();
 * } catch(e) {
 *   throw oErrors.error(e);
 * }
 *
 * @param {Error}  error     - The error to report
 * @param {Object} context   - Additional contextual information for the error.
 * @returns {Error} - The original 'error' argument
 */
Errors.prototype.error = function() {
	this.logger.error.apply(this.logger, arguments);
};

/**
 * Log a 'WARN' level log.  Intended to have the same semantics as
 * console.warn.
 * This stores the log in memory and will attach the last `n` log lines to the
 * context of the error. See {@link Errors#log} to log a log message.
 *
 * @param {String} warnMessage  - The message to log.
 * @returns undefined
 */
Errors.prototype.warn = function() {
	this.logger.warn.apply(this.logger, arguments);
};

/**
 * Log a 'LOG' level log.  Intended to have the same semantics as console.log.
 * This stores the log in memory and will attach the last `n` log lines to the
 * context of the error.  See {@link Errors#warn} to log a warn message.
 *
 * @param {String} logMessage - The message to log.
 * @return undefined
 */
Errors.prototype.log = function() {
	this.logger.log.apply(this.logger, arguments);
};


/**
 * Wrap a function so that any uncaught errors are caught and reported to the
 * error aggregator.
 *
 * @example
 * // Wraps function, any errors occurring within the function are caught, logged, and rethrown.
 * var wrappedFunction = oErrors.wrap(function() {
 *   throw new Error("My Error");
 * });
 *
 * If you want to attach additional contextual information to the error, see
 * {@link Errors#wrapWithContext}.
 -
 * @param {Function} fn     - The function to wrap.
 * @return {Function}
 */
Errors.prototype.wrap = function(fn) {
	return this.wrapWithContext({}, fn);
};

/**
 * Wrap a function so that any uncaught errors are caught and reported to the error
 * aggregator.
 * This method allows additional context to be attached to the error if it
 * occurs.
 *
 * @example
 * // Wrap a function with some additional context to be reported in the event
 * // `doSomethingCallback` throws an error.
 * setTimeout(oErrors.wrapWithContext({ "context:url": "example.com" }, doSomethingCallback), 1000);
 *
 * @param {Object}   context     - Additional context to report along with the error
 *                                 if the function `fn` throws an Error.
 * @param {Function} fn          - The function to wrap
 * @return {Function}
 */
Errors.prototype.wrapWithContext = function(context, fn) {
	var errors = this;
	return function() {
		try {
			return fn.apply(undefined, arguments);
		} catch(e) {
			errors.report(e, context);
			throw e;
		}
	};
};

/**
 * Remove the `oErrors.log` event listener and clean up as much of the Raven
 * client as possible.
 *
 * Errors is unusable after a call to destroy and calling `init` subsequently
 * will fail.
 *
 * @returns undefined
 */
Errors.prototype.destroy = function() {
	if (!this.initialised) { return; }
	document.removeEventListener('oErrors.log', this._logEventHandler);
	this.ravenClient.uninstall();
};

Errors.prototype.handleLogEvent = function(ev) {
	// Tag the context with additional information about the DOM.
	var context = {
		info: ev.detail.info || {},
		extra: {
			"context:dom": this._getEventPath(ev).reduceRight(function(builder, el) {
				var classList = Array.prototype.slice.call(el.classList || []);
				var nodeName = el.nodeName.toLowerCase();

				if (nodeName.indexOf('#') === 0) {
					return builder + "<" + nodeName + ">\n";
				}

				return builder + "<" + el.nodeName.toLowerCase() + " class='" + classList.join(' ') + "' id='" + (el.id || '') + "'>\n";
			}, "")
		}
	};
	this.report(ev.detail.error, context);
};

/**
 * Given a DOM event, return an ordered array of Elements that the event will propagate
 * through.
 *
 * @private
 * @param {Event} event - The event to get the path for.
 * @returns {Array} - An array of Elements.
 */
Errors.prototype._getEventPath = function(event) {

	// event.path is available in some browsers, most notable Chrome
	if (event.path) {
		// Array.prototype.slice.call coerces a NodeList to an array. Could
		// use Array.from but it is not in the Polyfill service default set.
		return Array.prototype.slice.call(event.path);
	}

	var path = [];

	// IE backwards compatibility (get the actual target). If not IE, uses
	// `event.target`
	var element = window.event ? window.event.srcElement : event.target;

	while (element) {
		path.push(element);
		element = element.parentElement;
	}

	return path;
};

/**
 * A hook to decide whether to send the data.
 *
 * @private
 * @param {Object} data - The data object from Raven
 * @returns {bool}
 */
Errors.prototype._shouldSendError = function(data) {
	return true;
};

/**
 * A hook to add additional data to the payload before sending.
 *
 * @private
 * @param {Object} data - The data object from Raven
 * @returns {Object}
 */
Errors.prototype._updatePayloadBeforeSend = function(data) {
	if (this.logger.enabled) {
		data.extra["context:log"] = this.logger.logLines();
	}
	return data;
};

/**
 * Get whether declarative configuration exists in the DOM.
 *
 * @private
 * @returns {bool}
 */
Errors.prototype._hasDeclarativeConfig = function() {
	return !!this._getDeclarativeConfig();
};

/**
 * Get the configuration as a String.
 *
 * @private
 * @returns {String}
 */
Errors.prototype._getDeclarativeConfig = function() {
	if (!this._declarativeConfigString) {
		var config = document.querySelector('script[data-o-errors-config]');
		if (config) {
			this._declarativeConfigString = config.textContent || config.innerText || config.innerHTML;
		} else {
			return false;
		}
	}

	return this._declarativeConfigString;
};

/**
 * Initialises additional data using the <script type="application/json" data-o-errors-config> element in the DOM.
 *
 * @private
 * @param {Object} options - A partially, or fully filled options object.  If
 *                           an option is missing, this method will attempt to
 *                           initialise it from the DOM.
 * @returns {Object} - The options modified to include the options gathered
 *                     from the DOM
 */
Errors.prototype._initialiseDeclaratively = function(options) {

	if (!this._hasDeclarativeConfig()) {
		return false;
	}

	var declarativeOptions;

	try {
		declarativeOptions = JSON.parse(this._getDeclarativeConfig());
	} catch(e) {
		throw new Error("Invalid JSON configuration syntax, check validity for o-errors configuration: '" + e.message + "'");
	}

	for (var property in declarativeOptions) {
		if (declarativeOptions.hasOwnProperty(property)) {
			options[property] = options[property] || declarativeOptions[property];
		}
	}

	// Release the reference to the config string
	this._declarativeConfigString = false;
	return options;
};

module.exports = Errors;

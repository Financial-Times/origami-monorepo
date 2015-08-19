/*global module, require */

let store;
const defaultSessionConfig = {
	storage: 'best',
	name: 'session',
	expires: (30 * 60 * 1000) // 30 minutes
};

const utils = require('../utils');
const Store = require('./store');

/**
 * Set the session in the store.
 *
 * @param {String} The session to be stored.
 */
function setSession(session) {
	const d = new Date();
	d.setTime(d.getTime() + store.config.expires);

	store.write({
		value: session,
		expiry: d.valueOf()
	});
}

/**
 * Get the session from the store. Expiry and gen of a new session are handled here.
 *
 * @return {String} the current session
 */
function getSession() {
	const s = store.read();
	let session;

	if (s) {
		const d = (new Date()).valueOf();
		const exp = parseInt(s.expiry);

		// If current session is active.
		if (exp >= d) {
			session = s.value;
		}
	}

	// No active session, gen a new one.
	if (!session) {
		session = utils.guid();
	}

	// Refreshes the cookie...
	setSession(session);

	return session;
}

/**
 * Init
 *
 * @param config {String|Object} The name used to store the session or configuration object.
 */
function init(config) {
	if (utils.is(config, 'string')) {
		config = { name: config };
	}

	if (utils.isUndefined(config)) {
		config = {};
	}

	const c = utils.merge(defaultSessionConfig, config);

	// config.name is important here, means the user has specifically asked for a cookie name.
	if (c.storage === 'cookie' && config.name) {
		c.nameOverride = c.name;
	}

	store = new Store(c.name, c);

	return getSession();
}

module.exports = {
	init: init,
	session: getSession
};

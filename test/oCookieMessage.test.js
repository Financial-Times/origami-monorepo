/* eslint-env mocha, proclaim, sinon */

//import sinon from 'sinon/pkg/sinon';
//import proclaim from 'proclaim';

//import CookieMessage from './../src/js/cookieMessage';

describe("CookieMessage", () => {
	it("injects the FT legal cookie message into itself");
	it("does not inject the FT legal cookie message if data-o-cookie-message-use-custom-html is present");

	describe("dateIsWithinLastThreeMonths", () => {
		it("returns true if the date passed in is within the last 3 months");
		it("returns false if the date passed in is longer than the last three months");
	});

	describe("userHasConsentedToCookies", () => {
		it("calls flagUserAsConsentingToCookies if they have consented using the old o-cookies way");
		it("checks the value of COOKIE_CONSENT is within the last three months");
		it("returns false if there is nothing in COOKIE_CONSENT");
		it("returns true if dateIsWithinLastThreeMonths(COOKIE_CONSENT) returns true");
		it("returns false if dateIsWithinLastThreeMonths(COOKIE_CONSENT) returns false");
	});

	describe("flagUserAsConsentingToCookies", () => {
		it("sets a value in localStorage called COOKIE_CONSENT to the result of Date.now");
		it("calls hideMessage");
	});

	describe("hideMessage", () => {
		it("removes the o-cookie-message--active class from the CookieMessageEl");
	});
});

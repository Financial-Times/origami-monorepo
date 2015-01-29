'use strict';

var toggleSelector = 'button.o-expander__toggle';
var viewport = require('o-viewport');

var Expander = function (el, opts) {
    viewport.listenTo('resize');
    viewport.listenTo('orientation');
    opts = opts || {};
    opts.shrinkTo = el.dataset.oExpanderShrinkTo || opts.shrinkTo || 'height'; //height or number
    opts.countSelector = el.dataset.oExpanderCountSelector || opts.countSelector;
    opts.contentSelector = el.dataset.oExpanderContentSelector || opts.contentSelector || '.o-expander__content';
    opts.expandedToggleText = el.dataset.oExpanderExpandedToggleText || opts.expandedToggleText || 'less';
    opts.collapsedToggleText = el.dataset.oExpanderCollapsedToggleText || opts.collapsedToggleText || 'more';


    if (/^\d+$/.test(opts.shrinkTo)) {
        opts.shrinkTo = +opts.shrinkTo;
    }
    if (typeof opts.shrinkTo === 'number' && !opts.countSelector) {
        throw('when collapsing to a number of items specify a selector to identify how many items exist');
    }
    this.el = el;
    this.contentEl = this.el.querySelector(opts.contentSelector);
    this.opts = opts;
    this.toggle = this.el.querySelector(toggleSelector);
    if (!this.toggle) {
        throw('this expander needs a toggle button (use a button not a link');
    }

    if (this.opts.shrinkTo === 'height') {
        this.init = this.init.bind(this);
        document.body.addEventListener('oViewport.orientation', this.init);
        document.body.addEventListener('oViewport.resize', this.init);
    }

    this.init(true);
}

Expander.prototype.init = function (isSilent) {
    if (!this.isRequired()) {
        this.el.classList.add('o-expander--inactive');
    } else {
        this.el.classList.remove('o-expander--inactive');
        if (typeof this.opts.shrinkTo === 'number') {
            this.el.querySelectorAll(this.opts.countSelector)[this.opts.shrinkTo - 1].classList.add('o-expander__last-permanent-item');
        }
        if (this.el.getAttribute('aria-expanded')) {
            this.displayState(isSilent);
        } else {
            this.collapse(isSilent);
        }

        this.toggle.addEventListener('click', this.invertState.bind(this));
    }
}

Expander.prototype.isCollapsed = function () {
    var attr = this.el.getAttribute('aria-expanded');
    return !attr || attr === 'false';
}

Expander.prototype.invertState = function () {
    this.isCollapsed() ? this.expand() : this.collapse();
}

Expander.prototype.displayState = function (isSilent) {
    this.isCollapsed() ? this.collapse(isSilent) : this.expand(isSilent);
}

Expander.prototype.expand = function (isSilent) {
    this.el.setAttribute('aria-expanded', true);
    this.toggle.innerHTML = this.opts.expandedToggleText + '<i></i>';
    if (!isSilent) {
        this.emit('expand');
    }
}

Expander.prototype.collapse = function (isSilent) {
    this.el.setAttribute('aria-expanded', false);
    this.toggle.innerHTML = this.opts.collapsedToggleText + '<i></i>';
    if (!isSilent) {
        this.emit('collapse');
    }
}

Expander.prototype.emit = function (name) {
    this.el.dispatchEvent(new CustomEvent('oExpander.' + name, {bubbles: true}));
}

Expander.prototype.isRequired = function () {
    var overflows = false;
    if (typeof this.opts.shrinkTo === 'number') {
        if (this.el.querySelectorAll(this.opts.countSelector).length > this.opts.shrinkTo) {
            overflows = true;
        }
    } else {
        if (this.isCollapsed()) {
            overflows = this.contentEl.clientHeight < this.contentEl.scrollHeight;
        } else {
            this.collapse();
            overflows = this.contentEl.clientHeight < this.contentEl.scrollHeight;
            this.expand();
        }
    }
    return overflows;
}

var init = function(el, opts) {
    if (!el) {
        el = document.body;
    }
    if (!(el instanceof HTMLElement)) {
        el = document.querySelector(el);
    }
    if (/\bo-expander\b/.test(el.getAttribute('data-o-component'))) {
        return new Expander(el, opts);
    }
    return [].map.call(el.querySelectorAll('[data-o-component~="o-expander"]'), function (el) {
        return new Expander(el, opts);
    });
};

var constructAll = function() {
    init();
    document.removeEventListener('o.DOMContentLoaded', constructAll);
};

if (typeof window !== 'undefined') {
    document.addEventListener('o.DOMContentLoaded', constructAll);
}


module.exports = {
    init: init
};
'use strict';

var months = 'January,February,March,April,May,June,July,August,September,October,November,December'.split(',');
var days = 'Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday'.split(',');
var timer;
var updaters = [];


var formats = {
    long: 'MMMM d, yyyy h:mm a',
    short: 'd/M/yy'
};

/*
    See http://docs.oracle.com/javase/7/docs/api/java/text/SimpleDateFormat.html for formatting conventions used
*/
var formatReplacementsMap = {
    MMMM: function () {
        return months[this.getMonth()];
    },
    MMM: function () {
        return months[this.getMonth()].substr(0,3);
    },
    MM: function () {
        return pad2(this.getMonth() + 1, 2);
    },
    M: function () {
        return this.getMonth() + 1;
    },
    yyyy: Date.prototype.getFullYear,
    yy: function () {
        return this.getFullYear().substr(0, 2);
    },
    EEEE: function () {
        return days[this.getDay()];
    },
    EEE: function () {
        return days[this.getDay()].substr(0,3);
    },
    d: Date.prototype.getDate,
    dd: function () {
        return pad2(this.getDate() + 1, 2);
    },
    m: Date.prototype.getMinutes,
    mm: function () {
        return pad2(this.getMinutes(), 2);
    },
    h: function () {
        return (this.getHours() % 12) - 1;
    },
    hh: function () {
        return pad2((this.getHours() % 12) - 1, 2);
    },
    a: function () {
        return this.getHours() >= 12 ? 'pm' : 'am';
    }
};

function pad2 (number) {
    return ('0' + number).slice(-2);
}

function compileTemplate (tpl) {

}

function toDate (date) {
    return date instanceof Date ? date : new Date(date);
}

function format (date, tpl) {
    tpl = formats[tpl] || tpl;
    date = toDate(date);
    return tpl.replace(/[a-z]+/ig, function (match) {
        var replacer = formatReplacementsMap[match];
        return replacer ? replacer.apply(date) : match;
    });
}

function timeAgo (date, fallback) {
    date = toDate(date);
    var interval = Math.round(((new Date()) - date) / 1000);
    if (interval < 45) {
        return interval + ' seconds ago';
    } else if (interval < 90) {
        return 'a minute ago';
    } else if (interval < 45 * 60) {
        return Math.round(interval / 60) + ' minutes ago';
    }  else if (interval < 90 * 60) {
        return 'an hour ago';
    } else if (interval < 22 * 60 * 60) {
        return  Math.round(interval / (60 * 60)) + ' hours ago';
    } else if (interval < 36 * 60 * 60) {
        return 'a day ago';
    } else if (interval < 25 * 60 * 60 * 24) {
        return Math.round(interval / (60 * 60 * 24)) + ' days ago';
    } else if (interval < 45 * 60 * 60 * 24) {
        return 'a month ago';
    } else if (interval < 345 * 60 * 60 * 24) {
        return Math.round(interval / (60 * 60 * 24 * 30)) + ' months ago';
    } else if (interval < 547 * 60 * 60 * 24) {
        return 'a year ago';
    } else {
        return Math.round(interval / (60 * 60 * 24 * 365)) + ' years ago';
    // } else {
    //     return fallback ? format(date, fallback) : '';
    }
}




function initTimeAgo (container, date) {
    container = container || document.body;
    if (container.classList.contains('o-date--updater')) {
        date = date || container.getAttribute('datetime');
        showTimeAgo(container, date);
    } else {
        Array.prototype.forEach.call(container.querySelectorAll('.o-date--updater'), function (el) {
            showTimeAgo(el, el.getAttribute('datetime'));
        });
    }

    autoUpdate();
}

function autoUpdate () {

    if (!timer) {
        timer = setTimeout (function exec () {
            document.querySelectorAll('.o-date-updater', function (el) {
                showTimeAgo(el, el.getAttribute('datetime'));
            });
            setTimeout(exec, 60000);
        }, 600000);
    }
}

function unautoUpdate () {
    clearTimeout(timer);
}

function showTimeAgo(el, date) {
    var fallback = el.dataset.oDateUpdateFallback || 'long';
    var printer = el.querySelector('o-date__output') || el;
    printer.innerHTML = timeAgo(toDate(date), fallback);
}

module.exports = {
    format: format,
    autoUpdate: autoUpdate,
    unautoUpdate: unautoUpdate,
    initTimeAgo: initTimeAgo,
    timeAgo: timeAgo
};

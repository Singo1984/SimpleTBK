
Function.prototype.bind = function () {
    if (arguments.length < 2 && (typeof arguments[0]==='undefined')) {
        return this;
    }
    var _slice = Array.prototype.slice;
    var __method = this, args = _slice.call(arguments,0), context = args.shift();
    return function() {
        return __method.apply(context, args.concat(_slice.call(arguments,0)));
    }
}

Function.prototype.delay = function() {
    if (arguments.length < 2 && (typeof arguments[0]==='undefined')) {
        return this;
    }
    console.log('delay: ' + arguments[0]);
    var __method = this;
    var delayFun = function() {
        setTimeout(__method, arguments[0]);
    };
    return delayFun;
}

function enterQueryPage(status) {
    console.log(new Date().getTime() + ': enter enterQueryPage');
    if (status != 'success') {
        console.log('get url: ' + this.url + ' failed');
        this.returnResult({error: -3});
        return ;
    }
    var checkLogin = this.checkLoginPage();
    if (checkLogin == 1) {
        this.injectJQuery();
        var loginUrl = this.page.evaluate(function () {
            return $('#content').find('iframe').attr('src');
        });
        console.log('get login url: ', loginUrl);
        this.doLogin(loginUrl);
    } else if(checkLogin == 0){
        console.log('enter query page');
        this.canQuery = true;
        if (this.queryCTX.itemId) {
            setTimeout(this.doQuery.bind(this), 100);
        }
    } else {
        console.log('enter unkonw page, update your app');
        this.returnResult({error: -2});
    }
    return ;
}

function onQueryPage() {
    console.log('enter query page');
    this.canQuery = true;
    if (this.queryCTX.itemId) {
        setTimeout(this.doQuery.bind(this), 2000);
    }
}

function generalTimeout() {
    console.log('timeout when get query page');
    console.log(this.page.url);
    console.log(this.page.content);
    //console.log('ul style: ' + this.getAttr("ul.dropdown-list", 'style'));
    //console.log('search type: ' + this.getAttr("input[name='searchType']", 'value'));
    //console.log('query: ' + this.getAttr("#q", 'value'));
    this.returnResult({error: -1});
}

function onCodeAreaError(msg, trace) {
    var content = this.page.content;
    var matches = content.split("textarea");
    if (matches.length == 4) {
        this.queryCTX.result['data']['click_url'] = matches[2].split('>')[1].split('<')[0];
        console.log('click_url: ' + this.queryCTX.result['data']['click_url']);
        this.returnResult(this.queryCTX.result);
    } else {
        this.returnResult({error: -4});
    }
    this.page.onError = null;
};

function onCodeArea(status) {
    if (status != 'success') {
        this.page.onError = onCodeAreaError.bind(this);
    } else {
        this.queryCTX.result['data']['click_url'] = this.getHtml('#J_codeArea');
        this.returnResult(this.queryCTX.result);
    }
}

function onResultPage() {
    console.log('on query page');
    console.log('query: ' + this.getAttr("#q", 'value'));
    var commission_rate = this.page.evaluate(function () {
        var tr = $('#J_listMainTable').find('tbody').find('tr:first');
        if (tr.length > 0) {
            var td = tr.find('td');
            var ret = '';
            td.each(function (index) {
                if (index == 4) {
                    ret = $(this).html();
                }
            });
            return ret;
        } else {
            return '';
        }
    });
    console.log('commission_rate: ' + commission_rate);
    this.queryCTX.result = {
        error: 0,
        data: {
            commission_rate: (commission_rate.split('%')[0]) * 100
        }
    }
    var query_url = "http://u.alimama.com/union/spread/common/allCode.htm?specialType=item&auction_id=" + this.queryCTX.itemId;
    this.page.open(query_url, onCodeArea.bind(this));
}

exports.aliLogin = function(url, user, password) {
    this.url = url;
    this.user = user;
    this.password = password;
    this.page = require('webpage').create();
    this.canQuery = false;
    this.page.viewportSize = { width: 1360, height: 768 };
    this.page.settings.userAgent = 'Mozilla/5.0 (Unknown; Linux x86_64) AppleWebKit/534.34 (KHTML, like Gecko) Safari/534.34';
};

exports.aliLogin.prototype = {
    returnResult: function(result) {
        if (result.error != 0) {
            this.canQuery = false;
        }
        if(this.queryCTX && this.queryCTX.callback) {
            this.queryCTX.callback(this.queryCTX.param, result);
        }
        this.queryCTX = {};
        this.page.content = '';
    },
    isIdle: function() {
        return this.queryCTX != {};
    },
    injectJQuery: function() {
        var unInjected = this.page.evaluate(function () {
            return (typeof window.jqueryInjected) === 'undefined';
        });
        if (unInjected) {
            this.page.injectJs('./jquery.min.js');
        }
        this.page.evaluate(function () {
            window.jqueryInjected = true;
        });
    },
    waitFor: function(selector, scope, onReady, onTimeout, timeout) {
        var testfn = function(selector, scope) {
            return this.domExists(selector, scope);
        }.bind(this);
        var start = new Date().getTime();
        var condition = false;
        var interval = setInterval(function() {
            if((new Date().getTime() - start < timeout) && !condition) {
                condition = testfn(selector, scope);
            } else {
                clearInterval(interval);
                if(!condition) {
                    onTimeout();
                } else {
                    onReady();
                }
            }
        }, 250);
    },
    domExists: function(selector, scope) {
        this.injectJQuery();
        return this.page.evaluate(function (selector, scope) {
            if (scope) {
                if ($(scope).length > 0) {
                    return $(scope).find(selector).length > 0;
                } else {
                    return false;
                }
            } else {
                return $(selector) && $(selector).length > 0;
            }
        }, selector, scope);
    },
    getPosition: function(selector) {
        this.injectJQuery();
        var pos = this.page.evaluate(function (selector) {
            var el = $(selector);
            var x = 0, y = 0;
            x = (el.offset().left + el.width() / 2);
            y = (el.offset().top + el.height() / 2);
            return [x, y];
        }, selector);
        return pos;
    },
    getBounds: function(selector) {
        var pos = this.page.evaluate(function (selector) {
            var el = document.querySelector(selector);
            var bounds = el.getBoundingClientRect();
            return bounds;
        }, selector);
        return pos;
    },
    fillContent: function(selector, scope, content, pos2) {
        if (this.domExists(selector, scope)) {
            var pos = pos2 ? pos2: this.getPosition(selector);
            if (pos != null) {
                console.log(selector+ ' pos: [' + pos[0] + ',' + pos[1] + ']');
                this.page.sendEvent.apply(this.page, ['click'].concat(pos));
                this.page.sendEvent.apply(this.page, ['keypress', content]);
            } else {
                console.log(selector+ ' position not found to fill');
            }
        } else {
            console.log(selector+ ' not found to fill');
        }
    },
    click: function(selector, scope, pos2) {
        if (this.domExists(selector, scope)) {
            var pos = pos2 ? pos2: this.getPosition(selector);
            if (pos != null) {
                console.log(selector+ ' pos: [' + pos[0] + ',' + pos[1] + ']');
                this.page.sendEvent.apply(this.page, ['click'].concat(pos));
            } else {
                console.log(selector+ ' position not found to click');
            }
        } else {
            console.log(selector+ ' not found for click');
        }
    },
    getAttr: function(selector, str) {
        this.injectJQuery();
        return this.page.evaluate(function (selector, str) {
            return $(selector).attr(str);
        }, selector, str);
    },
    setAttr: function(selector, str, val) {
        this.injectJQuery();
        this.page.evaluate(function (selector, str, val) {
            $(selector).attr(str, val);
        }, selector, str, val);
    },
    getHtml: function(selector) {
        this.injectJQuery();
        return this.page.evaluate(function (selector) {
            return $(selector).html();
        }, selector);
    },
    setHtml: function(selector, val) {
        this.injectJQuery();
        return this.page.evaluate(function (selector, val) {
            return $(selector).html(val);
        }, selector, val);
    },
    fillUserPass: function(then, param) {
        if (this.getAttr('#TPL_username_1', 'value') != '') {
            this.setAttr('#TPL_username_1', 'value', '');
        }
        this.fillContent('#TPL_username_1', null, this.user);
        console.log('user: ' + this.getAttr('#TPL_username_1', 'value'));
        this.fillContent('#TPL_password_1', null, this.password);
        //console.log('password: ' + this.getAttr('#TPL_password_1', 'value'));
        then(param);
    },
    doLogin: function(loginUrl) {
        this.page.open(loginUrl, function(status) {
            if (status != 'success') {
                console.log('open login url failed');
                this.returnResult({error: -3});
                return ;
            }
            this.injectJQuery();
            setTimeout(this.fillUserPass.bind(this), 500, this.click.bind(this), '#J_SubmitStatic');
            this.waitFor('#J_search', null, onQueryPage.bind(this), generalTimeout.bind(this), 20000);
            
        }.bind(this));
    },
    checkLoginPage: function() {
        // 1: login page, 0: query page, -1: unknow page
        this.injectJQuery();
        return this.page.evaluate(function() {
            if ($('#J_search').length > 0) {
               return 0;
            } else if ($('#content').find('iframe').length > 0) {
               return 1;
            } else {
               return -1;
            }
        });
    },
    doQuery: function() {
        this.injectJQuery();
        this.setAttr("input[name='searchType']", 'value', '3');
        this.setAttr("#q", 'searchtype', '3');
        this.setAttr("#q", 'value', 'id=' + this.queryCTX.itemId);
        setTimeout(this.click.bind(this), 1000, 'a.btn');
        this.waitFor('#J_listMainTable', null, onResultPage.bind(this), generalTimeout.bind(this), 10000);
    },
    getTbk: function(itemId, cb, param) {
        this.queryCTX = {
            itemId: itemId,
            param: param,
            callback: cb
        };
        console.log(new Date().getTime() + ': try to open url ' + this.url);
        this.page.open(this.url, enterQueryPage.bind(this));
    }
};

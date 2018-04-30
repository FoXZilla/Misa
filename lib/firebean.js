"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultData = {
    _firebean: '1',
    _version: '0.0.1-alpha.24',
    _close: "1" /* justClose */,
    _redirect: '/',
};
exports.Actions = {
    set_storage(data) {
        localStorage.setItem(data.key, data.value);
    },
    remove_storage(data) {
        localStorage.removeItem(data.key);
    },
    go_article() { },
    go_comment() { },
    go_user() { },
};
exports.basePath = '/';
function stringify(inputData, basePath = '') {
    return `${basePath}/_firebean?${Object.entries(Object.assign({}, exports.DefaultData, inputData))
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value.toString())}`)
        .join('&')}`;
}
exports.stringify = stringify;
function exec(input = location.href) {
    var data = typeof input === 'string' ? parse(input) : input;
    exports.Actions[data._type](data);
    if (data._close === "1" /* justClose */) {
        window.close();
    }
    else if (data._close === "2" /* onlyBlank */) {
        if (window.opener)
            window.close();
    }
    ;
    setTimeout(() => window.open(data._redirect, '_self'), 0);
}
exports.exec = exec;
function parse(url) {
    var queryString = url.split('?').pop().split('#').shift();
    var data = {};
    for (let item of queryString.split('&')) {
        let [key, value] = item.split('=');
        data[decodeURIComponent(key)] = decodeURIComponent(value);
    }
    ;
    return Object.assign({}, exports.DefaultData, data);
}
exports.parse = parse;

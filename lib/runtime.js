"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const token_manager_1 = require("./token-manager");
const path_reader_1 = require("./path-reader");
const Nodemailer = require("nodemailer");
const lib_1 = require("./lib");
const Fs = require('fs-extra');
const Path = require('path');
exports.md = require('marked');
exports.config = lib_1.Toml2Json(Fs.readFileSync(Path.join(path_reader_1.dataPath(), 'config.toml')));
exports.tokenManager = function () {
    var tokenManager = new token_manager_1.default({ tokenAge: tokenAgeMs() });
    return () => tokenManager;
}();
exports.checkToken = async function (req, res, next) {
    var cookie = req.cookies;
    if (!cookie.token) {
        res.json({
            errcode: 401 /* NeedToken */,
            errmsg: 'Token is undefined, did you set withCredentials as true?'
        });
        return;
    }
    ;
    {
        let checkResult = exports.tokenManager().checkToken(cookie.token);
        if (checkResult !== 0 /* Ok */) {
            res.json({
                errcode: checkResult,
                errmsg: 'Cut of check token.'
            });
            return;
        }
        ;
    }
    ;
    next();
};
exports.FireBlogVersion = require('../node_modules/@foxzilla/fireblog/package.json').version;
exports.sendMail = function () {
    const MailConfig = mailConfig() || {
        from: 'tomori',
        connect: null,
    };
    const transporter = function (MailConfig) {
        if (MailConfig && MailConfig.connect) {
            console.log('Loaded mail config.');
            return Nodemailer.createTransport(MailConfig.connect + '/?pool=true');
        }
        else {
            console.log('Use sendmail command to send e-mail.');
            return Nodemailer.createTransport({
                sendmail: true,
                newline: 'unix',
                path: '/usr/sbin/sendmail'
            });
        }
    }(MailConfig);
    const ready = new Promise(resolve => transporter.verify(function (error, success) {
        if (error)
            throw error;
        console.log('Server is ready to take our mail.');
        resolve();
    }));
    return async function ({ to, from = MailConfig.from, title, content }) {
        await ready;
        console.log('sending... mail to:', to);
        if (!from && !MailConfig.from)
            throw new Error('sendMail: no "from" field.');
        return new Promise(function (resolve, reject) {
            transporter.sendMail({
                from, to,
                subject: title,
                html: content,
            }, (err, info) => {
                if (err) {
                    console.error(err);
                    reject(err);
                }
                else {
                    console.log('mail sent:', JSON.stringify(info, null, '  '));
                    resolve(info);
                }
            });
        });
    };
}();
function frontUrl() {
    return exports.config.meta['front_url'];
}
exports.frontUrl = frontUrl;
;
function apiUrl() {
    return exports.config.meta['api_url'];
}
exports.apiUrl = apiUrl;
;
function tokenAgeMs() {
    return (exports.config.meta['token_age_s'] || 60 * 60 * 24 * 7) * 1000;
}
exports.tokenAgeMs = tokenAgeMs;
;
function defaultAvatar(size) {
    var options = exports.config.meta['default_avatar'];
    var bestMatch = lib_1.getBestMatchAvatar(options, size);
    return Path.join(path_reader_1.dataPath(), options[bestMatch]);
}
exports.defaultAvatar = defaultAvatar;
;
function oAuthMap() {
    return exports.config.meta['oauth'];
}
exports.oAuthMap = oAuthMap;
;
function mailConfig() {
    return exports.config.meta.mail || null;
}
exports.mailConfig = mailConfig;
function pathMap2urlMap(pathMap) {
    var map = Object.create(pathMap || null);
    for (let key in pathMap) {
        map[key] = path2url(pathMap[key]);
    }
    ;
    return map;
}
exports.pathMap2urlMap = pathMap2urlMap;
function path2url(path) {
    if (path.startsWith('http'))
        return path;
    return Path.join(path_reader_1.staticPath(), path).replace(path_reader_1.staticPath(), apiUrl());
}
exports.path2url = path2url;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const token_manager_1 = require("./token-manager");
const config_reader_1 = require("./config-reader");
const Nodemailer = require("nodemailer");
const config_reader_2 = require("./config-reader");
const Marked = require('marked');
exports.tokenManager = function () {
    var tokenManager;
    config_reader_1.tokenAgeMs().then(ms => tokenManager = new token_manager_1.default({ tokenAge: ms }));
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
    const transporter = config_reader_2.config.mail && config_reader_2.config.mail.connect
        ? Nodemailer.createTransport(config_reader_2.config.mail.connect)
        : Nodemailer.createTransport({
            sendmail: true,
            newline: 'unix',
            path: '/usr/sbin/sendmail'
        });
    if (config_reader_2.config.mail)
        console.log('Loaded mail config.');
    else
        console.log('Use sendmail command to send e-mail.');
    return async function ({ to, from = config_reader_2.config.mail.from, title, md_content }) {
        if (!from && !config_reader_2.config.mail.from)
            throw new Error('sendMail: no "from" field.');
        return new Promise(function (resolve, reject) {
            transporter.sendMail({
                from, to,
                subject: title,
                html: Marked(md_content),
            }, (err, info) => {
                if (err)
                    reject(err);
                else
                    resolve(info);
            });
        });
    };
}();

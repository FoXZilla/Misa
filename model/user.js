"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_reader_1 = require("../lib/config-reader");
const form_dictator_1 = require("../lib/form-dictator");
const Bluebird = require('bluebird');
const Toml2Json = require('toml').parse;
const Json2Toml = require('json2toml');
const Fs = Bluebird.promisifyAll(require('fs'));
const Path = require('path');
const DATA_PATH = Path.join(config_reader_1.dataPath(), 'user/');
;
;
async function raw2UserInfo(obj) {
    return {
        id: obj.id,
        origin: obj.origin,
        open_id: obj.open_id,
        nickname: obj.nickname,
        mail: obj.mail,
        avatar: `${await config_reader_1.serverUrl()}/user/avatar/${obj['id']}`,
        create_date: obj['create_date'],
    };
}
exports.raw2UserInfo = raw2UserInfo;
;
async function create(input) {
    var raw = {
        id: (await Fs.readdirAsync(DATA_PATH)).length + 1,
        origin: input.origin,
        open_id: input.openId,
        nickname: input.nickname,
        mail: input.mail || '',
        avatar: input.avatar,
        create_date: new Date().toISOString(),
    };
    await Fs.writeFileAsync(Path.join(DATA_PATH, `${raw.id}.toml`), Json2Toml(raw));
    return raw2UserInfo(raw);
}
exports.create = create;
;
async function getRawById(id) {
    var filePath = Path.join(DATA_PATH, `${id}.toml`);
    var isExist = await new Promise(resolve => Fs.access(filePath, Fs.constants.R_OK, (err) => err ? resolve(false) : resolve(true)));
    if (!isExist)
        return null;
    return Toml2Json(await Fs.readFileAsync(filePath));
}
exports.getRawById = getRawById;
async function getById(id) {
    var raw = await getRawById(id);
    return raw ? raw2UserInfo(raw) : null;
}
exports.getById = getById;
;
async function getByOAuth(oAuthId, openId) {
    var fileNameList = await Fs.readdirAsync(DATA_PATH);
    for (let fileName of fileNameList) {
        let filePath = Path.join(DATA_PATH, fileName);
        let userData = Toml2Json(await Fs.readFileAsync(filePath));
        if (userData.origin === oAuthId && userData['open_id'] === openId) {
            return await raw2UserInfo(userData);
        }
        ;
    }
    ;
    return null;
}
exports.getByOAuth = getByOAuth;
;
async function updateInfo(userId, newInfo) {
    var allowedKeys = ['nickname', 'mail'];
    var checker = new form_dictator_1.default(newInfo)
        .pick(allowedKeys)
        .noNull()
        .noUndefined()
        .changeIfExist('mail', String)
        .checkIfExist('mail', v => /^.+@.+$/.test(v))
        .changeIfExist('nickname', String)
        .checkIfExist('nickname', v => v.length !== 0);
    if (checker.hasFail()) {
        switch (checker.witchFail()) {
            case 'nickname':
                return 301 /* Nickname */;
            case 'mail':
                return 302 /* Mail */;
        }
    }
    ;
    var originInfo = await getRawById(userId);
    await Fs.writeFileAsync(Path.join(DATA_PATH, `${userId}.toml`), Json2Toml(Object.assign({}, originInfo, checker.data)));
    return form_dictator_1.default.diff(originInfo, checker.data);
}
exports.updateInfo = updateInfo;
;

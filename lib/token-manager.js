"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pea_script_1 = require("./pea-script");
class TokenManager {
    constructor({ tokenAge }) {
        this.tokenAge = tokenAge;
        this.tokenMap = {};
        this.tokenData = {};
    }
    ;
    checkIn(value) {
        var token = pea_script_1.getRandomChar(16);
        this.tokenMap[token] = value;
        this.tokenData[token] = {
            timer: setTimeout(() => this.destroyToken(token), this.tokenAge),
            createDate: new Date,
        };
        return token;
    }
    ;
    checkToken(token) {
        if (!token)
            return 401 /* NeedToken */;
        if (!(token in this.tokenMap))
            return 401 /* NeedToken */;
        if (this.getTokenAge(token).getTime() < new Date().getTime()) {
            this.destroyToken(token);
            return 402 /* TokenTimeout */;
        }
        ;
        return 0 /* Ok */;
    }
    ;
    getTokenInfo(token) {
        return this.tokenMap[token];
    }
    ;
    destroyToken(token) {
        delete this.tokenData[token];
        delete this.tokenMap[token];
    }
    ;
    getTokenAge(token) {
        return new Date(this.tokenData[token].createDate.getTime() + this.tokenAge);
    }
    ;
}
exports.default = TokenManager;

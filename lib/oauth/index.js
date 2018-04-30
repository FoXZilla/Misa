"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const qq_oauth_1 = require("./qq-oauth");
const fb_oauth_1 = require("./fb-oauth");
const pea_script_1 = require("../pea-script");
exports.default = pea_script_1.Assert([
    qq_oauth_1.default,
    fb_oauth_1.default,
]);

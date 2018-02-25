"use strict";
/// <reference path="../fixed.d.ts"/>
Object.defineProperty(exports, "__esModule", { value: true });
const lib_1 = require("../lib/lib");
const other_1 = require("./other");
const Router = require('express').Router;
const router = Router();
router.use('/oauth', require('./oauth'));
router.use('/user', require('./user'));
router.use('/comment', require('./comment'));
router.use('/article', require('./article'));
router.get('/category/all', lib_1.catchWith(other_1.getCategoryAll));
router.get('/tag/all', lib_1.catchWith(other_1.getTagAll));
module.exports = router;
;
;

/// <reference path="../fixed.d.ts"/>

import {catchWith} from "../lib/lib";
import {getCategoryAll ,getFireBlogVersion ,getTagAll} from "./other";
const Router = require('express').Router;


const router = Router();


router.use('/oauth'       ,require('./oauth'));
router.use('/user'        ,require('./user'));
router.use('/comment'     ,require('./comment'));
router.use('/article'     ,require('./article'));
router.get('/category/all',catchWith(getCategoryAll));
router.get('/tag/all'     ,catchWith(getTagAll));
router.get('/fireblog/version' ,catchWith(getFireBlogVersion));


module.exports =router;

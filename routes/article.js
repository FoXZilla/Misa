"use strict";
/// <reference path="../fixed.d.ts"/>
Object.defineProperty(exports, "__esModule", { value: true });
const pea_script_1 = require("../lib/pea-script");
const Article = require("../model/article");
const lib_1 = require("../lib/lib");
const Router = require('express').Router;
const router = Router();
router.get(`/all`, lib_1.catchWith(pea_script_1.Assert(getArticleAll)));
router.get(`/detail/:article_id(\\d+)`, async function (req, res, next) {
    var query = req.query;
    res.json(await pea_script_1.Assert(async function (article_id) {
        var accessResponse = await Article.accessTo(article_id, { password: query.password });
        if (accessResponse.errcode !== 0 /* Ok */)
            return accessResponse;
        // fetch article data first, then grow view_count
        var result = {
            ...accessResponse,
            ...await Article.getInfoById(article_id),
        };
        if (query.prevent_view_count !== '1')
            await Article.growViewCount(article_id);
        return result;
    })(Number(req.params.article_id)));
});
router.get(`/grow_view_count/:article_id(\\d+)`, async function (req, res, next) {
    var query = req.query;
    res.json(await pea_script_1.Assert(async function (article_id) {
        var accessResponse = await Article.accessTo(article_id, { password: query.password });
        if (accessResponse.errcode !== 0 /* Ok */)
            return accessResponse;
        return {
            ...accessResponse,
            view_count: await Article.growViewCount(article_id),
        };
    })(Number(req.params.article_id)));
});
router.get(`/search`, async function (req, res, next) {
    var query = {
        tag: req.query.tag ? req.query.tag.split(',') : null,
        category: req.query.category ? req.query.category.split(',') : null,
    };
    res.json(await pea_script_1.Assert(async function () {
        var allArticle = await getArticleAll();
        if (query.tag) {
            for (let tag of query.tag) {
                for (let articleId in allArticle.article_map) {
                    if (!allArticle.article_map[articleId].tag_list.includes(tag))
                        delete allArticle.article_map[articleId];
                }
                ;
            }
            ;
        }
        ;
        if (query.category) {
            for (let category of query.category) {
                for (let articleId in allArticle.article_map) {
                    if (!allArticle.article_map[articleId].category_list.includes(category))
                        delete allArticle.article_map[articleId];
                }
                ;
            }
            ;
        }
        ;
        allArticle.article_length = Object.keys(allArticle.article_map).length;
        return allArticle;
    })());
});
async function getArticleAll() {
    var articleList = await Article.getInfoAll();
    return {
        errcode: 0 /* Ok */,
        errmsg: 'all article.',
        article_length: articleList.length,
        article_map: lib_1.toIndexMap(articleList, 'id'),
    };
}
;
module.exports = router;

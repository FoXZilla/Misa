"use strict";
/// <reference path="../fixed.d.ts"/>
Object.defineProperty(exports, "__esModule", { value: true });
const pea_script_1 = require("../lib/pea-script");
const Posts = require("../model/posts");
const lib_1 = require("../lib/lib");
const Router = require('express').Router;
const router = Router();
router.get(`/posts/all`, lib_1.catchWith(pea_script_1.Assert(getPostsAll)));
router.get(`/posts/:posts_id(\\d+)`, async function (req, res, next) {
    var query = req.query;
    res.json(await pea_script_1.Assert(async function (posts_id) {
        let posts = await Posts.getById(posts_id);
        let meta = posts.meta;
        delete posts.meta;
        if (posts.state !== 0 /* Publish */)
            return {
                errcode: 403 /* AccessDeny */,
                errmsg: 'unaddressable posts.',
            };
        if (meta && 'password' in meta && query.password !== meta.password) {
            return {
                errcode: 404 /* IncorrectPassword */,
                errmsg: 'incorrect password.',
                password_hint: meta.password_hint,
            };
        }
        ;
        return {
            errcode: 0 /* Ok */,
            errmsg: 'ok',
            ...posts,
        };
    })(Number(req.params.posts_id)));
});
router.get(`/search`, async function (req, res, next) {
    var query = {
        tag: req.query.tag ? req.query.tag.split(',') : null,
        category: req.query.category ? req.query.category.split(',') : null,
    };
    res.json(await pea_script_1.Assert(async function () {
        var allPosts = await getPostsAll();
        if (query.tag) {
            for (let tag of query.tag) {
                for (let postsId in allPosts.posts_map) {
                    if (!allPosts.posts_map[postsId].tag_list.includes(tag))
                        delete allPosts.posts_map[postsId];
                }
                ;
            }
            ;
        }
        ;
        if (query.category) {
            for (let category of query.category) {
                for (let postsId in allPosts.posts_map) {
                    if (!allPosts.posts_map[postsId].category_list.includes(category))
                        delete allPosts.posts_map[postsId];
                }
                ;
            }
            ;
        }
        ;
        allPosts.posts_length = Object.keys(allPosts.posts_map).length;
        return allPosts;
    })());
});
async function getPostsAll() {
    var postsList = (await Posts.getAll())
        .filter(p => [0 /* Publish */].includes(p.state));
    return {
        errcode: 0 /* Ok */,
        errmsg: 'all posts.',
        posts_length: postsList.length,
        posts_map: lib_1.toIndexMap(postsList, 'id'),
    };
}
;
module.exports = router;

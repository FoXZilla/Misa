/// <reference path="../fixed.d.ts"/>

import {RequestHandler} from "express";
import {Assert} from '../lib/pea-script';
import {
    Get, PostsStatus, Errcode,
} from "../types";
import * as Posts from "../model/posts";
import {catchWith, toIndexMap} from "../lib/lib";

const Router = require('express').Router;


const router = Router();


router.get(`/posts/all`,catchWith(Assert<Get.posts.all.asyncCall>(getPostsAll)));

router.get(`/posts/:posts_id(\\d+)`,async function(req,res,next){
    var query:Get.posts.$posts_id.query =req.query;
    res.json(await Assert<Get.posts.$posts_id.asyncCall>(async function(posts_id){
        let posts =await Posts.getById(posts_id);
        let meta =posts.meta;
        delete posts.meta;
        if(posts.state !==PostsStatus.Publish)return{
            errcode:Errcode.AccessDeny,
            errmsg :'unaddressable posts.',
        };
        if(meta &&'password' in meta &&query.password!==meta.password){
            return {
                errcode:Errcode.IncorrectPassword,
                errmsg :'incorrect password.',
                password_hint :meta.password_hint,
            };
        };
        return {
            errcode:Errcode.Ok,
            errmsg :'ok',
            ...posts,
        };
    })(Number(req.params.posts_id)));
} as RequestHandler);

router.get(`/search`,async function(req,res,next){
    var query:Get.posts.search.query ={
        tag      :req.query.tag?req.query.tag.split(','):null,
        category :req.query.category?req.query.category.split(','):null,
    };
    res.json(await Assert<Get.posts.search.asyncCall>(async function(){
        var allPosts =await getPostsAll();
        if(query.tag){
            for(let tag of query.tag){
                for(let postsId in allPosts.posts_map){
                    if(!allPosts.posts_map[postsId].tag_list.includes(tag))
                        delete allPosts.posts_map[postsId];
                };
            };
        };
        if(query.category){
            for(let category of query.category){
                for(let postsId in allPosts.posts_map){
                    if(!allPosts.posts_map[postsId].category_list.includes(category))
                        delete allPosts.posts_map[postsId];
                };
            };
        };
        allPosts.posts_length =Object.keys(allPosts.posts_map).length;
        return allPosts;
    })());
} as RequestHandler);


async function getPostsAll():Promise<Get.posts.all.response>{
    var postsList =(await Posts.getAll())
        .filter(p=>[PostsStatus.Publish].includes(p.state))
    ;
    return {
        errcode     :Errcode.Ok,
        errmsg      :'all posts.',
        posts_length:postsList.length,
        posts_map   :toIndexMap(postsList,'id'),
    };
};


module.exports =router;
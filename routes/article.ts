import {RequestHandler} from "express";
import {Assert} from '../lib/pea-script';
import {
    Get, Errcode, ApiErrorResponse, ApiSuccessResponse,
} from "@foxzilla/fireblog";
import * as Article from "../model/article";
import {catchWith, toIndexMap} from "../lib/lib";

const Router = require('express').Router;


const router = Router();


router.get(`/all`,catchWith(Assert<Get.article.all.asyncCall>(getArticleAll)));

router.get(`/detail/:article_id(\\d+)`,async function(req,res,next){
    var query:Get.article.detail.$article_id.query =req.query;
    res.json(await Assert<Get.article.detail.$article_id.asyncCall>(async function(article_id){
        var accessResponse =await Article.accessTo(article_id,{password:query.password});
        if(accessResponse.errcode !==Errcode.Ok)return <ApiErrorResponse>accessResponse;
        // fetch article data first, then grow view_count
        var result ={
            ...<ApiSuccessResponse>accessResponse,
            ...await Article.getInfoById(article_id),
        };
        if(query.prevent_view_count!=='1') await Article.growViewCount(article_id);
        return result;
    })(Number(req.params.article_id)));
} as RequestHandler);

router.get(`/grow_view_count/:article_id(\\d+)`,async function(req,res,next){
    var query:Get.article.grow_view_count.$article_id.query =req.query;
    res.json(await Assert<Get.article.grow_view_count.$article_id.asyncCall>(async function(article_id){
        var accessResponse =await Article.accessTo(article_id,{password:query.password});
        if(accessResponse.errcode !==Errcode.Ok)return <ApiErrorResponse>accessResponse;
        return {
            ...<ApiSuccessResponse>accessResponse,
            view_count :await Article.growViewCount(article_id),
        };
    })(Number(req.params.article_id)));
} as RequestHandler);

router.get(`/search`,async function(req,res,next){
    var query:Get.article.search.query ={
        tag      :req.query.tag?req.query.tag.split(','):null,
        category :req.query.category?req.query.category.split(','):null,
    };
    res.json(await Assert<Get.article.search.asyncCall>(async function(){
        var allArticle =await getArticleAll();
        if(query.tag){
            for(let tag of query.tag){
                for(let articleId in allArticle.article_map){
                    if(!allArticle.article_map[articleId].tag_list.includes(tag))
                        delete allArticle.article_map[articleId];
                };
            };
        };
        if(query.category){
            for(let category of query.category){
                for(let articleId in allArticle.article_map){
                    if(!allArticle.article_map[articleId].category_list.includes(category))
                        delete allArticle.article_map[articleId];
                };
            };
        };
        allArticle.article_length =Object.keys(allArticle.article_map).length;
        return allArticle;
    })());
} as RequestHandler);


async function getArticleAll():Promise<Get.article.all.response>{
    var articleList =await Article.getInfoAll();
    return {
        errcode     :Errcode.Ok,
        errmsg      :'all article.',
        article_length:articleList.length,
        article_map   :toIndexMap(articleList,'id'),
    };
};



module.exports =router;
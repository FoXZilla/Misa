import {Post, Errcode, CommentInfo} from "../types/index";
import {commentPath, dataPath, postsPath, serverUrl} from "../lib/config-reader";
import FormDictator from "../lib/form-dictator";
import {AliasString, Omit, PostsComment, PostsInfo, PostsStatus, ResponseDate, ToString, UserInfo} from "../types";
import {tokenManager} from "../lib/runtime";
import {fileExist, getNextIdFromPath} from "../lib/lib";
import * as Comment from '../model/comment';
import * as User from '../model/user';
import {Assert} from '../lib/pea-script';

const Bluebird = require('bluebird');
const Toml2Json =require('toml').parse;
const Json2Toml =require('json2toml');
const Fs = Bluebird.promisifyAll(require('fs'));
const Path = require('path');

const POSTS_PATH =postsPath();
const COMMENT_PATH =commentPath();

export interface Meta{
    password       ?:string;
    password_hint  ?:string;
    no_comment     ?:boolean;
}
export interface Raw extends Omit<PostsInfo,'md_content'|'comment_count'|'comment_list'>{
    meta     ?:Meta;
};
export interface PostsInfoWithMeta extends PostsInfo{
    meta     ?:Meta;
}

export async function getAll():Promise<Omit<PostsInfo,'md_content'|'comment_list'>[]>{
    var postsList:Omit<PostsInfo,'md_content'|'comment_list'>[] =
        (<Raw[]>(await Promise.all((<string[]>(await Fs.readdirAsync(POSTS_PATH)))
            .filter(fileName=>/.toml$/.test(fileName))
            .map(fileName=>Path.join(POSTS_PATH,fileName))
            .map(filePath=>Fs.readFileAsync(filePath))
        )).map(Toml2Json))
        .map(posts=>(delete posts.meta,posts))
        .map(posts=>Object.assign(posts,{comment_count:0}))
    ;

    // count comment
    for(let comment of await Comment.getAll()){
        if(comment.deleted)continue;
        let posts =postsList.find(posts=>posts.id===comment.posts_id);
        if(!posts)continue;
        posts.comment_count++;
    };
    return postsList;//todo: generate description if description is empty
};
export async function getById(postsId:PostsInfo['id']):Promise<PostsInfoWithMeta>{
    var posts:PostsInfoWithMeta ={
        ...(<Raw>Toml2Json(await Fs.readFileAsync(Path.join(POSTS_PATH, `${postsId}.toml`)))),
        md_content:(await Fs.readFileAsync(Path.join(POSTS_PATH,`${postsId}.md`))).toString(),
        get comment_count(){return posts.comment_list.length},
        comment_list :[],
    };
    for(let comment of (await Comment.getAll()).sort((c1,c2)=>new Date(c1.date).getTime()-new Date(c2.date).getTime())){
        if(comment.deleted)continue;
        if(comment.posts_id!==postsId)continue;
        posts.comment_list.push({
            id:comment.id,
            date:comment.date,
            md_content:comment.md_content,
            author_id       :comment.author,
            author_nickname :(await User.getById(comment.author))!.nickname,
            comment_list    :Assert<Omit<PostsComment,'comment_list'>[]>(await Promise.all((await Comment.getAll())
                .filter(c=>c.reply_to===comment.id)
                .map(async c=>({
                    id:c.id,
                    date:c.date,
                    md_content:c.md_content,
                    author_id       :c.author,
                    author_nickname :(await User.getById(c.author))!.nickname,
                }))))
                .sort((c1,c2)=>new Date(c1.date).getTime()-new Date(c2.date).getTime())
            ,
        });
    };
    return posts;//todo: generate description if description is empty
}
export async function isExist(postsId:PostsInfo['id']):Promise<boolean>{
    return fileExist(POSTS_PATH,`${postsId}.toml`);
};
export async function canBeReply(postsId:PostsInfo['id']):Promise<boolean>{
    var posts =await getById(postsId);
    if(!posts)return false;
    if(!posts.meta)return true;
    return posts.meta.no_comment ?true :false;
};
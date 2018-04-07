import {articlePath} from "../lib/config-reader";
import FormDictator from "../lib/form-dictator";
import {Omit, ArticleInfo, ArticleStatus, ArticleRaw, CommentInfo, Errcode, ApiResponse, NeedPasswordResponse} from "@foxzilla/fireblog";
import {fileExist, Json2Toml, Toml2Json} from "../lib/lib";
import * as Comment from '../model/comment';
import * as User from '../model/user';

const Fs = require('fs-extra');
const Path = require('path');

const DATA_PATH =articlePath();


// Types

export type Raw =Omit<ArticleRaw ,'md_content'>;
export type Info=Omit<ArticleInfo,'md_content'|'comment_list'>;


// Transfer

function raw2Info(raw:Raw):Info{
    return {
        ...
        (new FormDictator(raw).pick([
            'id','title','description','cover','state','tag_list','category_list','update_time','create_time','view_count'
        ]).data as Pick<Raw,
            'id'|'title'|'description'|'cover'|'state'|'tag_list'|'category_list'|'update_time'|'create_time'|'view_count'
        >),
        comment_count:0,
    };
}
async function raw2ArticleRaw(raw:Raw):Promise<ArticleRaw>{
    return {
        ...raw,
        md_content:(await Fs.readFile(Path.join(DATA_PATH,`${raw.id}.md`))).toString(),
    }
};
async function articleRaw2ArticleInfo(raw:ArticleRaw):Promise<ArticleInfo>{
    return {
        ...
        (new FormDictator(raw).pick([
            'id','title','description','cover','state','tag_list','category_list','update_time','create_time','view_count','md_content'
        ]).data as Pick<ArticleRaw,
            'id'|'title'|'description'|'cover'|'state'|'tag_list'|'category_list'|'update_time'|'create_time'|'view_count'|'md_content'
        >),
        comment_count:0,
        comment_list :[],
    };
};


// Getter

export async function getRawById(articleId:ArticleInfo['id']):Promise<ArticleRaw>{
    return raw2ArticleRaw(Toml2Json(await Fs.readFile(Path.join(DATA_PATH, `${articleId}.toml`))));
}
export async function getInfoById(articleId:ArticleInfo['id']):Promise<ArticleInfo>{
    var info =await articleRaw2ArticleInfo(await getRawById(articleId));
    var transferData =function(info:CommentInfo):Pick<ArticleInfo['comment_list'][0],'id'|'date'|'md_content'|'author_id'>{
        return {
            id              :info.id,
            date            :info.date,
            md_content      :info.md_content,
            author_id       :info.author,
        }
    };
    var allCommentInfo =await Comment.getInfoAll();
    for(let commentInfo of allCommentInfo){
        if(commentInfo.article_id!==articleId)continue;
        if(commentInfo.reply_to)continue;
        info.comment_list.push({
            ...transferData(commentInfo),
            author_nickname :(await User.getInfoById(commentInfo.author)).nickname,
            comment_list    :await Promise.all(
                allCommentInfo
                .filter(c=>c.reply_to&&c.reply_to===commentInfo.id)
                .map(async c=>({
                    ...transferData(c),
                    author_nickname :(await User.getInfoById(c.author)).nickname,
                })))
            ,
        });
    };
    info.comment_count =info.comment_list.length;
    return info;
}
export async function getRawAll():Promise<Raw[]>{
    return (await (Promise.all((<string[]>(await Fs.readdir(DATA_PATH)))
        .filter(fileName=>/.toml$/.test(fileName))
        .map(fileName=>Path.join(DATA_PATH,fileName))
        .map(filePath=>Fs.readFile(filePath)))))
        .map(Toml2Json)
    ;
}
export async function getInfoAll():Promise<Info[]>{
    var articleList:Info[] =(await getRawAll())
        .filter(article=>!(article.meta&&article.meta.hide_in_list))
        .map(raw2Info)
        .filter(article=>article.state===ArticleStatus.Publish)
    ;

    // count comment
    for(let comment of await Comment.getInfoAll()){
        let article =articleList.find(article=>article.id===comment.article_id);
        if(!article)continue;
        article.comment_count++;
    };

    //todo: generate description if description is empty

    return articleList;
};
export async function isExist(articleId:ArticleInfo['id']):Promise<boolean>{
    return fileExist(DATA_PATH,`${articleId}.toml`);
};
export async function canBeReply(articleId:ArticleInfo['id']):Promise<boolean>{
    var article =await getRawById(articleId);
    if(!article)return false;
    if(!article.meta)return true;
    return !article.meta.no_comment;
};
export async function accessTo(
    articleId:ArticleInfo['id'],
    {password}:{password?:string}={}
):Promise<ApiResponse>{
    if(!await fileExist(DATA_PATH,`${articleId}.toml`))return {
        errcode :Errcode.ArticleNotFound,
        errmsg  :'Could not found this article.',
    };
    var raw:Raw =Toml2Json(await Fs.readFile(Path.join(DATA_PATH, `${articleId}.toml`)));
    if(raw.state!==ArticleStatus.Publish)return{
        errcode:Errcode.AccessDeny,
        errmsg :'unaddressable article.',
    };
    if(raw.meta && raw.meta.password && raw.meta.password!==password)return new FormDictator<NeedPasswordResponse>({
        errcode:Errcode.IncorrectPassword,
        errmsg :'incorrect password.',
        password_hint :raw.meta.password_hint,
    }).noNull().noUndefined().data;
    return {
        errcode:Errcode.Ok,
        errmsg :'ok',
    }
}
export async function growViewCount(articleId:ArticleInfo['id']):Promise<ArticleRaw['view_count']>{
    var raw:Raw =Toml2Json(await Fs.readFile(Path.join(DATA_PATH, `${articleId}.toml`)));
    raw.view_count++;
    await Fs.writeFile(Path.join(DATA_PATH, `${articleId}.toml`),Json2Toml(raw));
    return raw.view_count;
}

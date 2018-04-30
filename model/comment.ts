import {CommentInfo, CommentRaw, Get, UserInfo, FireBean, Post} from "@foxzilla/fireblog";
import {commentPath} from "../lib/path-reader";
import FormDictator from "../lib/form-dictator";
import {fileExist, getNextIdFromPath, Toml2Json ,Json2Toml} from "../lib/lib";
import * as User from '../model/user';
import * as Article from '../model/article';
import {FireBlogVersion, sendMail, frontUrl} from "../lib/runtime";
import {Assert, o_0} from "../lib/pea-script";
import {parse} from "../lib/firebean";
import {at ,reply} from "../lib/mail";

const Fs = require('fs-extra');
const Path = require('path');
const URL = require('url');


const DATA_PATH =commentPath();


// Types

export interface Raw extends CommentRaw{
    ip ?:string;
};


// Transfer

function raw2CommentRaw(raw:Raw):CommentRaw{
    delete raw.ip;
    return raw;
};
async function commentRaw2CommentInfo(raw:CommentRaw):Promise<CommentInfo>{
    return new FormDictator({
        ...new FormDictator(raw).pick([
            'id','date','article_id','author_id','md_content','reply_to'
        ]).data,
        inform_list :raw.inform_list ?await Promise.all(raw.inform_list.map(User.getInfoById)) :undefined,
    }).noUndefined().data;
};


// Getter

export async function getRawById(commentId:CommentRaw['id']):Promise<CommentRaw>{
    return raw2CommentRaw(Toml2Json(
        await Fs.readFile(
            Path.join(DATA_PATH, `${commentId}.toml`),
        )
    ));
};
export async function getInfoById(commentId:CommentInfo['id']):Promise<CommentInfo>{
    return commentRaw2CommentInfo(await getRawById(commentId))
}
export async function getRawAll():Promise<CommentRaw[]>{
    return (await Promise.all((await Fs.readdir(DATA_PATH))
        .map(function(fileName:string){return Path.join(DATA_PATH,fileName)})
        .map(function(filePath:string){return Fs.readFile(filePath)})))
        .map(function(fileData:any):Raw{return Toml2Json(fileData)})
        .map(raw2CommentRaw)
        .sort((c1,c2)=>new Date(c1.date).getTime()-new Date(c2.date).getTime())
    ;
}
export async function getInfoAll():Promise<CommentInfo[]>{
    return await Promise.all((await getRawAll())
        .filter(raw=>raw.deleted!==true)
        .map(commentRaw2CommentInfo))
    ;
}
export async function isExist(commentId:CommentInfo['id']):Promise<boolean>{
    return fileExist(DATA_PATH,`${commentId}.toml`);
};
export async function canBeReply(commentId:CommentInfo['id']):Promise<boolean>{
    var comment =await getRawById(commentId);
    return !comment.reply_to && !comment.deleted;
};


// Setter

export async function create(input:Pick<Raw,'author_id'|'article_id'|'md_content'|'reply_to'|'ip'>):Promise<CommentInfo>{
    var raw:Raw =new FormDictator({
        id         :await getNextIdFromPath(commentPath()),
        ip         :input.ip,
        date       :new Date().toISOString(),
        article_id :input.article_id,
        author_id  :input.author_id,
        md_content :input.md_content,
        reply_to   :input.reply_to,
    }).noUndefined().noNull().data;//todo: https://github.com/KenanY/json2toml/issues/29

    var info:CommentInfo =await commentRaw2CommentInfo(raw2CommentRaw(raw));

    if(info.reply_to && (await getRawById(info.reply_to)).author_id!==info.author_id){
        reply(info).then(console.log ,console.error);
    };
    ~function(){
        var reg =/\[@.+?\]\((.+?)\)/g;
        var result:RegExpExecArray;
        while((result =reg.exec(info.md_content)!) !==null){
            let data:FireBean.Data =parse(result[1]);
            if(data._type ===FireBean.Type.goUser){
                at(data.id ,info).then(console.log ,console.error);;
            };
        };
    }();

    await Fs.writeFile(Path.join(DATA_PATH,`${raw.id}.toml`),Json2Toml(raw));

    return info;
};

export async function remove(commentId:CommentInfo['id']):Promise<CommentInfo>{
    var raw:Raw =await getRawById(commentId);
    raw.deleted=true;
    await Fs.writeFile(Path.join(DATA_PATH,`${raw.id}.toml`),Json2Toml(raw));
    return commentRaw2CommentInfo(raw2CommentRaw(raw));
};

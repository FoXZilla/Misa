import {CommentInfo, CommentRaw, Get, UserInfo, FireBean, Post} from "@foxzilla/fireblog";
import {commentPath, frontUrl} from "../lib/config-reader";
import FormDictator from "../lib/form-dictator";
import {fileExist, getNextIdFromPath, Toml2Json ,Json2Toml} from "../lib/lib";
import * as User from '../model/user';
import * as Article from '../model/article';
import {FireBlogVersion, sendMail} from "../lib/runtime";
import {Assert, o_0} from "../lib/pea-script";

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
            'id','date','article_id','author','md_content','reply_to'
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
        .map(function(fileData):Raw{return Toml2Json(fileData)})
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
    return comment.reply_to ?false :true;
};


// Setter

export async function create(input:Pick<Raw,'author'|'article_id'|'md_content'|'reply_to'|'ip'|'inform_list'>):Promise<CommentInfo>{
    var raw:Raw =new FormDictator({
        id         :await getNextIdFromPath(commentPath()),
        ip         :input.ip,
        date       :new Date().toISOString(),
        article_id :input.article_id,
        author     :input.author,
        md_content :input.md_content,
        reply_to   :input.reply_to,
        inform_list:input.inform_list,
    }).noUndefined().noNull().data;//todo: https://github.com/KenanY/json2toml/issues/29

    var info:CommentInfo =await commentRaw2CommentInfo(raw2CommentRaw(raw));

    if(info.reply_to && (await getRawById(info.reply_to)).author!==info.author)
        informReply(info).then(console.log,console.error);
    if(info.inform_list && info.inform_list.length!==0){
        if(info.reply_to){// It will not inform user when the user has bean informed on reply.
            let index =info.inform_list.findIndex(i=>i.id===info.reply_to);
            if(index !==-1) info.inform_list.splice(index,1);
        }
        informUser(info).then(console.log,console.error);
    };

    await Fs.writeFile(Path.join(DATA_PATH,`${raw.id}.toml`),Json2Toml(raw));

    return info;
};
export async function remove(commentId:CommentInfo['id']):Promise<CommentInfo>{
    var raw:Raw =await getRawById(commentId);
    raw.deleted=true;
    await Fs.writeFile(Path.join(DATA_PATH,`${raw.id}.toml`),Json2Toml(raw));
    return commentRaw2CommentInfo(raw2CommentRaw(raw));
};

export async function informReply(info:CommentInfo){
    var beRepliedComment =await getRawById(info.reply_to!);
    var beRepliedUser =await User.getRawById(beRepliedComment.author);
    if(!beRepliedUser.mail)return 'User has not mail address.';
    var commitUser =await User.getRawById(info.author);
    var articleRaw =await Article.getRawById(info.article_id);

    return sendMail({
        to :beRepliedUser.mail,
        title :`[#${articleRaw.id}/#${beRepliedComment.id}] Your comment receive a reply in article "${articleRaw.title}".`,
        md_content :o_0`
                ${commitUser.nickname}:
                
                ${info.md_content.split('\n').map(i=>'> '+i).join('\n')}
                
                &nbsp;
                
                ---
                
                - [view this reply](${frontUrl()}/_firebean?${new URL.URLSearchParams(Assert<FireBean.GoCommentData>({
                    _version  :FireBlogVersion,
                    _type     :FireBean.Type.goComment,
                    ...new FormDictator(info).pick(['id','article_id','author','reply_to']).noUndefined().data,
                }))})
                - [view your comment](${frontUrl()}/_firebean?${new URL.URLSearchParams(Assert<FireBean.GoCommentData>({
                    _version  :FireBlogVersion,
                    _type     :FireBean.Type.goComment,
                    ...new FormDictator(beRepliedComment).pick(['id','article_id','author','reply_to']).noUndefined().data,
                }))})
                - [view article](${frontUrl()}/_firebean?${new URL.URLSearchParams(Assert<FireBean.GoArticleData>({
                    _version  :FireBlogVersion,
                    _type     :FireBean.Type.goArticle,
                    ...new FormDictator(articleRaw).pick(['id','state']).data,
                }))})
                
            `,
    }).then(console.log,console.error);
};
export async function informUser(info:CommentInfo){
    var articleRaw =await Article.getRawById(info.article_id);
    var commentUser =await User.getRawById(info.author);
    return await Promise.all(info.inform_list!.map(async function(userInfo){
        var userRaw =await User.getRawById(userInfo.id);
        if(!userRaw.mail)return `User ${userInfo.nickname} has not mail address.`;
        return sendMail({
            to :userRaw.mail,
            title :`[#${articleRaw.id}/#${info.id}] ${commentUser.nickname} mentioned you in the comments in article "${articleRaw.title}".`,
            md_content :o_0`
                ${commentUser.nickname}:
                
                ${info.md_content.split('\n').map(i=>'> '+i).join('\n')}
                
                &nbsp;
                
                ---
                
                - [view this comment](${frontUrl()}/_firebean?${new URL.URLSearchParams(Assert<FireBean.GoCommentData>({
                    _version  :FireBlogVersion,
                    _type     :FireBean.Type.goComment,
                    ...new FormDictator(info).pick(['id','article_id','author','reply_to']).noUndefined().data,
                }))})
                - [view article](${frontUrl()}/_firebean?${new URL.URLSearchParams(Assert<FireBean.GoArticleData>({
                    _version  :FireBlogVersion,
                    _type     :FireBean.Type.goArticle,
                    ...new FormDictator(articleRaw).pick(['id','state']).data,
                }))})
                
            `,//todo: review code, and test it
        }).then(console.log,console.error);
    }));
};
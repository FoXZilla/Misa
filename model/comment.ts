import {Post, Errcode, CommentInfo} from "../types/index";
import {commentPath, dataPath, serverUrl} from "../lib/config-reader";
import FormDictator from "../lib/form-dictator";
import {PostsInfo, ResponseDate, UserInfo} from "../types";
import {tokenManager} from "../lib/runtime";
import {fileExist, getNextIdFromPath} from "../lib/lib";
import {Assert} from "../lib/pea-script";

const Bluebird = require('bluebird');
const Toml2Json =require('toml').parse;
const Json2Toml =require('json2toml');
const Fs = Bluebird.promisifyAll(require('fs'));
const Path = require('path');

const DATA_PATH =commentPath();

export interface Raw extends Input{
    id      :number;
    date    :ResponseDate;
    deleted?:boolean;
};
export interface Input extends Post.comment.create.request{
    ip   :string;
    author:number
};

export async function raw2CommentInfo(obj:Raw):Promise<CommentInfo>{
    return new FormDictator(obj)
        .pick(['id','date','posts_id','author','md_content','reply_to'])
        .data
    ;
};

export async function create(input:Input):Promise<CommentInfo>{
    var raw:Raw =new FormDictator({
        id   :await getNextIdFromPath(commentPath()),
        ip   :input.ip,
        date :new Date().toISOString(),
        posts_id   :input.posts_id,
        author     :input.author,
        md_content :input.md_content,
        reply_to   :input.reply_to,
    }).noUndefined().noNull().data;//todo: https://github.com/KenanY/json2toml/issues/29

    await Fs.writeFileAsync(Path.join(DATA_PATH,`${raw.id}.toml`),Json2Toml(raw));

    return raw2CommentInfo(raw);
};
export async function remove(commentId:CommentInfo['id']):Promise<CommentInfo>{
    var raw:Raw =Toml2Json(await Fs.readFileAsync(Path.join(DATA_PATH,`${commentId}.toml`)));
    raw.deleted=true;
    await Fs.writeFileAsync(Path.join(DATA_PATH,`${raw.id}.toml`),Json2Toml(raw));
    return raw2CommentInfo(raw);
};
export async function getById(commentId:CommentInfo['id']):Promise<CommentInfo>{
    return raw2CommentInfo(
        Toml2Json(
            await Fs.readFileAsync(
                Path.join(DATA_PATH,
                `${commentId}.toml`),
            )
        )
    );
}
export async function getAll():Promise<CommentInfo[]>{
    return Promise.all((<Raw[]>(
        (await Promise.all(
            (<string[]>(await Fs.readdirAsync(DATA_PATH)))
            .map(fileName=>Path.join(DATA_PATH,fileName))
            .map(filePath=>Fs.readFileAsync(filePath))
        ))
        .map(Toml2Json)))
        .filter(c=>!c.deleted)
        .map(raw2CommentInfo))
    ;
};
export async function isExist(commentId:CommentInfo['id']):Promise<boolean>{
    return fileExist(DATA_PATH,`${commentId}.toml`);
};
export async function canBeReply(commentId:CommentInfo['id']):Promise<boolean>{
    var comment =await getById(commentId);
    if(!comment)return false;
    return comment.reply_to ?false :true;
};
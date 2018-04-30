import {Post, Errcode, UserInfo, UserRaw} from "@foxzilla/fireblog";
import {dataPath ,userPath} from "../lib/path-reader";
import {apiUrl} from "../lib/runtime";
import FormDictator from "../lib/form-dictator";
import {fileExist, Toml2Json ,Json2Toml} from "../lib/lib";

const Fs = require('fs-extra');
const Path = require('path');

const DATA_PATH =userPath();


// Transfer

export function userRaw2UserInfo(raw:UserRaw):UserInfo{
    return {
        id      :raw.id,
        nickname:raw.nickname,
        avatar  :`${apiUrl()}/user/avatar/${raw['id']}`,
        create_date:raw['create_date'],
    };
};


// Getter

export async function getRawById(id:number):Promise<UserRaw>{
    return Toml2Json(await Fs.readFile(Path.join(DATA_PATH,`${id}.toml`)));
};
export async function getInfoById(id:number):Promise<UserInfo>{
    return userRaw2UserInfo(await getRawById(id));
};
export async function getRawByOAuth(OAuthId:UserRaw['origin'],openId:UserRaw['open_id']):Promise<UserRaw|undefined>{
    return (await Promise.all((await Fs.readdir(DATA_PATH))
        .map(function(fileName:string){return Path.join(DATA_PATH,fileName)})
        .map(function(filePath:string){return Fs.readFile(filePath)})))
        .map(Toml2Json as (i:any)=>UserRaw)
        .find(user=>user.origin===OAuthId&&user.open_id===openId)
    ;
};
export async function getInfoByOAuth(OAuthId:UserRaw['origin'],openId:UserRaw['open_id']):Promise<UserInfo|undefined>{
    var raw =await getRawByOAuth(OAuthId,openId);
    if(!raw)return;
    return userRaw2UserInfo(raw);
};
export async function isExist(id:number):Promise<boolean>{
    return fileExist(Path.join(DATA_PATH,`${id}.toml`));
};


// Setter

export async function create(input:Pick<UserRaw,'origin'|'open_id'|'nickname'|'mail'|'avatar'>):Promise<UserInfo>{
    var raw:UserRaw ={
        ...new FormDictator(input).pick(['origin','open_id','nickname','mail','avatar']).data,
        id      :(await Fs.readdir(DATA_PATH)).length+1,
        create_date:new Date().toISOString(),
    };

    await Fs.writeFile(Path.join(DATA_PATH,`${raw.id}.toml`),Json2Toml(raw));

    return userRaw2UserInfo(raw);
};
export async function updateInfo(userId:number ,newInfo:Partial<Pick<UserRaw,'nickname'|'mail'>>):Promise<
    Partial<Post.user.update_info.request>
    | Errcode.Nickname
    | Errcode.Mail
>{
    var checker =new FormDictator(newInfo)
        .pick(['nickname','mail'])
        .noNull()
        .noUndefined()
        .changeIfExist('mail',String)
        .checkIfExist('mail',v=>/^.+@.+$/.test(v))
        .changeIfExist('nickname',String)
        .checkIfExist('nickname',v=>v.length!==0)
    ;
    if(checker.hasFail()){
        switch(checker.witchFail()!){
            case 'nickname':
                return Errcode.Nickname;
            case 'mail':
                return Errcode.Mail;
        }
    };
    var originInfo =await getRawById(userId);

    await Fs.writeFile(
        Path.join(DATA_PATH,`${userId}.toml`),
        Json2Toml(Object.assign({},originInfo,checker.data)),
    );


    return FormDictator.diff(originInfo,checker.data);
};

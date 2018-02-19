import {Post, Errcode, UserInfo} from "../types/index";
import {dataPath, serverUrl} from "../lib/config-reader";
import FormDictator from "../lib/form-dictator";

const Bluebird = require('bluebird');
const Toml2Json =require('toml').parse;
const Json2Toml =require('json2toml');
const Fs = Bluebird.promisifyAll(require('fs'));
const Path = require('path');

const DATA_PATH =Path.join(dataPath(),'user/');

export interface Raw{
    id      :number,
    origin  :string;
    open_id :string;
    nickname:string;
    mail   ?:string;
    avatar  :{
        [p: number]:string,
    };
    create_date:string;
};
export interface Input{
    origin  :string;
    openId  :string;
    nickname:string;
    mail   ?:string;
    avatar  :{
        [p: number]:string,
    },
};

export async function raw2UserInfo(obj:Raw):Promise<UserInfo>{
    return {
        id      :obj.id,
        origin  :obj.origin,
        open_id :obj.open_id,
        nickname:obj.nickname,
        mail    :obj.mail,
        avatar  :`${await serverUrl()}/user/avatar/${obj['id']}`,
        create_date:obj['create_date'],
    };
};

export async function create(input:Input):Promise<UserInfo>{
    var raw:Raw ={
        id      :(await Fs.readdirAsync(DATA_PATH)).length+1,
        origin  :input.origin,
        open_id :input.openId,
        nickname:input.nickname,
        mail    :input.mail||'',//todo: https://github.com/KenanY/json2toml/issues/29
        avatar  :input.avatar,
        create_date:new Date().toISOString(),
    };

    await Fs.writeFileAsync(Path.join(DATA_PATH,`${raw.id}.toml`),Json2Toml(raw));

    return raw2UserInfo(raw);
};

export async function getRawById(id:number):Promise<Raw|null>{
    var filePath =Path.join(DATA_PATH,`${id}.toml`);
    var isExist =await new Promise(resolve=>Fs.access(
        filePath,
        Fs.constants.R_OK,
        (err:NodeJS.ErrnoException)=>err?resolve(false):resolve(true)
    ));
    if(!isExist)return null;
    return Toml2Json(await Fs.readFileAsync(filePath));
}
export async function getById(id:number):Promise<UserInfo|null>{
    var raw =await getRawById(id);
    return raw ?raw2UserInfo(raw) :null;
};
export async function getByOAuth(oAuthId:string,openId:string):Promise<UserInfo|null>{
    var fileNameList =await Fs.readdirAsync(DATA_PATH);
    for(let fileName of fileNameList){
        let filePath =Path.join(DATA_PATH,fileName);
        let userData =Toml2Json(await Fs.readFileAsync(filePath));
        if(userData.origin===oAuthId &&userData['open_id']===openId){
            return await raw2UserInfo(userData);
        };
    };
    return null;
};
export async function updateInfo(userId:number ,newInfo:Partial<Post.user.update_info.body>):Promise<
    Partial<Post.user.update_info.body>
    | Errcode.Nickname
    | Errcode.Mail
>{
    var allowedKeys:(keyof Post.user.update_info.body)[] =['nickname','mail'];
    var checker =new FormDictator(newInfo)
        .pick(allowedKeys)
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

    await Fs.writeFileAsync(
        Path.join(DATA_PATH,`${userId}.toml`),
        Json2Toml(Object.assign({},originInfo,checker.data)),
    );


    return FormDictator.diff(originInfo,checker.data);
};
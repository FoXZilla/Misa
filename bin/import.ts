#!/usr/bin/env node

import {FireBlogData} from "@foxzilla/fireblog";
import {fileExist ,Json2Toml ,Toml2Json} from "../lib/lib";
import {
    articlePath ,
    attachmentPath ,
    categoryPath ,
    commentPath ,dataPath ,defalutAvatarPath ,faviconPath ,initPath ,privateStaticPath ,
    setDataPath ,staticPath ,
    tagPath ,
    userPath
} from "../lib/path-reader";
import {getRandomChar} from "../lib/pea-script";

var program = require('commander');
var Path = require('path');
var Fs = require('fs-extra');
var Download = require('download');
var URL = require('url');


program
    .arguments('<file>')
    .option('-o, --out [path]', 'which dir to output')
    .option('--no-attachment', 'don\'t import attachment')
    .action(async function (file:string, options:any){
        if(!options.out) setDataPath(Path.join(__dirname,'../_data'));
        else setDataPath(Path.join(__dirname,'../',options.out));

        const Data:FireBlogData =require(Path.resolve(file));

        Fs.removeSync(dataPath());//todo: merge support
        initPath();

        portingData(Data);

        var dataConfig ={
            version    :Data.version,
            name       :Data.name,
            meta       :Object.assign({
                token_age_s: 60*60*24*7,
                author :{
                    names :['foxzilla','Tomori'],
                },
                nav :[{
                    "type": "link",
                    "href": "/",
                    "text": "Home"
                }],
                default_avatar:function(){//todo: fetch data to local
                    var map:any ={};
                    for(let [size,path] of Object.entries(defalutAvatarPath())){
                        let targetPath =Path.join(privateStaticPath() ,Path.basename(path));
                        map[size] =targetPath.replace(dataPath(),'.');
                        console.log(targetPath);
                        Fs.copyFileSync(
                            path,
                            targetPath,
                        );
                    };
                    return map;
                }(),
            },Data.meta),
        };

        console.log(`Imported ${dataPath()}`);

        var configPath =Path.join(dataPath(),`config.toml`);
        Fs.writeFileSync(configPath ,Json2Toml(dataConfig));

        if(options.attachment){
            Data.data.attachment.push(...function(data){
                var result:(string|undefined)[] =[];

                if(data.meta.author.avatar)
                    result.push(data.meta.author.avatar);
                if(data.meta.default_avatar)
                    result.push(...Object.values(data.meta.default_avatar));
                if(data.meta.favicon)
                    result.push(...Object.values(data.meta.favicon));
                if(data.meta.oauth)
                    result.push(...Object.values(data.meta.oauth).map(i=>i.icon));

                data.data.user.forEach(user=>{
                    if(!('avatar' in user))return;
                    result.push(...Object.values(user.avatar!));
                });

                result =result.filter(item=>item&&item.startsWith('http'));

                return result as string[];
            }(Data));
            fixImages(
                await downloadAttachment(Data.data.attachment),
                [
                    configPath,
                    ...(await Fs.readdir(articlePath())).map((s:string)=>Path.join(articlePath(),s)),
                    ...(await Fs.readdir(commentPath())).map((s:string)=>Path.join(commentPath(),s)),
                    ...(await Fs.readdir(userPath())).map((s:string)=>Path.join(userPath(),s)),
                ],
                dataConfig.meta.api_url,
            );
        };





        if(!fileExist(Path.join(staticPath(),'/favicon.ico')))
        Fs.copyFileSync(
            faviconPath(),
            Path.join(staticPath(),'/favicon.ico'),
        );

    })
;

process.on('unhandledRejection',console.error);

program.parse(process.argv);


function portingData(Data :FireBlogData){
    Data.data.category.forEach(item=>{
        Fs.writeFileSync(Path.join(categoryPath(),`${item.alias}.toml`),Json2Toml(item));
    });
    Data.data.tag.forEach(item=>{
        Fs.writeFileSync(Path.join(tagPath(),`${item.alias}.toml`),Json2Toml(item));
    });
    Data.data.article.forEach(item=>{
        Fs.writeFileSync(Path.join(articlePath(),`${item.id}.md`),item.md_content);
        delete item.md_content;
        Fs.writeFileSync(Path.join(articlePath(),`${item.id}.toml`),Json2Toml(item));
    });
    Data.data.user.forEach(item=>{
        Fs.writeFileSync(Path.join(userPath(),`${item.id}.toml`),Json2Toml(item));
    });
    Data.data.comment.forEach(item=>{
        Fs.writeFileSync(Path.join(commentPath(),`${item.id}.toml`),Json2Toml(item));
    });
}

function downloadAttachment(attachments :string[]):Promise<string>{
    console.log('Downloading attachment...');

    attachments =[...new Set(attachments)];

    let importPath =Path.join(attachmentPath(), new Date().toISOString().replace(/\:/g,'.'));
    Fs.mkdirSync(importPath);

    const ThreadNumber =4;

    let threadNumber =ThreadNumber;
    let failUrlList:string[] =[];
    let map:any ={};

    var doDownload =function(resolve:(mapPath:string)=>void){
        let url =attachments.pop();
        if(!url){
            if(++threadNumber+1===ThreadNumber){
                failUrlList.length
                    ?console.log(`\nDownloaded, but fail in:\n${failUrlList.join('\n')}`)
                    :console.log('\nDownloaded.')
                ;
                let mapPath =Path.join(attachmentPath(),'_map.json');
                if(fileExist(mapPath)){
                    let oldMap =require(mapPath);
                    console.log('merge map of attachments in',mapPath);
                    Fs.writeFileSync(
                        mapPath,
                        JSON.stringify(
                            Object.assign({},oldMap,map),
                            null,
                            '  ',
                        ),
                    );
                }else{
                    console.log('create map of attachments:',mapPath);
                    Fs.writeFileSync(
                        mapPath,
                        JSON.stringify(map,null,'  '),
                    );
                };
                resolve(mapPath);
            };
            return;
        };
        let path =Path.join(importPath ,getRandomChar(5).toLowerCase(), new URL.URL(url).pathname, '../');
        Download(
            encodeURI(url)
            ,path
            ,{
                proxy:process.env.http_proxy,
                filename : url.split('/').pop(),
            }
        ).then(function(){
            map[url!]=path.replace(dataPath(),'.')+'/'+new URL.URL(url).pathname.split('/').pop();
            console.log('Downloaded',url);
            doDownload(resolve);
        },function(e:Error){
            console.warn(`Download fail: ${url}`);
            failUrlList.push(url!);
            doDownload(resolve);
        });
        console.log(`Downloading: ${url}`);
    };
    return new Promise(resolve=>{
        while(threadNumber--)
            Promise.resolve().then(()=>doDownload(resolve))
    });
}

function fixImages(mapPath:string ,filePathList:string[] ,basePath:string){
    console.log('fix path of images...');

    for(let filePath of filePathList)
        for(let [oldUrl,newUrl] of Object.entries(require(mapPath)))
            Fs.writeFileSync(filePath,Fs.readFileSync(filePath).toString().replace(
                new RegExp(oldUrl,'g'),
                Path.join(dataPath(),newUrl).replace(staticPath(),basePath+'/'),
            ));
        ;
    ;

    console.log('fixed.');
}

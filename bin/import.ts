#!/usr/bin/env node

import {FireBlogData} from "@foxzilla/fireblog";
import {Json2Toml} from "../lib/lib";


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
        const Data:FireBlogData =require(Path.resolve(file));
        const ExportPath =Path.resolve(options.out||'./_data');
        Fs.removeSync(ExportPath);
        Fs.mkdirSync(ExportPath);
        {
            let dataPath =Path.join(ExportPath,`./category/`);
            Fs.mkdirSync(dataPath);
            Data.data.category.forEach(item=>{
                Fs.writeFileSync(Path.join(dataPath,`${item.alias}.toml`),Json2Toml(item));
            });
        };
        {
            let dataPath =Path.join(ExportPath,`./tag/`);
            Fs.mkdirSync(dataPath);
            Data.data.tag.forEach(item=>{
                Fs.writeFileSync(Path.join(dataPath,`${item.alias}.toml`),Json2Toml(item));
            });
        };
        {
            let dataPath =Path.join(ExportPath,`./article/`);
            Fs.mkdirSync(dataPath);
            Data.data.article.forEach(item=>{
                Fs.writeFileSync(Path.join(dataPath,`${item.id}.md`),item.md_content);
                delete item.md_content;
                Fs.writeFileSync(Path.join(dataPath,`${item.id}.toml`),Json2Toml(item));
            });
        };
        {
            let dataPath =Path.join(ExportPath,`./user/`);
            Fs.mkdirSync(dataPath);
            Data.data.user.forEach(item=>{
                Fs.writeFileSync(Path.join(dataPath,`${item.id}.toml`),Json2Toml(item));
            });
        };
        {
            let dataPath =Path.join(ExportPath,`./comment/`);
            Fs.mkdirSync(dataPath);
            Data.data.comment.forEach(item=>{
                Fs.writeFileSync(Path.join(dataPath,`${item.id}.toml`),Json2Toml(item));
            });
        };
        {
            let attachmentPath =Path.join(ExportPath,`./attachment/`);
            let dataPath =Path.join(attachmentPath,`_misa`);
            Fs.mkdirSync(attachmentPath);
            Fs.mkdirSync(dataPath);
            Fs.copyFileSync(
                Path.join(__dirname,'../lib/image/akkarin-40x40.gif'),
                Path.join(dataPath,'/default-avatar-40x40.gif'),
            );
            Fs.copyFileSync(
                Path.join(__dirname,'../lib/image/akkarin-100x100.gif'),
                Path.join(dataPath,'/default-avatar-100x100.gif'),
            );
        };
        {
            Fs.writeFileSync(Path.join(ExportPath,`config.toml`),Json2Toml({
                version    :Data.version,
                front_url  :Data.front_url,
                token_age_s:Data.token_age_s||60*60*24*7,
                api_url    :Data.api_url,
                default_avatar:Data.default_avatar||{//todo: fetch data to local
                    40 :"./attachment/_misa/default-avatar-40x40.gif",
                    100:"./attachment/_misa/default-avatar-100x100.gif",
                },
            }));
        };
        console.log(`Imported ${ExportPath}`);

        if(options.attachment &&Data.data.attachment.length){
            console.log('Downloading attachment...');
            let dataPath =Path.join(ExportPath,'attachment/_import');
            Fs.mkdirSync(dataPath);
            const ThreadNumber =4;
            let threadNumber =ThreadNumber;
            let failUrlList:string[] =[];
            let map:any ={};
            while(threadNumber--){
                ~function _self(){
                    let url =Data.data.attachment.pop();
                    if(!url){
                        if(++threadNumber+1===ThreadNumber){
                            failUrlList.length
                                ?console.log(`\nDownloaded, but fail in:\n${failUrlList.join('\n')}`)
                                :console.log('\nDownloaded.')
                            ;
                        }
                        return;
                    };
                    let path =Path.join(dataPath,new URL.URL(url).pathname);
                    Download(encodeURI(url),path).then(function(){
                        map[url!]=path.replace(ExportPath,'');
                        _self();
                    },function(e:Error){
                        console.warn(`Download fail: ${url}`);
                        failUrlList.push(url!);
                        _self();
                    });
                    Fs.writeFileSync(
                        Path.join(ExportPath,'attachment/_import_map.json'),
                        JSON.stringify(map,null,'  '),
                    );
                    console.log(`Downloading: ${url}`);
                }();
            };
        };
    })
;

program.parse(process.argv);
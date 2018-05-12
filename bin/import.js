#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lib_1 = require("../lib/lib");
const path_reader_1 = require("../lib/path-reader");
const pea_script_1 = require("../lib/pea-script");
var program = require('commander');
var Path = require('path');
var Fs = require('fs-extra');
var Download = require('download');
var URL = require('url');
program
    .arguments('<file>')
    .option('-o, --out [path]', 'which dir to output')
    .option('--no-attachment', 'don\'t import attachment')
    .action(async function (file, options) {
    if (!options.out)
        path_reader_1.setDataPath(Path.join(__dirname, '../_data'));
    else
        path_reader_1.setDataPath(Path.join(__dirname, '../', options.out));
    const Data = require(Path.resolve(file));
    Fs.removeSync(path_reader_1.dataPath()); //todo: merge support
    path_reader_1.initPath();
    portingData(Data);
    var dataConfig = {
        version: Data.version,
        name: Data.name,
        meta: Object.assign({
            token_age_s: 60 * 60 * 24 * 7,
            author: {
                names: ['foxzilla', 'Tomori'],
            },
            nav: [{
                    "type": "link",
                    "href": "/",
                    "text": "Home"
                }],
            default_avatar: function () {
                var map = {};
                for (let [size, path] of Object.entries(path_reader_1.defalutAvatarPath())) {
                    let targetPath = Path.join(path_reader_1.privateStaticPath(), Path.basename(path));
                    map[size] = targetPath.replace(path_reader_1.dataPath(), '.');
                    console.log(targetPath);
                    Fs.copyFileSync(path, targetPath);
                }
                ;
                return map;
            }(),
        }, Data.meta),
    };
    console.log(`Imported ${path_reader_1.dataPath()}`);
    var configPath = Path.join(path_reader_1.dataPath(), `config.toml`);
    Fs.writeFileSync(configPath, lib_1.Json2Toml(dataConfig));
    if (options.attachment) {
        Data.data.attachment.push(...function (data) {
            var result = [];
            if (data.meta.author.avatar)
                result.push(data.meta.author.avatar);
            if (data.meta.default_avatar)
                result.push(...Object.values(data.meta.default_avatar));
            if (data.meta.favicon)
                result.push(...Object.values(data.meta.favicon));
            if (data.meta.oauth)
                result.push(...Object.values(data.meta.oauth).map(i => i.icon));
            data.data.user.forEach(user => {
                if (!('avatar' in user))
                    return;
                result.push(...Object.values(user.avatar));
            });
            result = result.filter(item => item && item.startsWith('http'));
            return result;
        }(Data));
        fixImages(await downloadAttachment(Data.data.attachment), [
            configPath,
            ...(await Fs.readdir(path_reader_1.articlePath())).map((s) => Path.join(path_reader_1.articlePath(), s)),
            ...(await Fs.readdir(path_reader_1.commentPath())).map((s) => Path.join(path_reader_1.commentPath(), s)),
            ...(await Fs.readdir(path_reader_1.userPath())).map((s) => Path.join(path_reader_1.userPath(), s)),
        ], dataConfig.meta.api_url);
    }
    ;
    if (!lib_1.fileExist(Path.join(path_reader_1.staticPath(), '/favicon.ico')))
        Fs.copyFileSync(path_reader_1.faviconPath(), Path.join(path_reader_1.staticPath(), '/favicon.ico'));
});
process.on('unhandledRejection', console.error);
program.parse(process.argv);
function portingData(Data) {
    Data.data.category.forEach(item => {
        Fs.writeFileSync(Path.join(path_reader_1.categoryPath(), `${item.alias}.toml`), lib_1.Json2Toml(item));
    });
    Data.data.tag.forEach(item => {
        Fs.writeFileSync(Path.join(path_reader_1.tagPath(), `${item.alias}.toml`), lib_1.Json2Toml(item));
    });
    Data.data.article.forEach(item => {
        Fs.writeFileSync(Path.join(path_reader_1.articlePath(), `${item.id}.md`), item.md_content);
        delete item.md_content;
        Fs.writeFileSync(Path.join(path_reader_1.articlePath(), `${item.id}.toml`), lib_1.Json2Toml(item));
    });
    Data.data.user.forEach(item => {
        Fs.writeFileSync(Path.join(path_reader_1.userPath(), `${item.id}.toml`), lib_1.Json2Toml(item));
    });
    Data.data.comment.forEach(item => {
        Fs.writeFileSync(Path.join(path_reader_1.commentPath(), `${item.id}.toml`), lib_1.Json2Toml(item));
    });
}
function downloadAttachment(attachments) {
    console.log('Downloading attachment...');
    attachments = [...new Set(attachments)];
    let importPath = Path.join(path_reader_1.attachmentPath(), new Date().toISOString().replace(/\:/g, '.'));
    Fs.mkdirSync(importPath);
    const ThreadNumber = 4;
    let threadNumber = ThreadNumber;
    let failUrlList = [];
    let map = {};
    var doDownload = function (resolve) {
        let url = attachments.pop();
        if (!url) {
            if (++threadNumber + 1 === ThreadNumber) {
                failUrlList.length
                    ? console.log(`\nDownloaded, but fail in:\n${failUrlList.join('\n')}`)
                    : console.log('\nDownloaded.');
                let mapPath = Path.join(path_reader_1.attachmentPath(), '_map.json');
                if (lib_1.fileExist(mapPath)) {
                    let oldMap = require(mapPath);
                    console.log('merge map of attachments in', mapPath);
                    Fs.writeFileSync(mapPath, JSON.stringify(Object.assign({}, oldMap, map), null, '  '));
                }
                else {
                    console.log('create map of attachments:', mapPath);
                    Fs.writeFileSync(mapPath, JSON.stringify(map, null, '  '));
                }
                ;
                resolve(mapPath);
            }
            ;
            return;
        }
        ;
        let path = Path.join(importPath, pea_script_1.getRandomChar(5).toLowerCase(), new URL.URL(url).pathname, '../');
        Download(encodeURI(url), path, {
            proxy: process.env.http_proxy,
            filename: url.split('/').pop(),
        }).then(function () {
            map[url] = path.replace(path_reader_1.dataPath(), '.') + '/' + new URL.URL(url).pathname.split('/').pop();
            console.log('Downloaded', url);
            doDownload(resolve);
        }, function (e) {
            console.warn(`Download fail: ${url}`);
            failUrlList.push(url);
            doDownload(resolve);
        });
        console.log(`Downloading: ${url}`);
    };
    return new Promise(resolve => {
        while (threadNumber--)
            Promise.resolve().then(() => doDownload(resolve));
    });
}
function fixImages(mapPath, filePathList, basePath) {
    console.log('fix path of images...');
    for (let filePath of filePathList)
        for (let [oldUrl, newUrl] of Object.entries(require(mapPath)))
            Fs.writeFileSync(filePath, Fs.readFileSync(filePath).toString().replace(new RegExp(oldUrl, 'g'), Path.join(path_reader_1.dataPath(), newUrl).replace(path_reader_1.staticPath(), basePath + '/')));
    ;
    ;
    console.log('fixed.');
}

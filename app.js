console.log(`\
 ._________________________________________________________.
 |_________________________________________________________|
 |_______________________#_________________________________|
 |________________##____###________________________________|
 |______####_____###_______________________________________|
 |______#####___####________________##_____________________|
 |_______#####__####____###_______###_______####___________|
 |_______##_#####_##____##______##_________#__##___________|
 |_______##__###___##___##_____######_____##__##___________|
 |_______##________##___##_________#####__#___##___________|
 |_______##________###___##_________###___#__###___________|
 |_______##_________##___##___######______####_#####_______|
 |_________________________________________________________|
 |_________________________________________________________|
 |_________________________________________________________|
`);
process.on('unhandledRejection',console.error);


var express=require('express');
var path=require('path');
var favicon=require('serve-favicon');
var logger=require('morgan');
var cookieParser=require('cookie-parser');
var bodyParser=require('body-parser');
var HttpsProxyAgent =require('https-proxy-agent');

var index=require('./routes/index');
var {staticPath}=require("./lib/path-reader");
var {frontUrl}=require("./lib/runtime");

var app=express();


console.log('Set CORS for',frontUrl());
app.use(async function(req,res,next){
    res.set('Access-Control-Allow-Origin',frontUrl());
    res.set('Access-Control-Allow-Credentials','true');
    next();
});


~function(proxyStr){
    if(!proxyStr) return;
    if(!proxyStr.startsWith('http')) proxyStr='http://'+proxyStr;
    global.HTTP_PROXY =new HttpsProxyAgent(proxyStr);
    console.log('Create a proxy:',proxyStr);
}(process.env.http_proxy||process.env.HTTP_PROXY);


app.use(function(){
    var sleep=process.env.MISA_SLEEP;
    if(sleep){
        console.log(`Misa will sleep ${sleep}ms in every request.`);
        return function(req,res,next){
            setTimeout(next,sleep);
        };
    }else{
        return (req,res,next)=>next();
    };
}());


app.use(logger('dev'));
app.use(bodyParser.json({type:'*/*'}));
app.use(cookieParser());
app.use('/',index);
app.use(express.static(staticPath()));
app.use(favicon(path.join(staticPath(),'favicon.ico')));


// catch 404 and forward to error handler
app.use(function(req,res,next){
    var err=new Error('Not Found');
    err.status=404;
    next(err);
});

// error handler
app.use(function(err,req,res,next){
    // set locals, only providing error in development
    res.locals.message=err.message;
    res.locals.error=req.app.get('env')==='development'?err:{};

    // render the error page
    res.status(err.status||500);
    res.json({
        errmsg:err.toString(),
        errcode:1,
    });
});


module.exports=app;

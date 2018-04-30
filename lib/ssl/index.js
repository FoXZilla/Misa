const Fs =require('fs');
const Path =require('path');

try{
    module.exports ={
        key: Fs.readFileSync(Path.join(__dirname,'key.pem'),'utf-8'),
        cert: Fs.readFileSync(Path.join(__dirname,'server.crt'),'utf-8'),
    };
    console.log('SSL key loaded');
}catch(error){
    console.log('Generate a key for HTTPs');
    module.exports =require('openssl-self-signed-certificate');
}

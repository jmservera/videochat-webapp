crypto=require("crypto");


function getTURNCredentials(name, secret) {
    var unixTimeStamp = Math.round(Date.now() / 1000) + 24 * 3600, // this credential would be valid for the next 24 hours
    username = [unixTimeStamp, name].join(':'), password, hmac = crypto.createHmac('sha1', secret);
    hmac.setEncoding('base64');
    hmac.write(username);
    hmac.end();
    password = hmac.read();
    return {
        username: username,
        password: password
    };
};

var args=process.argv.slice(2);

if(args.length==2){
    console.log(getTURNCredentials(args[0],args[1]));
}
else{
    console.log(getTURNCredentials("admin","ThisIsThe4dminP$$"));
}
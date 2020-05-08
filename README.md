# Video Chat app

A [WebRTC test](https://tsh.io/blog/how-to-write-video-chat-app-using-webrtc-and-nodejs/)

You may need a [TURN server](https://devblogs.microsoft.com/cse/2018/01/29/orchestrating-turn-servers-cloud-deployment/) and to create a certificate for it:

> openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365

Use [this technique](https://stackoverflow.com/questions/35766382/coturn-how-to-use-turn-rest-api) for coturn password:

``` typescript
private getTURNCredentials(name:string, secret:string):{username:string,password:string} {
    var unixTimeStamp:Number = Math.round(Date.now()/1000) + 24*3600,  // this credential would be valid for the next 24 hours
        username:string = [unixTimeStamp, name].join(':'), password:string,
        hmac = crypto.createHmac('sha1', secret);
    hmac.setEncoding('base64');
    hmac.write(username);
    hmac.end();
    password = hmac.read();
    return {
        username: username,
        password: password
    };
}
```

You can find more WebRTC good explanations in [this article](https://webrtc.ventures/2018/07/tutorial-build-video-conference-application-webrtc-2/).
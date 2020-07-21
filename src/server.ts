import express, { Application } from "express";
import socketIO, { Server as SocketIOServer } from "socket.io";
import { createServer, Server as HTTPServer } from "http";
import path from "path";
import util from "util";

import crypto from "crypto";
import fs from "fs";

export interface IIceServer{
  urls?:string,
  credential?:string,
  username?:string
};

export interface IIceConfig{
  iceServers?:Array<IIceServer>
}

export class Server {

  private httpServer: HTTPServer;
  private app: Application;
  private io: SocketIOServer;

  private turnUser:string;
  private turnKey:string;
  private turnServer:string;
  private stunServer:string;

  private activeSockets: string[] = [];

  private readonly DEFAULT_PORT = 5000;

  constructor(stunServer:string, turnServer:string, user:string,key:string) {
    this.stunServer=stunServer;
    this.turnServer=turnServer;
    this.turnUser=user;
    this.turnKey=key;
    this.initialize();
  }

  private initialize(): void {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.io = socketIO(this.httpServer);

    this.configureApp();
    this.configureRoutes();
    this.handleSocketConnection();
  }

  private configureApp(): void {
    this.app.use(express.static(path.join(__dirname, "../public")));
  }


  private getTURNCredentials(name:string, secret:string):{username:string,password:string}{    
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

  private configureRoutes(): void {
    this.app.get("/", (req, res) => {
      res.sendFile("index.html");
    });
    this.app.get("/js/index.js", (req,res)=>{
      let data=fs.readFileSync('js/index.js');
      if(data){
        var ice_config:IIceConfig={};
        if(this.turnServer){          
          ice_config.iceServers=[];

          var iceServer:IIceServer={urls:this.turnServer};
          if(this.turnUser){
            var credentials= this.getTURNCredentials(this.turnUser, this.turnKey);
            iceServer.username=credentials.username;
            iceServer.credential=credentials.password;            
          }
          ice_config.iceServers.push(iceServer);
        }

        if(this.stunServer){
          if(ice_config.iceServers==null){
            ice_config.iceServers=[];
          }
          var iceServer:IIceServer={urls:this.stunServer};
          ice_config.iceServers.push(iceServer);
        }
        var script:string = data.toString().replace('{{ice_config}}', util.inspect(ice_config) );
        res.setHeader("Content-Type","text/javascript");
        res.send(script);
      }

    })
  }

  private handleSocketConnection(): void {
    this.io.on("connection", socket => {
      const existingSocket = this.activeSockets.find(
        existingSocket => existingSocket === socket.id
      );

      if (!existingSocket) {
        this.activeSockets.push(socket.id);

        socket.emit("update-user-list", {
          users: this.activeSockets.filter(
            existingSocket => existingSocket !== socket.id
          )
        });

        socket.broadcast.emit("update-user-list", {
          users: [socket.id]
        });
      }

      socket.on("call-user", (data: any) => {
        socket.to(data.to).emit("call-made", {
          offer: data.offer,
          socket: socket.id
        });
      });

      socket.on("make-answer", data => {
        socket.to(data.to).emit("answer-made", {
          socket: socket.id,
          answer: data.answer
        });
      });

      socket.on("reject-call", data => {
        socket.to(data.from).emit("call-rejected", {
          socket: socket.id
        });
      });

      socket.on("disconnect", () => {
        this.activeSockets = this.activeSockets.filter(
          existingSocket => existingSocket !== socket.id
        );
        socket.broadcast.emit("remove-user", {
          socketId: socket.id
        });
      });
    });
  }

  public listen(callback: (port: number) => void): void {
    this.httpServer.listen(this.DEFAULT_PORT, () => {
      callback(this.DEFAULT_PORT);
    });
  }
}

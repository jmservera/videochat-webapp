import express, { Application } from "express";
import socketIO, { Server as SocketIOServer } from "socket.io";
import { createServer, Server as HTTPServer } from "http";
import path from "path";

import crypto from "crypto";
import fs from "fs";

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
      var credentials= this.getTURNCredentials(this.turnUser, this.turnKey);
      let data=fs.readFileSync('js/index.js');
      if(data){
        var script:string = data.toString().replace('{{turnServer}}',this.turnServer)
                       .replace('{{turnUser}}',credentials.username)
                       .replace('{{turnPassword}}',credentials.password)
                       .replace('{{stunServer}}', this.stunServer);
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

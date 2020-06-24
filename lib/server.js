"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var socket_io_1 = __importDefault(require("socket.io"));
var http_1 = require("http");
var path_1 = __importDefault(require("path"));
var crypto_1 = __importDefault(require("crypto"));
var fs_1 = __importDefault(require("fs"));
var Server = /** @class */ (function () {
    function Server(server, user, key) {
        this.activeSockets = [];
        this.DEFAULT_PORT = 5000;
        this.turnServer = server;
        this.turnUser = user;
        this.turnKey = key;
        this.initialize();
    }
    Server.prototype.initialize = function () {
        this.app = express_1.default();
        this.httpServer = http_1.createServer(this.app);
        this.io = socket_io_1.default(this.httpServer);
        this.configureApp();
        this.configureRoutes();
        this.handleSocketConnection();
    };
    Server.prototype.configureApp = function () {
        this.app.use(express_1.default.static(path_1.default.join(__dirname, "../public")));
    };
    Server.prototype.getTURNCredentials = function (name, secret) {
        var unixTimeStamp = Math.round(Date.now() / 1000) + 24 * 3600, // this credential would be valid for the next 24 hours
        username = [unixTimeStamp, name].join(':'), password, hmac = crypto_1.default.createHmac('sha1', secret);
        hmac.setEncoding('base64');
        hmac.write(username);
        hmac.end();
        password = hmac.read();
        return {
            username: username,
            password: password
        };
    };
    Server.prototype.configureRoutes = function () {
        var _this = this;
        this.app.get("/", function (req, res) {
            res.sendFile("index.html");
        });
        this.app.get("/js/index.js", function (req, res) {
            var userpwd = _this.getTURNCredentials(_this.turnUser, _this.turnKey);
            var data = fs_1.default.readFileSync('js/index.js');
            if (data) {
                var script = data.toString().replace('{{turnServer}}', _this.turnServer)
                    .replace('{{turnUser}}', userpwd.username)
                    .replace('{{turnPassword}}', userpwd.password);
                res.send(script);
            }
        });
    };
    Server.prototype.handleSocketConnection = function () {
        var _this = this;
        this.io.on("connection", function (socket) {
            var existingSocket = _this.activeSockets.find(function (existingSocket) { return existingSocket === socket.id; });
            if (!existingSocket) {
                _this.activeSockets.push(socket.id);
                socket.emit("update-user-list", {
                    users: _this.activeSockets.filter(function (existingSocket) { return existingSocket !== socket.id; })
                });
                socket.broadcast.emit("update-user-list", {
                    users: [socket.id]
                });
            }
            socket.on("call-user", function (data) {
                socket.to(data.to).emit("call-made", {
                    offer: data.offer,
                    socket: socket.id
                });
            });
            socket.on("make-answer", function (data) {
                socket.to(data.to).emit("answer-made", {
                    socket: socket.id,
                    answer: data.answer
                });
            });
            socket.on("reject-call", function (data) {
                socket.to(data.from).emit("call-rejected", {
                    socket: socket.id
                });
            });
            socket.on("disconnect", function () {
                _this.activeSockets = _this.activeSockets.filter(function (existingSocket) { return existingSocket !== socket.id; });
                socket.broadcast.emit("remove-user", {
                    socketId: socket.id
                });
            });
        });
    };
    Server.prototype.listen = function (callback) {
        var _this = this;
        this.httpServer.listen(this.DEFAULT_PORT, function () {
            callback(_this.DEFAULT_PORT);
        });
    };
    return Server;
}());
exports.Server = Server;

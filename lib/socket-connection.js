"use strict";
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
});

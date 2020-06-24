"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var server_1 = require("./server");
var dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
var turnServer = process.env.TURNSERVER ? process.env.TURNSERVER : "";
var turnUser = process.env.TURNUSER ? process.env.TURNUSER : "";
var turnKey = process.env.TURNKEY ? process.env.TURNKEY : "";
var server = new server_1.Server(turnServer, turnUser, turnKey);
server.listen(function (port) {
    console.log("Server is listening on http://localhost:" + port);
});

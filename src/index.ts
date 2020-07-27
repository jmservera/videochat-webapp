import { Server } from "./server";
import dotenv from "dotenv";
dotenv.config();

const stunServer: string = process.env.STUNSERVER ? process.env.STUNSERVER : "";
const turnServer: string = process.env.TURNSERVER ? process.env.TURNSERVER : "";
const turnUser: string = process.env.TURNUSER ? process.env.TURNUSER : "";
const turnKey: string = process.env.TURNKEY ? process.env.TURNKEY : "";
const port: number = process.env.PORT ? parseInt(process.env.PORT) : Server.DEFAULT_PORT;

const server = new Server(stunServer, turnServer, turnUser, turnKey);

server.listen(port, port => {
    console.log(`Server is listening on http://localhost:${port}`);
});
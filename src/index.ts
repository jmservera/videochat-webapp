import { Server } from "./server";
import dotenv from "dotenv";
dotenv.config();

const turnServer:string = process.env.TURNSERVER?process.env.TURNSERVER:"";
const turnUser:string = process.env.TURNUSER?process.env.TURNUSER:"";
const turnKey:string = process.env.TURNKEY?process.env.TURNKEY:"";

const server = new Server(turnServer, turnUser, turnKey);
 
server.listen(port => {
 console.log(`Server is listening on http://localhost:${port}`);
});
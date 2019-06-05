//this api will handle the sockets and connections on the DrawRoom components
const app = require("express")();
const http = require("http").Server(app);
const io = require("socket.io")(http);
import { json, urlencoded } from "body-parser";
import cors from "cors";

import setCurrentUser from "../../client/src/actions/authorisationActions";

//Set the app to use the imported components for package handling
app.use(cors());
app.use(json());
app.use(urlencoded({extended:false}));

app.post('/drawRoom', (req,res)=> {
    const sessionKey = setCurrentUser();
    activeUsers[sessionKey] = new ActiveUser(req.body.userName);
    res.json({success: true, sessionKey});
});

const activeUsers = {};



class ActiveUser {
    //State values of an Active Drawer
    constructor(userName){
        this._userName = userName;
        this._mouseX =0;
        this._mouseY =0;
        this._timer = 10;
    }
    //Get functions for Users values
    getName() {
        return this.userName;
    }
    getMouseX() { 
        return this._mouseX;
    }
    getMouseY() {
        return this._mouseY;
    }
    setMouseX(x) {
        this._mouseX = x;
    }
    setMouseY(y) {
        this._mouseY = y;
    }
    resetTimer() {
      this._timer = 10;
    }
    decrementTimer() {
      this._timer -= 1;
    }
    getTimer() {
      return this._timer;
    }
  };



  //Start the Socket connection which will push and emit all ActiveUsers Positions to other users
  io.on("connection", socket => {
      setInterval(() => {
         const userKeys = Object.keys(activeUsers);
         const cursorPositions = [];
         //Loop and update cursorPositions for each User
         for(let i =0, n = userKeys.length; i < n; i ++){
            const key = userKeys[i];
            const user = activeUsers[key];
            cursorPositions.push({
                x: user.getMouseX(),
                y: user.getMouseY(),
                userName: user.getName(),
                key: user.getName()
            });
         }
         //Emit - send the cursor positions to all other clients connected
         socket.emit("cursor", cursorPositions);
      }, Math.round(1000/30));

      io.on("line", data => {
          const user = activeUsers[data.sessionKey];
          user.resetTimer();
          user.setMouseX(data.x);
          user.setMouseY(data.y);
      });
      //Sending the line they are currently drawing to all other users
      io.on("line", data => {
          const user = activeUsers[data.sessionKey];
          const lineCoordinates = data.lineCoordinates;
          io.emit("line", {
              lineWidth: data.lineWidth,
              lineColour: data.lineColour,
              lineCoordinates
          });
      });
  });

  http.listen(8080, () => {
      console.log("Listening on Port 8080");
      //Initialise the server
  });
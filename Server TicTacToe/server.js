const { createServer } = require("http");
const { Server } = require("socket.io");

const httpServer =createServer();
const io=new Server(httpServer, {
    cors:"http://localhost:5173/"
});

const allUsers={};
const allRooms=[];

io.on("connection", (socket)=>{

    allUsers[socket.id]={
        socket:socket,
        online:true
    }

    socket.on("request_to_play",(data)=>{
        const currUser=allUsers[socket.id];
        currUser.playerName=data.playerName;

        let opponentPlayer;

        for(const key in allUsers){
            const user =allUsers[key];
            if(user.online && !user.playing && socket.id!== key){
                opponentPlayer=user;
                break;
            }
        }
        if(opponentPlayer){

            allRooms.push({
                player1:opponentPlayer,
                player2:currUser
            });

            opponentPlayer.socket.emit("OpponentFound",{
                opponent:currUser.playerName,
                playingAs: "cross"
            });

            currUser.socket.emit("OpponentFound",{
                opponent:opponentPlayer.playerName,
                playingAs:"circle"
            });

            currUser.socket.on("playerMoveFromClient",(data)=>{
                opponentPlayer.socket.emit("playerMoveFromServer",{
                    ...data,
                });
            });

            opponentPlayer.socket.on("playerMoveFromClient",(data)=>{
                currUser.socket.emit("playerMoveFromServer",{
                    ...data,
                });
            });

        }
        else{
            currUser.socket.emit("OpponentNotFound");
        }

    })

    socket.on("disconnect", ()=>{
        const currUser=allUsers[socket.id];
        currUser.online=false;
        currUser.playing=false;

        for(let index=0;index<allRooms.length;index++){
            const { player1, player2 }=allRooms[index];

            if(player1.socket.id=== socket.id){
                player2.socket.emit("opponentLeftMatch");
                break;
            }

            if(player2.socket.id === socket.id){
                player1.socket.emit("opponentLeftMatch");
                break;
            }
        }
    })
})

httpServer.listen(3000)
import { useState ,useEffect} from 'react'
import './App.css'
import io from "socket.io-client"
import Swal from 'sweetalert2'
import Square from './Square/Square'

const renderFrom =[
  [1,2,3],
  [4,5,6],
  [7,8,9]
]

function App() {

  const [gameState,setGameState] =useState(renderFrom);
  const [currPlayer,setCurrPlayer] = useState('cross');
  const [finished,setFinished] = useState(false);
  const [finishedArrayState,setFinishedArrayState] = useState([]);
  const [playOnline,setPlayOnline] = useState(false);
  const [socket,setSocket] = useState(null);
  const [playerName,setPlayerName] = useState('');
  const [opponent,setOpponent] = useState(null);
  const [playingAs,setPlayingAs] = useState(null);

  const checkWinner = () => {
    for(let row =0;row<3;row++){
      if(gameState[row][0]===gameState[row][1] &&
        gameState[row][1]===gameState[row][2]){

          setFinishedArrayState([row*3+0, row*3+1, row*3+2]);
          return gameState[row][0];
        }
    }

    // column dynamically
    for(let col =0;col<3;col++){
      if(gameState[0][col]===gameState[1][col] &&
        gameState[1][col]===gameState[2][col]){
          setFinishedArrayState([0*3+col, 1*3+col, 2*3+col]);
          return gameState[0][col];
        }
    }

    // diagonal
    if(gameState[0][0]===gameState[1][1] &&
      gameState[1][1]===gameState[2][2]){
        setFinishedArrayState([0, 4, 8]);
        return gameState[0][0];
      }
    if(gameState[0][2]===gameState[1][1] &&
      gameState[1][1]===gameState[2][0]){
        setFinishedArrayState([2, 4, 6]);
        return gameState[0][2];
      }

      const isDrawMatch = gameState.flat().every((e)=>{
        if(e === 'circle' || e === 'cross'){
          return true;
        }
      });

      if(isDrawMatch){
        return 'draw';
      }
    return null;
  }

  useEffect(()=>{
    const winner = checkWinner();
    if(winner){
      setFinished(winner);
    }
  },[gameState])

  const takePlayerName = async()=>{
    const result=await Swal.fire({
      title: "Enter your name",
      input: "text",
      inputLabel: "Your name",
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) {
          return "You need to write something!";
        }
      }
    });
    return result;
  }

  socket?.on("opponentLeftMatch",()=>{
    alert("Opponent Left the Match")
    setFinished('opponentLeftMatch')
  });

  socket?.on("playerMoveFromServer",(data)=>{
    const id=data.state.id;
    setGameState((prev)=>{
      let newState=[...prev];
      const rowIndex=Math.floor(id/3);
      const colIndex=id%3;

      newState[rowIndex][colIndex]=data.state.sign;
      return newState;
    })
    setCurrPlayer(data.state.sign === 'circle'?'cross':'circle');
  });

  socket?.on("connect",function(){
    setPlayOnline(true);

  });

  socket?.on("OpponentNotFound",function(){
    setOpponent(false);

  });
  socket?.on("OpponentFound",function(data){
    setPlayingAs(data.playingAs);
    setOpponent(data.opponent);

  });

  

  async function playOnlineClick(){

    const result=await takePlayerName();

    if(!result.isConfirmed){
      return;
    }
    
    const username =result.value;
    setPlayerName(username);
    
    const newSocket = io("http://localhost:3000", {
      autoConnect: true,
    });

    newSocket?.emit("request_to_play",{
      playerName:username,
    });

    setSocket(newSocket);
    
  }
  if(!playOnline){
    return <div className='main-div'>
      <button onClick={playOnlineClick} className='play-online'>Play Online</button>
    </div>
  }

  if(playOnline && !opponent){
    return (
    <div className='waiting'>
      <p>Waiting for Opponent...</p>
    </div>)
  }
  return (
    <div className='main-div'>
      <div className="move-detection">
          <div className={`left ${currPlayer === playingAs ? 'current-move-'+ currPlayer : ''}`}>{playerName}</div>
          <div className={`right ${currPlayer !== playingAs ? 'current-move-'+ currPlayer : ''}`}>{opponent}</div>
      </div>

      <div>
        <h1 className='game-heading water-background'>Tic Tac Toe</h1>
        <div className="square-wrapper">
          {
            gameState.map((arr,rowIndex) =>
              arr.map((e,colIndex)=>{
                return <Square
                playingAs={playingAs}
                socket={socket}
                gameState={gameState}
                setGameState={setGameState} 
                currPlayer={currPlayer}
                setCurrPlayer={setCurrPlayer}
                id={rowIndex*3+colIndex} 
                key={rowIndex*3+colIndex}
                finished={finished}
                finishedArrayState={finishedArrayState}
                currentElement={e}/>
              })
            )
          }
        </div>

        {finished && finished !== 'opponentLeftMatch' && finished ==='draw' && (<h3 className='finished-state'>Match Drawn</h3>)}

        {finished && finished !== 'opponentLeftMatch' && finished !=='draw' && (<h3 className='finished-state'><span className='color'>{finished}</span> Won the Game</h3>)}
      </div>
        {!finished && opponent && (<h2 className='black'>You are playing against {opponent}</h2>)}

        {!finished && finished === 'opponentLeftMatch' && (<h2 className='black'>Opponent Left The Match</h2>)}
    </div>
  )
}

export default App

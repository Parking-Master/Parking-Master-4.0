const app = require("express")();
const http = require("http");
const { Server } = require("socket.io");

function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    let r = Math.random() * 16 | 0;
    let v = (c == "x" ? r : (r & 0x3 | 0x8));
    return v.toString(16);
  });
}

let players = {};

app.use(function(req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT");
  res.setHeader("Access-Control-Allow-Headers", "X-Requested-With,content-type,ngrok-skip-browser-warning");
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Content-Security-Policy", `frame-ancestors *`);
  next();
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  let uuid = null;
  if (socket.handshake.auth.uuid) {
    uuid = socket.handshake.auth.uuid;
  } else {
    uuid = uuidv4();
  }
  console.log(uuid)

  let entry = {
    car: {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      speedMS: 0,
      heading: 0,
      braking: false
    }
  };

  players[uuid] = entry;

  socket.on("updatePlayer", (newEntry) => {
    players[uuid] = newEntry;
    io.emit("updateAllPlayers", JSON.stringify(players));
  });

  socket.emit("playerInit", uuid);

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

server.listen(3000);
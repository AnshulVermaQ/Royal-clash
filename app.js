const express = require("express");
const app = express();
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");

const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();
const port = process.env.PORT || 4000;

let players = { white: null, black: null };

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.render("index", { title: "Chess Game" });
});

io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    if (!players.white) {
        players.white = socket.id;
        socket.emit("playerRole", "w");
    } else if (!players.black) {
        players.black = socket.id;
        socket.emit("playerRole", "b");
    } else {
        socket.emit("spectatorRole");
    }

    // Send the current board state to the new connection
    socket.emit("boardState", chess.fen());

    socket.on("disconnect", () => {
        console.log("A user disconnected:", socket.id);
        if (socket.id === players.white) {
            players.white = null;
        } else if (socket.id === players.black) {
            players.black = null;
        }
        io.emit("playerDisconnected", socket.id);
    });

    socket.on("move", (move) => {
        if ((chess.turn() === "w" && socket.id !== players.white) ||
            (chess.turn() === "b" && socket.id !== players.black)) {
            return;
        }

        const result = chess.move(move);
        if (result) {
            io.emit("move", move);
            io.emit("boardState", chess.fen());
        } else {
            socket.emit("invalidMove", move);
        }
    });
});

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

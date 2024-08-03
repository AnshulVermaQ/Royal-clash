const socket = io();
const chess = new Chess();
const boardElement = document.querySelector("#chessBoard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = "";
    board.forEach((row, rowIndex) => {
        row.forEach((square, squareIndex) => {
            const squareElement = document.createElement("div");
            squareElement.classList.add(
                "square",
                (rowIndex + squareIndex) % 2 == 0 ? "light" : "dark"
            );
            squareElement.dataset.row = rowIndex;
            squareElement.dataset.col = squareIndex;

            if (square) {
                const pieceElement = document.createElement("div");
                pieceElement.classList.add(
                    "piece",
                    square.color === "w" ? "white" : "black"
                );
                pieceElement.innerText = getUnicode(square);
                pieceElement.draggable = playerRole === square.color;
                pieceElement.addEventListener("dragstart", (e) => {
                    if (pieceElement.draggable) {
                        draggedPiece = pieceElement;
                        sourceSquare = { row: rowIndex, col: squareIndex };
                        e.dataTransfer.setData("text/plain", "");
                    }
                });
                pieceElement.addEventListener("dragend", () => {
                    draggedPiece = null;
                    sourceSquare = null;
                });
                squareElement.appendChild(pieceElement);
            }

            squareElement.addEventListener("dragover", function (e) {
                e.preventDefault();
            });

            squareElement.addEventListener("drop", function () {
                if (draggedPiece) {
                    const targetSquare = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col),
                    };
                    handleMove(sourceSquare, targetSquare);
                }
            });

            boardElement.appendChild(squareElement);
        });
    });
};

const handleMove = (sourceSquare, targetSquare) => {
    const source = `${String.fromCharCode(97 + sourceSquare.col)}${8 - sourceSquare.row}`;
    const target = `${String.fromCharCode(97 + targetSquare.col)}${8 - targetSquare.row}`;

    const move = chess.move({
        from: source,
        to: target,
        promotion: "q" // Promote to queen if a pawn reaches the 8th rank
    });

    if (move) {
        renderBoard();
        socket.emit("move", move);
    } else {
        console.log("Invalid move");
    }
};

const getUnicode = (piece) => {
    const unicodeMap = {
        w: {
            k: "♔",
            q: "♕",
            r: "♖",
            b: "♗",
            n: "♘",
            p: "♙"
        },
        b: {
            k: "♚",
            q: "♛",
            r: "♜",
            b: "♝",
            n: "♞",
            p: "♟"
        }
    };
    return unicodeMap[piece.color][piece.type];
};

renderBoard();

socket.on("boardState", (fen) => {
    chess.load(fen);
    renderBoard();
});

socket.on("playerRole", (role) => {
    playerRole = role;
    console.log(`You are player ${role}`);
    // Flip the board for black player
    if (role === "b") {
        boardElement.classList.add("flipped");
    }
});

socket.on("spectatorRole", () => {
    playerRole = null;
    console.log("You are a spectator");
});

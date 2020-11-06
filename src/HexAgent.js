const Agent = require('ai-agents').Agent;
const getEmptyHex = require('./getEmptyHex');
const minMax = require('./minMax');

class HexAgent extends Agent {
    constructor(value) {
        super(value);
    }
    
    /**
     * return a new move. The move is an array of two integers, representing the
     * row and column number of the hex to play. If the given movement is not valid,
     * the Hex controller will perform a random valid movement for the player
     * Example: [1, 1]
     */
    send() {
        let board = this.perception;
        let size = board.length;
        let available = getEmptyHex(board);
        let nTurn = size * size - available.length;

        if (nTurn == 0) { // First move
            return [Math.floor(size / 2) - 1, Math.floor(size / 2) + 1 ];
        }
        const MAX = Number.MAX_SAFE_INTEGER;

        return minMax(board, this.getID(), this.getID(), 0, 2, -MAX, MAX, {}, null).move;
    }
}

module.exports = HexAgent;

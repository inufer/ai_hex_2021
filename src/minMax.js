const transpose = require('./transposeHex');
const boardScore = require('./boardScore');
const getEmptyHex = require('./getEmptyHex');

 let counter = 0;

 /**
 * Return the best move for the player 1. Before calling this function you must
 * transpose the player board, so we always consider that the player is connecting
 * the left and the right sides of the board.
 * @param {*} board 
 * @param {*} player0 
 * @param {*} player 
 * @param {*} level 
 * @param {*} maxLevel 
 * @param {*} alpha 
 * @param {*} beta 
 * @param {*} cache 
 */
function minMax(board, player0, player, level, maxLevel, alpha, beta, cache, available) {
  const MAX_SCORE = board.length * board.length;
  const MIN_SCORE = -MAX_SCORE;

  if (available == null)
    available = getCandidates(board); //getEmptyHex(board);
  let bestScore = Number.MIN_SAFE_INTEGER;
  if (level % 2 == 1) {
    bestScore = Number.MAX_SAFE_INTEGER;
  }
  let bestMove = [];
  let maxActions = available.length;
  for (let i = 0; i < maxActions; i++) {
    if (available[i] >= 0) {
      let move = available[i];
      let action = [Math.floor(move / board.length), move % board.length];
      available[i] = -1;
      board[action[0]][action[1]] = player;
      let score = 0;

       // Chech if we already have a score for this board
      let cacheKey = getHash(board);
      if (cache[cacheKey]) {
        score = cache[cacheKey];
      } else {
        score = boardScore(board, player0);
        if (!(level === maxLevel ||
          score === MIN_SCORE||
          score === MAX_SCORE)) {
          let nextPlayer = player === '1' ? '2' : '1';
          score = minMax(board, player0, nextPlayer, level + 1, maxLevel, alpha, beta, cache, available).score;
        }
        // Cache this score
        cache[cacheKey] = score;
      }

       board[action[0]][action[1]] = 0;

       if (level % 2 == 1) {
        if (score < bestScore) {
          bestScore = score;
          bestMove = action;
          if (score < beta)
            beta = score;
        }
      } else {
        if (score > bestScore) {
          bestScore = score;
          bestMove = action;
          if (score > alpha)
            alpha = score;
        }
      }
      available[i] = move;
      // Alpha beta prune
      if (alpha >= beta) {
        break;
      }
    }
  }
  // console.log(counter);
  return { score: bestScore, move: bestMove };
}

 module.exports = minMax;

 function getHash(board) {
  let hash = '';
  board.forEach(row => {
    row.forEach(cell => {
      hash += cell;
    });
  });
  return hash;
}

 /**
 * Get the candidates hex to be evaluated by the minMax. Not all the empty hex are really 
 * interesting. We will consider only the neighbours of the occupied hex at max distance of 2 
 * @param {} board 
 */
function getCandidates(board) {
  let size = board.length;
  let boardT = new Array(size);
  for (let i = 0; i < size; i++) {
    boardT[i] = board[i].slice();
  }

   for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (boardT[i][j] === '1' || boardT[i][j] === '2') {
        markAdyacentCells(boardT, i, j, 1);
      } else if (boardT[i][j] === 1) {
        markAdyacentCells(boardT, i, j, 2);
      }
    }
  }

   let candidates = [];
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (boardT[i][j] === 1 || boardT[i][j] === 2) {
        candidates.push(i * size + j);
      }
    }
  }
  return candidates;
}

 /**
 * Change the adyacent cells by the current value if they are empty
 * @param {} board 
 * @param {*} row 
 * @param {*} col 
 * @param {*} value 
 */
function markAdyacentCells(board, row, col, value) {
  changeIfNeeded(board, row - 1, col, value);
  changeIfNeeded(board, row - 1, col + 1, value);
  changeIfNeeded(board, row, col + 1, value);
  changeIfNeeded(board, row, col - 1, value);
  changeIfNeeded(board, row + 1, col, value);
  changeIfNeeded(board, row + 1, col - 1, value);
  changeIfNeeded(board, row + 1, col + 1, value);
  changeIfNeeded(board, row - 1, col - 1, value);
}

 /**
 * Change the current hex if it is valid and empty
 * @param {} board 
 * @param {*} row 
 * @param {*} col 
 * @param {*} value 
 */
function changeIfNeeded(board, row, col, value) {
  let size = board.length;
  if (row >= 0 && row < size && col >= 0 && col < size) {
    if (board[row][col] === 0) {
      board[row][col] = value;
    }
  }
}

 /*
let board = [[0, 0, 0],
[0, 0, 0],
['1', 0, 0]];
console.log(minMax(board, '2', '2', 0, 2, Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, {}));  
// Debe dar 3 - 1 = 2 */

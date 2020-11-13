require=(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({"/src/HexAgent.js":[function(require,module,exports){
const Agent = require('ai-agents').Agent;

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
            return getFirstMove(board);
        } else if (nTurn == 1) {
            return getSecondMove(board);
        }

        const MAX = Number.MAX_SAFE_INTEGER;
        const MIN = -MAX;

        if (nTurn % 2 != 0){
            let move = minimax(board, 3, MIN, MAX, true, {} , '', 2);
            move = move.move;
            return [Math.floor(move / board.length), move % board.length];
        } else {
            let move = minimax(board, 3, MIN, MAX, true, {} , '',1);
            move = move.move;
            return [Math.floor(move / board.length), move % board.length];
        }
    }
}

module.exports = HexAgent;
/**
 * Transpose and convert the board game to a player 1 logic
 * @param {Array} board
 */
function transpose(board) {
    let size = board.length;
    let boardT = new Array(size);
    for (let j = 0; j < size; j++) {
        boardT[j] = new Array(size);
        for (let i = 0; i < size; i++) {
            boardT[j][i] = board[i][j];
            if (boardT[j][i] === '1') {
                boardT[j][i] = '2';
            } else if (boardT[j][i] === '2') {
                boardT[j][i] = '1';
            }
        }
    }
    return boardT;
}


/**
 * playerId = 1 -> RED LEFT/RIGHT
 * playerId = 2 -> BLUE TOP/DOWN
 *
 * The board is by default laid out as follows
 *                T[-1]
 0:         [0, 0, 0, 0, 0, 0, 0]
 1:         [0, 0, 0, 0, 0, 0, 0]
 2:         [0, 0, 0, 0, 0, 0, 0]
 3: L[-1]   [0, 0, 0, 0, 0, 0, 0]  R[49]
 4:         [0, 0, 0, 0, 0, 0, 0]
 5:         [0, 0, 0, 0, 0, 0, 0]
 6:         [0, 0, 0, 0, 0, 0, 0]
                  D[49]

    And numbered as follows:
        0,  1,  2,  3,  4,  5,  6,
        7,  8,  9, 10, 11, 12, 13,
       14, 15, 16, 17, 18, 19, 20,
       21, 22, 23, 24, 25, 26, 27,
       28, 29, 30, 31, 32, 33, 34,
       35, 36, 37, 38, 39, 40, 41,
       42, 43, 44, 45, 46, 47, 48
 */

class Node {
    constructor(value, indexNumber, parent, pathLengthFromStart, pathVerticesFromStart) {
        this.value = value;
        this.indexNumber = indexNumber;
        this.parent = parent;
        this.pathLengthFromStart = pathLengthFromStart;
        this.pathVerticesFromStart = pathVerticesFromStart;
    }
}

function getFirstMove(board){
    let size = board.length;
    let moves = []
    moves.push([Math.floor(size / 2) + 1, Math.floor(size / 2) - 1])
    moves.push([Math.floor(size / 2) - 1, Math.floor(size / 2) + 1])
    moves.push([Math.floor(size / 2) - 1 , Math.floor(size / 2)])
    moves.push([Math.floor(size / 2) + 1 , Math.floor(size / 2)])
    return moves[Math.floor(Math.random() *  Math.floor(moves.length))]
}

function getSecondMove(board){
    let player1_square_row = 0
    let player1_square_col = 0
    let size = board.length;
    for (let k = 0; k < size; k++) {
        for (let j = 0; j < size; j++) {
            if (board[k][j] === '1') {
                player1_square_row = k;
                player1_square_col = j;
                break;
            }
        }
    }
    if(player1_square_col == Math.floor(size / 2) && player1_square_row == Math.floor(size / 2) - 1){
        return [Math.floor(size / 2)-1, Math.floor(size / 2) + 1]
    }else if(player1_square_col == Math.floor(size / 2)  && player1_square_row == Math.floor(size / 2) + 1){
        return [Math.floor(size / 2)+1, Math.floor(size / 2)-1]
    } else {
        return [Math.floor(size / 2), Math.floor(size / 2)]
    }
}

/**
 * Return an array containing the id of the empty hex in the board
 * id = row * size + col;
 * @param {Matrix} board
 */
function getEmptyHex(board) {
    let result = [];
    let size = board.length;
    for (let k = 0; k < size; k++) {
        for (let j = 0; j < size; j++) {
            if (board[k][j] === 0) {
                result.push(k * size + j);
            }
        }
    }
    return result;
}

function getIndexRow(index, board){
    let size = board.length;
    return Math.floor(index / size);
}

function getIndexCol(index, board){
    let size = board.length;
    return index % size;
}

function buildHexGraph(board, playerId) {
    let result = [];
    let size = board.length;

    if(playerId == 1){
        result.push(new Node("1",'L','', 0,[] ))
    } else if(playerId == 2){
        result.push(new Node("2",'T','', 0,[] ))
    }

    for (let k = 0; k < size; k++) {
        for (let j = 0; j < size; j++) {

            result.push(new Node(board[k][j],
                      k * size + j,
                           '',
                                  Number.MAX_SAFE_INTEGER-1,
                 [] ));
        }
    }

    if(playerId == 1){
        result.push(new Node("1",'R','', Number.MAX_SAFE_INTEGER-1,[] ))
    } else if (playerId == 2){
        result.push(new Node("2",'D','', Number.MAX_SAFE_INTEGER-1,[] ))
    }
    return result;
}

function minPathLengthFromStartNode(nodeList){
    let min = Number.MAX_SAFE_INTEGER
    let sol_idx = ''
    for(let i = 0; i < nodeList.length; i++){
        if(nodeList[i].pathLengthFromStart < min){
            min = nodeList[i].pathLengthFromStart
            sol_idx = i
        }
    }

    return sol_idx
}

/**
 * After splicing the currentVertices list on djikstra, the original
 * ordering of the indexes will be lost. This function is used
 * to get the actual index corresponding to a node in that scenario
 *
 * @param nodeList
 * @param idxToSearch
 * @returns {string|number}
 */
function getCurrentIdx(nodeList, idxToSearch){
    let sol_idx = 'error'
    for(let i = 0; i < nodeList.length; i++){
        if(nodeList[i].indexNumber == idxToSearch){
            return i
        }
    }

    return sol_idx
}


/**
 * Returns a list of neighbors that haven't been visited yet and aren't occupied by the other player
 */
function filterNeighbors(node, nodeList, board, playerId, currentVertices){
    let sol_list = []
    if(playerId == 1){
        for(let i = 0; i < nodeList.length; i++) {
            let isGoal = nodeList[i] == 'L' || nodeList[i] == 'R'
            if (!node.pathVerticesFromStart.includes(nodeList[i]) &&
                isGoal){
                if(getCurrentIdx(currentVertices, nodeList[i]) != 'error'){
                    sol_list.push(nodeList[i])
                }
            } else {
                let row = getIndexRow(nodeList[i], board)
                let col = getIndexCol(nodeList[i], board)
                if (!node.pathVerticesFromStart.includes(nodeList[i]) &&
                    board[row][col] != 2 &&
                    getCurrentIdx(currentVertices, nodeList[i]) != 'error') {
                    sol_list.push(nodeList[i])
                }
            }
        }
    } else {
        for(let i = 0; i < nodeList.length; i++){
            let isGoal = nodeList[i] == 'T' || nodeList[i] == 'D'
            if (!node.pathVerticesFromStart.includes(nodeList[i]) &&
                isGoal){
                if(getCurrentIdx(currentVertices, nodeList[i]) != 'error'){
                    sol_list.push(nodeList[i])
                }
            } else {
                let row = getIndexRow(nodeList[i], board)
                let col = getIndexCol(nodeList[i], board)

                if(!node.pathVerticesFromStart.includes(nodeList[i]) &&
                    board[row][col] != 1 &&
                    getCurrentIdx(currentVertices, nodeList[i]) != 'error'){
                    sol_list.push(nodeList[i])
                }
            }
        }
    }
    return sol_list
}

/**
 * Return an array of the neighbors of the currentHex that belongs to the same player. The
 * array contains the id of the hex. id = row * size + col
 * @param {Number} currentHex
 * @param {Number} player
 * @param {Matrix} board
*/


function getNeighborhood(currentHex, playerId, board) {
    let size = board.length;
    let row = Math.floor(currentHex / size);
    let col = currentHex % size;
    let result = [];

    if(currentHex == 'L'){
        for(let i = 0; i < size; i++){
            result.push( i  * size)
        }
    }

    if(currentHex == 'R'){
        for(let i = 0; i < size; i++){
            result.push( size-1 + (i  * size))
        }
    }

    if(currentHex == 'T'){
        for(let i = 0; i < size; i++){
            result.push( i )
        }
    }
    if(currentHex == 'D'){
        for(let i = 0; i < size; i++){
            result.push( i + (size * (size-1)) )
        }
    }

    if(col == 0 && playerId == 1){ //playerId = 1 -> RED LEFT/RIGHT
        result.push('L')
    }

    if(col == size-1 && playerId == 1){
        result.push('R')
    }

    if(row == 0 && playerId == 2){ //playerId = 2 -> BLUE TOP/DOWN
        result.push('T')
    }

    if(row == size-1 && playerId == 2){
        result.push('D')
    }

    if (row > 0) { //UP
        result.push(col + (row - 1) * size);
    }

    if (row > 0 && col + 1 < size) { //UP RIGHT
        result.push(col + 1 + (row - 1) * size);
    }

    if (col > 0) { //LEFT
        result.push(col - 1 + row * size);
    }
    if (col + 1 < size) { // RIGHT
        result.push(col + 1 + row * size);
    }
    if (row + 1 < size ) { //DOWN
        result.push(col + (row + 1) * size);
    }
    if (row + 1 < size && col > 0) { //DOWN LEFT
        result.push(col - 1 + (row + 1) * size);
    }

    return result;
}


function djikstra(board, playerId, vertices){
    let currentVertices = vertices
    let originalBoardGraph = buildHexGraph(board, playerId)
    let startVertex = currentVertices[0]
    let res = []
    startVertex.pathVerticesFromStart.push(startVertex.indexNumber)
    let currentVertex = startVertex
    let idx_to_remove = 0
    let iters = 0;
    while (currentVertices.length > 0){
        iters++;
        currentVertices.splice(idx_to_remove, 1) //removes first node
        let notCheckedNeighbors = getNeighborhood(currentVertex.indexNumber, playerId, board)
        let checkedNeighbors = filterNeighbors(currentVertex, notCheckedNeighbors, board, playerId, currentVertices)

        for (let i = 0; i < checkedNeighbors.length; i++){
            let neighbor = ''
            if(checkedNeighbors[i] == 'R' || checkedNeighbors[i] == 'D'){
                neighbor = originalBoardGraph[50]
            } else {
                neighbor = currentVertices[getCurrentIdx(currentVertices, checkedNeighbors[i])]
            }
            let cost = neighbor.value == playerId ? 0.0 : 1.0
            let newCost = currentVertex.pathLengthFromStart + cost
            if (newCost < neighbor.pathLengthFromStart ){
                neighbor.pathVerticesFromStart = currentVertex.pathVerticesFromStart.slice()
                neighbor.pathVerticesFromStart.push(neighbor.indexNumber)
                let updatedNode = new Node(neighbor.value,
                                           neighbor.indexNumber,
                                           neighbor.parent,
                                           newCost,
                                           neighbor.pathVerticesFromStart)
                currentVertices[getCurrentIdx(currentVertices, neighbor.indexNumber)] = updatedNode
            }
        }

        res.push(currentVertex)
        if (currentVertex.indexNumber == 'R' || currentVertex.indexNumber == 'D'){
            break
        }

        if (currentVertices.length == 0){
            break
        } else{
            idx_to_remove = minPathLengthFromStartNode(currentVertices)
            currentVertex = currentVertices[idx_to_remove]
        }
    }
    return res
}

function getShortestPathLengthFromStart(djikstra_sol){
    return djikstra_sol.slice(-1)[0].pathLengthFromStart
}

function countPlayerSquares(board, playerIdx){
    let result = 0;
    let size = board.length;
    for (let k = 0; k < size; k++) {
        for (let j = 0; j < size; j++) {
            if (board[k][j] == playerIdx) {
                result++;
            }
        }
    }
    return result;
}

/**
 * Positive number  -> Red (1) is winnning
 * Negative number  -> Blue (2) is winning
 * @param board
 */
function getHeuristicValue(the_board, playerIdx){
    let player1_graph = buildHexGraph(the_board, 1)
    let test1 = djikstra(the_board, 1, player1_graph)
    let score_player1 = getShortestPathLengthFromStart(test1)

    let player2_graph = buildHexGraph(the_board, 2)
    let test2 = djikstra(the_board, 2, player2_graph)
    let score_player2 = getShortestPathLengthFromStart(test2)

    if((score_player1 == 0 && playerIdx == 1) || (score_player2 == 0 && playerIdx == 2)){
        let asd = 99999 - countPlayerSquares(the_board, 1)
        return asd;
    } else if(score_player2 == 0){
        return -99999 + countPlayerSquares(the_board, 1);
    }

    if(playerIdx == 1){
        return score_player2-score_player1
    } else if (playerIdx == 2) {
        return score_player1-score_player2
    }
}


/**
    position: the node where you want to run minimax from
    depth: How many depth levels ahead do you want to search
    maximizingPlayer: true/false depending on the turn of the player
*/
function minimax(board, depth, alpha, beta, maximizingPlayer, cache, tehMove, tehPlayer){
    if (depth == 0 || getHeuristicValue(board, tehPlayer) > 50){
        let test = getHeuristicValue(board, tehPlayer)
        return { score: test, move: tehMove}
    }

    let possibleMoves = getPossibleMoves(board);
    let bestMove = [];
    if(maximizingPlayer){
        let maxEval = -Number.MAX_SAFE_INTEGER;

        for(let i = 0; i < possibleMoves.length; i++){
            let evaluation = 0;
            let perception = [];
            if (tehPlayer == 1){
                perception = applyMoveToBoard(possibleMoves[i], 1, board)
            } else if (tehPlayer == 2) {
                perception = applyMoveToBoard(possibleMoves[i], 2, board)
            }
            evaluation = minimax(perception, depth - 1, alpha, beta, false, cache, possibleMoves[i], tehPlayer).score;

            if(evaluation > maxEval){
                bestMove = possibleMoves[i]
            }
            maxEval = Math.max(maxEval, evaluation);
            alpha = Math.max(alpha, evaluation)
            if (beta <= alpha){
                break;
            }
        }
        return { score: maxEval, move: bestMove };
    } else{
        let minEval = Number.MAX_SAFE_INTEGER;
        for(let i = 0; i < possibleMoves.length; i++) {
            let evaluation = 0;
            let perception = [];
            if (tehPlayer == 1){
                perception = applyMoveToBoard(possibleMoves[i], 2, board)
            } else if(tehPlayer == 2) {
                perception = applyMoveToBoard(possibleMoves[i], 1, board)
            }
            evaluation = minimax(perception, depth - 1, alpha, beta, true, cache, possibleMoves[i], tehPlayer).score;

            if(evaluation < minEval){
                bestMove = possibleMoves[i]
            }
            minEval = Math.min(minEval, evaluation);
            beta = Math.min(beta, evaluation)
            if(beta <= alpha){
                break;
            }
        }
        return { score: minEval, move: bestMove };
    }
}

function  getPossibleMoves(board){
    let sol = []
    let size = board.length;
    for (let k = 0; k < size; k++) {
        for (let j = 0; j < size; j++) {
            if (board[k][j] !== 0) {
               let neighbors = getPossibleMovesAux(k * size + j, board);
               for (let i = 0; i < neighbors.length; i++){
                   if(!sol.includes(neighbors[i])){
                       sol.push(neighbors[i])
                   }
               }
            }
        }
    }


    return sol;

}

function getPossibleMovesAux(currentHex, board) {
    let size = board.length;
    let row = Math.floor(currentHex / size);
    let col = currentHex % size;
    let result = [];

    if (row > 0 && board[row-1][col] === 0) { //UP
        result.push(col + (row - 1) * size);
    }

    if (row > 0 && col + 1 < size && board[row-1][col+1] === 0) { //UP RIGHT
        result.push(col + 1 + (row - 1) * size);
    }

    if (col > 0 && board[row][col-1]=== 0) { //LEFT
        result.push(col - 1 + row * size);
    }
    if (col + 1 < size && board[row][col+1] === 0) { // RIGHT
        result.push(col + 1 + row * size);
    }
    if (row + 1 < size && board[row+1][col] === 0) { //DOWN
        result.push(col + (row + 1) * size);
    }
    if (row + 1 < size && col > 0 && board[row+1][col-1] === 0) { //DOWN LEFT
        result.push(col - 1 + (row + 1) * size);
    }

    return result;
}

function applyMoveToBoard(move, playerId, board){
    let sol_board = [];
    let tmp = []
    for(let i = 0; i<board.length; i++){
        tmp = []
        for(let j = 0; j<board.length; j++){
            tmp.push(board[i][j])
        }
        sol_board.push(tmp)
    }

    let size = sol_board.length;
    let row = Math.floor(move / size);
    let col = move % size;

    sol_board[row][col] = playerId.toString()

    return sol_board
}

},{"ai-agents":4}],1:[function(require,module,exports){
//const tf = require('@tensorflow/tfjs-node');

class Agent {
    constructor(name) {
        this.id = name;
        if (!name) {
            this.id = Math.round(Math.random() * 10e8);
        }
        this.state = null;
        this.perception = null;
        this.table = { "default": 0 };
    }

    /**
     * Setup of the agent. Could be override by the class extension
     * @param {*} parameters
     */
    setup(initialState = {}) {
        this.initialState = initialState;
    }
    /**
     * Function that receive and store the perception of the world that is sent by the agent controller. This data is stored internally
     * in the this.perception variable
     * @param {Object} inputs
     */
    receive(inputs) {
        this.perception = inputs;
    }

    /**
     * Inform to the Agent controller about the action to perform
     */
    send() {
        return table["deafult"];
    }

    /**
     * Return the agent id
     */
    getLocalName() {
        return this.id;
    }

    /**
      * Return the agent id
      */
    getID() {
        return this.id;
    }

    /**
     * Do whatever you do when the agent is stoped. Close connections to databases, write files etc.
     */
    stop() {}
}

module.exports = Agent;
},{}],2:[function(require,module,exports){

class AgentController {
    constructor() {
        this.agents = {};
        this.world0 = null;
        this.world = null;
        this.actions = [];
        this.data = { states: [], world: {} };
    }
    /**
     * Setup the configuration for the agent controller
     * @param {Object} parameter
     */
    setup(parameter) {
        this.problem = parameter.problem;
        this.world0 = JSON.parse(JSON.stringify(parameter.world));
        this.data.world = JSON.parse(JSON.stringify(parameter.world));
    }
    /**
     * Register the given agent in the controller pool. The second parameter stand for the initial state of the agent
     * @param {Agent} agent
     * @param {Object} state0
     */
    register(agent, state0) {
        if (this.agents[agent.getID()]) {
            throw 'AgentIDAlreadyExists';
        } else {
            this.agents[agent.getID()] = agent;
            this.data.states[agent.getID()] = state0;
            //TODO conver state0 to an inmutable object
            agent.setup(state0);
        }
    }
    /**
     * Remove the given agent from the controller pool
     * @param {Object} input
     */
    unregister(input) {
        let id = "";
        if (typeof input == 'string') {
            id = input;
        } else if (typeof input == 'object') {
            id = input.getID();
        } else {
            throw 'InvalidAgentType';
        }
        let agent = this.agents[id];
        agent.stop();
        delete this.agents[id];
    }

    /**
    * This function start the virtual life. It will continously execute the actions
    * given by the agents in response to the perceptions. It stop when the solution function
    * is satisfied or when the max number of iterations is reached.
    * If it must to run in interactive mode, the start mode return this object, which is actually
    * the controller
    * @param {Array} callbacks
    */
    start(callbacks, interactive = false) {
        this.callbacks = callbacks;
        this.currentAgentIndex = 0;
        if (interactive === false) {
            this.loop();
            return null;
        } else {
            return this;
        }
    }

    /**
     * Executes the next iteration in the virtual life simulation
     */
    next() {
        if (!this.problem.goalTest(this.data)) {
            let keys = Object.keys(this.agents);
            let agent = this.agents[keys[this.currentAgentIndex]];
            agent.receive(this.problem.perceptionForAgent(this.getData(), agent.getID()));
            let action = agent.send();
            this.actions.push({ agentID: agent.getID(), action });
            this.problem.update(this.data, action, agent.getID());
            if (this.problem.goalTest(this.data)) {
                this.finishAll();
                return false;
            } else {
                if (this.callbacks.onTurn) {
                    this.callbacks.onTurn({ actions: this.getActions(), data: this.data });
                }
                if (this.currentAgentIndex >= keys.length - 1) this.currentAgentIndex = 0;else this.currentAgentIndex++;
                return true;
            }
        }
    }

    /**
     * Virtual life loop. At the end of every step it executed the onTurn call back. It could b used for animations of login
     */
    loop() {
        let stop = false;
        while (!stop) {
            //Creates a thread for every single agent
            Object.values(this.agents).forEach(agent => {
                if (!this.problem.goalTest(this.data)) {
                    agent.receive(this.problem.perceptionForAgent(this.getData(), agent.getID()));
                    let action = agent.send();
                    this.actions.push({ agentID: agent.getID(), action });
                    this.problem.update(this.data, action, agent.getID());
                    if (this.problem.goalTest(this.data)) {
                        stop = true;
                    } else {
                        if (this.callbacks.onTurn) this.callbacks.onTurn({ actions: this.getActions(), data: this.data });
                    }
                }
            });
        }
        this.finishAll();
    }

    /**
     * This function is executed once the virtual life loop is ended. It must stop every single agent in the pool
     * and execute the onFinish callback
     */
    finishAll() {
        // Stop all the agents
        Object.values(this.agents).forEach(agent => {
            //agent.stop();
            this.unregister(agent);
        });
        //Execute the callback
        if (this.callbacks.onFinish) this.callbacks.onFinish({ actions: this.getActions(), data: this.data });
    }

    /**
     * Return a copu of the agent controller data. The returned object contains the data of the problem (world) and the
     * state of every single agent in the controller pool (states)
     */
    getData() {
        return this.data;
    }
    /**
     * Return the history of the actions performed by the agents during the current virtual life loop
     */
    getActions() {
        return JSON.parse(JSON.stringify(this.actions));
    }

    /**
     * This function stop all the threads started by the agent controller and stops registered agents
     */
    stop() {
        this.finishAll();
    }
}

module.exports = AgentController;
},{}],3:[function(require,module,exports){
const AgentController = require('../core/AgentController');

/**
 * This class specifies the problem to be solved
 */
class Problem {
    constructor(initialState) {
        this.controller = new AgentController();
    }

    /**
     * Check if the given solution solves the problem. You must override
     * @param {Object} solution
     */
    goalTest(solution) {}
    //TODO return boolean


    /**
     * The transition model. Tells how to change the state (data) based on the given actions. You must override
     * @param {} data
     * @param {*} action
     * @param {*} agentID
     */
    update(data, action, agentID) {}
    //TODO modify data


    /**
     * Gives the world representation for the agent at the current stage
     * @param {*} agentID
     * @returns and object with the information to be sent to the agent
     */
    perceptionForAgent(data, agentID) {}
    //TODO return the perception


    /**
     * Add a new agent to solve the problem
     * @param {*} agentID
     * @param {*} agentClass
     * @param {*} initialState
     */
    addAgent(agentID, agentClass, initialState) {
        let agent = new agentClass(agentID);
        this.controller.register(agent, initialState);
    }

    /**
     * Solve the given problem
     * @param {*} world
     * @param {*} callbacks
     */
    solve(world, callbacks) {
        this.controller.setup({ world: world, problem: this });
        this.controller.start(callbacks, false);
    }

    /**
    * Returns an interable function that allow to execute the simulation step by step
    * @param {*} world
    * @param {*} callbacks
    */
    interactiveSolve(world, callbacks) {
        this.controller.setup({ world: world, problem: this });
        return this.controller.start(callbacks, true);
    }
}

module.exports = Problem;
},{"../core/AgentController":2}],4:[function(require,module,exports){
const Problem = require('./core/Problem');
const Agent = require('./core/Agent');
const AgentController = require('./core/AgentController');

module.exports = { Problem, Agent, AgentController };
},{"./core/Agent":1,"./core/AgentController":2,"./core/Problem":3}]},{},[]);

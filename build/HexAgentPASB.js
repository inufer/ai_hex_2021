require=(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({"/src/HexAgent.js":[function(require,module,exports){
const Agent = require('ai-agents').Agent;

//This is teh big cost for diskjtra moves
const BIGCOST = 5000;

class HexAgent extends Agent {
    constructor(value) {
        super(value);
    }

    /**
     * return a new move. The move is an array of two integers, representing the
     * row and column number of the hex to play. If the given movement is not valid,
     * the Hex controller will perform a random valid movement for the punter
     * Example: [1, 1]
     */
    send() {
        let tableGame = this.perception;
        let size = tableGame.length;
        let available = getEmptyHex(tableGame);
        let nTurn = size * size - available.length;
        
        if (nTurn == 0) { // First move
            return [Math.floor(size / 2), Math.floor(size / 2) - 1];
        } else if (nTurn == 1) { //Second move
            return [Math.floor(size / 2), Math.floor(size / 2)];
        }

        // alphaMoveMove and betaMoveMove is the costs of punter moves
        var alphaMove = -BIGCOST * 2;
        var betaMove = BIGCOST * 2;

        // Calculate the max move for me with min move for my oponent. ID is my punter
        return maximizedMoves( [[0,0],alphaMove], [[0,0],betaMove], 4, tableGame, this.id ).move;
    }

}

module.exports = HexAgent;

/**
 * Return an array containing the id of the empty hex in the tableGame
 * id = row * size + col;
 * @param {Matrix} tableGame 
 */
function getEmptyHex(tableGame) {
    let emptyResult = [];
    let size = tableGame.length;
    for (let k = 0; k < size; k++) {
        for (let j = 0; j < size; j++) {
            if (tableGame[k][j] === 0) {
                emptyResult.push(k * size + j);
            }
        }
    }
    return emptyResult;
}

// Validate neighbor
function isValid(newPosition, tableGame, size){
    let x = newPosition[0];
    let y = newPosition[1];
    if(x < 0 || x >= size || y < 0 || y >= size){
        return false;
    }else if(tableGame[x][y] == 1 || tableGame[x][y] == 2){
        return true;
    }
    return true;
}

// Get my neighbors
function getNeighbors(position, tableGame){    
    const size = tableGame.length;
    let neighResult = [];
    const pos0 = position[0];
    const pos1 = position[1];

    const aValidated = isValid([pos0 - 1, pos1 + 0], tableGame, size);
    const bValidated = isValid([pos0 - 1, pos1 + 1], tableGame, size);

    const cValidated = isValid([pos0 + 0, pos1 - 1], tableGame, size);
    const dValidated = isValid([pos0 + 0, pos1 + 1], tableGame, size);

    const eValidated = isValid([pos0 + 1, pos1 - 1], tableGame, size);
    const fValidated = isValid([pos0 + 1, pos1 + 0], tableGame, size);

    if(aValidated){ neighResult.push([pos0 - 1, pos1 + 0]); }
    else{ neighResult.push([false,false]); }
    if(bValidated){ neighResult.push([pos0 - 1, pos1 + 1]); }
    else{ neighResult.push([false,false]); }

    if(cValidated){ neighResult.push([pos0 + 0, pos1 - 1]); }
    else{ neighResult.push([false,false]); }
    if(dValidated){ neighResult.push([pos0 + 0, pos1 + 1]); }
    else{ neighResult.push([false,false]); }

    if(eValidated){ neighResult.push([pos0 + 1, pos1 - 1]); }
    else{ neighResult.push([false,false]); }
    if(fValidated){ neighResult.push([pos0 + 1, pos1 + 0]); }
    else{ neighResult.push([false,false]); }

    return neighResult;
}

// Validate my neighbors (only possible moves)
function getValidNeighbors(position, tableGame){    
    let size = tableGame.length;
    let validatedNeighResult = [];
    const pos0 = position[0];
    const pos1 = position[1];

    let aValidated = isValid([pos0 - 1,pos1 + 0], tableGame, size);
    let bValidated = isValid([pos0-1,pos1 + 1], tableGame, size);

    let cValidated = isValid([pos0 + 0,pos1 - 1], tableGame, size);
    let dValidated = isValid([pos0 + 0,pos1 + 1], tableGame, size);

    let eValidated = isValid([pos0 + 1,pos1 - 1], tableGame, size);
    let fValidated = isValid([pos0 + 1,pos1 + 0], tableGame, size);

    if(aValidated){ validatedNeighResult.push(true); }
    else{ validatedNeighResult.push(false); }
    if(bValidated){ validatedNeighResult.push(true); }
    else{ validatedNeighResult.push(false); }

    if(cValidated){ validatedNeighResult.push(true); }
    else{ validatedNeighResult.push(false); }
    if(dValidated){ validatedNeighResult.push(true); }
    else{ validatedNeighResult.push(false); }

    if(eValidated){ validatedNeighResult.push(true); }
    else{ validatedNeighResult.push(false); }
    if(fValidated){ validatedNeighResult.push(true); }
    else{ validatedNeighResult.push(false); }

    return validatedNeighResult;
}

function getCostoDjk(actualPosVal, punter){
    if(actualPosVal == 0){
        return  2;
    }else if(actualPosVal == punter){
        return 1;
    }else{
        return BIGCOST;
    }
}

function setCostDjk(actualPos, punter, matrix, tableGame){    
    const validNeigh = getValidNeighbors(actualPos, tableGame);
    const neighborMov = getNeighbors(actualPos, tableGame);
    let copyMatrix = JSON.parse(JSON.stringify(matrix));

    if(copyMatrix[actualPos[0]][actualPos[1]] != BIGCOST){

        for(var i = 0; i < validNeigh.length; i++){
            const neighPos = neighborMov[i][0];
            const neighCost = neighborMov[i][1];

            if(validNeigh[i]){
                let validCost = getCostoDjk(tableGame[neighPos][neighCost], punter);
                if(validCost == 2 || validCost == 1){
                    let acumCost = 0;
                    if(copyMatrix[actualPos[0]][actualPos[1]] == -BIGCOST){
                        continue
                    }else{
                        acumCost = copyMatrix[actualPos[0]][actualPos[1]] + validCost;
                    }
                    if(copyMatrix[neighPos][neighCost] == -BIGCOST){
                        copyMatrix[neighPos][neighCost] = acumCost;
                    }else if(copyMatrix[neighPos][neighCost] == BIGCOST){
                        continue
                    }else if(acumCost < copyMatrix[neighPos][neighCost]){
                        copyMatrix[neighPos][neighCost] = acumCost;
                    }
                }else{
                   copyMatrix[neighPos][neighCost] = validCost;
                }
            }
        }
    }
    return copyMatrix;
}

function getCostsDjk(tableGame, matrix, punter){
    let copyMatrix = JSON.parse(JSON.stringify(matrix));
    if(punter == 1){
        for(var i = 0; i < tableGame.length; i++){
            for(var j = 0; j < tableGame.length; j++){
                copyMatrix = setCostDjk([i,j], punter, copyMatrix, tableGame);
            }
        }
    }else{
        for(var i = 0; i < tableGame.length; i++){
            for(var j=0; j<tableGame.length; j++){
                copyMatrix = setCostDjk([j,i], punter, copyMatrix, tableGame);
            }
        }
    }    
    return copyMatrix;
}

// Function for calculate the fast route
function infoDjk(tableGame, punter){
    
    // Length of tableGame
    let tableGameLength = tableGame.length;
    let matrix = [];

    // Initializing empty matrix
    for(var i = 0; i < tableGameLength; i++) {
        matrix[i] = [];
        for(var j = 0; j < tableGameLength; j++) {
            matrix[i][j] = 0;
        }
    }

    // Initializing matrix of cost for punters
    if(punter == 1){
        for(var i = 0; i < tableGameLength; i++) {
            matrix[i] = [];
            for(var j = 0; j < tableGameLength; j++) {
                // If positions of tableGame is a punter or 0, the position is -BIGCOST
                if(tableGame[i][j] == punter && j == 0){
                    matrix[i][j] = 0;
                } else if(j == 0){
                    matrix[i][j] = 3;
                } else if(tableGame[i][j] == 0 || tableGame[i][j] == punter) {
                    matrix[i][j] = -BIGCOST;
                } else {
                    matrix[i][j] = BIGCOST;
                }
            }
        }
    }else{
        for(var i = 0; i < tableGameLength; i++) {
            for(var j = 0; j < tableGameLength; j++) {
                if(tableGame[i][j] == punter && i == 0){
                    matrix[i][j] = 0;
                }
                else if(i == 0){
                    matrix[i][j] = 3;
                }else if(tableGame[i][j] == 0 || tableGame[i][j] == punter){
                    matrix[i][j] = -BIGCOST;
                }else{
                    matrix[i][j] = BIGCOST;
                }
            }
        }        
    }

    let cMatrixDjk = getCostsDjk(tableGame, matrix, punter);

    for(var i=0; i < tableGameLength; i++){
        cMatrixDjk = getCostsDjk(tableGame, cMatrixDjk, punter);
    }

    let path=0;
    if(punter == 1){
        path = getNextNeighbor(tableGame, cMatrixDjk, 1);
    }else{
        path = getNextNeighbor(tableGame, cMatrixDjk, 0);
    }

    let fastedWorld = [path, cMatrixDjk];

    return fastedWorld;
}

function include (array, value){
    let isEqual = false
    for (var i=0; i<array.length; i++){
        if(array[i].length!=value.length) {
            return isEqual; 
        }else{
            if(array[i][0]==value[0] && array[i][1]==value[1]) {
                isEqual = true; 
            }
        } 
    }
    return isEqual;
}

// Get best cheaper neighbor
function getNextNeighbor (tableGame, cMatrixDjk, punter){
    let shortPath = [];
    let visited = [];
    let iteration = true;
    let size = tableGame.length;
    let position = [];
    let less = BIGCOST;

    if(punter == 1){
        for(var i=0; i<size;i++){
            if(cMatrixDjk[i][size-1] == -BIGCOST){
                continue
            } else if (cMatrixDjk[i][size-1] <= less && !include(visited, [i, size-1])){
                less = cMatrixDjk[i][size-1];
                shortPath = [[i, size-1]];
                position = [i, size-1];
            }
        }
    }else {
        for(var i = 0; i < size;i++){
            if(cMatrixDjk[size-1][i] == -BIGCOST){
                continue
            } else if (cMatrixDjk[size-1][i] <= less && !include(visited, [size-1, i])){
                less = cMatrixDjk[size-1][i];
                shortPath = [[size-1, i]];
                position = [size-1, i];
            }
        }
    }

    if(shortPath.length == 0){
        return []
    }

    visited.push(position);
    
    less = BIGCOST;
    var n = 0;

    while (iteration) {
        n += 1;
        let boolNeighbors = getValidNeighbors(position, tableGame);
        let neighbors = getNeighbors(position, tableGame);
        for (var i=0; i<neighbors.length; i++){
            if (boolNeighbors[i]) {
                if (position[punter] == 0 || n > 50){
                    iteration = false;
                }
                if (include(visited, neighbors[i])){
                    continue;   
                }
                if(cMatrixDjk[neighbors[i][0]][neighbors[i][1]] == -BIGCOST){
                    visited.push(neighbors[i]);
                    continue;
                } else if (cMatrixDjk[neighbors[i][0]][neighbors[i][1]] > less){
                    visited.push(neighbors[i]);
                    continue;
                }else if (cMatrixDjk[neighbors[i][0]][neighbors[i][1]] <= less && !include(visited, neighbors[i])) {
                    visited.push(neighbors[i]);
                    less = cMatrixDjk[neighbors[i][0]][neighbors[i][1]];
                    position = neighbors[i];
                } else if (include(visited, neighbors[i])){
                    visited.push(neighbors[i]);
                } else {
                    visited.push(neighbors[i]);
                    less = cMatrixDjk[neighbors[i][0]][neighbors[i][1]];
                    position = neighbors[i]
                }
            }
        }
        shortPath.push(position);
    }
    return shortPath
}

// Remove already Positions with punter
function removePlayed(tableGame, path, punter){
    var pos = [];
    var newPath = path;

    for(var i = 0; i < path.length; i++){
        pos = tableGame[path[i][0]][path[i][1]];
        if(pos == punter){
            newPath.splice(i,1);
        }
    }
    return newPath;
}

function maximizedMoves(alphaMove, betaMove, depth, tableGame, punter){
    //Get best route for punter
    var fastedWorld = infoDjk(tableGame, punter);
    console.log('fastedWorld MAX', fastedWorld);

    // Get moves already played on the best route
    let path = fastedWorld[0];
    path = removePlayed(tableGame, path, punter);

    console.log('PATH MAX', path);
    
    // Matrix of scores
    let cMatrixDjk = fastedWorld[1];

    // Center move
    let centerMove = [[3,3],0];

    // If depth is 0, return the move of oponent.
    if(depth == 0){
        if(path.length == 0){
            return [[3,3],-100];
        }

        return { move: path[0], score: -1 * cMatrixDjk[path[0][0]][path[0][1]] };
    }

    // Try on depths
    for (var i=0; i<path.length; i++){
        var newtableGame = JSON.parse(JSON.stringify(tableGame));

        if(punter == 1){
            newtableGame[path[i][0]][path[i][1]] = 1;
            centerMove = minimizedMoves( alphaMove, betaMove, depth-1, newtableGame, 2 );
            console.log('SCORE MAX punter 1', centerMove);
        }else{
            newtableGame[path[i][0]][path[i][1]] = 2;
            centerMove = minimizedMoves( alphaMove, betaMove, depth-1, newtableGame, 1 );
            console.log('SCORE MAX punter 2', centerMove);
        }

        // betaMove[1] is the score of beta
        if(centerMove.score >= betaMove[1] ){
            return {move: path[i], score: betaMove[1] };
        }

        // The score of move is more than alphaScore
        if(centerMove.score > alphaMove[1]){
            alphaMove = [path[i], centerMove.score];
            console.log('alphaMove MAX', alphaMove);
        }
    }

    return { move: alphaMove[0], score: alphaMove[1] };
}

function minimizedMoves(alphaMove, betaMove, depth, tableGame, punter){
    //Get best route for punter
    var fastedWorld = infoDjk(tableGame, punter);
    console.log('fastedWorld MIN', fastedWorld);

    // Get moves already played on the best route
    let path = fastedWorld[0];
    path = removePlayed(tableGame,path,punter);

    console.log('PATH MIN', path);
    
    // Matrix of scores
    let cMatrixDjk = fastedWorld[1];

    // Center move
    let centerMove = [[3,3],0];
    
    // If depth is 0, return the move.
    if(depth == 0){
        if(path.length == 0){
            return [[3,3],100];
        }

        return { move: path[0], score: cMatrixDjk[path[0][0]][path[0][1]] };
    }

    // Try on depths
    for (var i=0; i<path.length; i++){
        var newtableGame = JSON.parse(JSON.stringify(tableGame));
        
        if(punter == 1){
            newtableGame[path[i][0]][path[i][1]] = 1;
            centerMove = maximizedMoves(alphaMove, betaMove, depth-1, newtableGame, 2);
            console.log('SCORE MIN punter 1', centerMove);
        }else{
            newtableGame[path[i][0]][path[i][1]] = 2;
            centerMove = maximizedMoves(alphaMove, betaMove, depth-1, newtableGame, 1);
            console.log('SCORE MIN punter 2', centerMove);
        }

        // alphaMove[1] is the score of alpha
        if (centerMove.score <= alphaMove[1]){            
            return { move: path[i], score: alphaMove[1] };
        }

        // The score of move is more than betaScore
        if(centerMove.score < betaMove[1]){
            betaMove = [path[i], centerMove.score];
            console.log('betaMove MIN', betaMove);
        }
    }

    return { move: betaMove[0], score: betaMove[1] };
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

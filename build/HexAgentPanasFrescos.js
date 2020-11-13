require=(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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
},{"./core/Agent":1,"./core/AgentController":2,"./core/Problem":3}],5:[function(require,module,exports){
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

module.exports = getEmptyHex;
},{}],6:[function(require,module,exports){
// Struct for MCTS
class Node {
  constructor(parent, nroWins, nroVisits, childList, move, playerId) {
    this.parent = parent;
    this.nroWins = nroWins;
    this.nroVisits = nroVisits;
    this.childList = childList;
    this.move = move;
    this.playerId = playerId;
  }

  getNodeVisits() {
    return this.nroVisits;
  }

  // check if a node is terminal or not
  isLeaf() {
    return this.childList.length === 0 ? true : false;
  }

  // check if node has been visited
  wasVisited() {
    return this.nroVisits === 0 ? false : true;
  }

  // add new node to the childList
  addChild(child) {
    this.childList.push(child);
  }

  // get node move
  getMove() {
    return this.move;
  }

  //
  getNodeId() {
    return this.playerId;
  }

  // updates the stats to the node parent
  backpropagate(wins) {
    this.nroWins += wins;
    this.nroVisits += 1;
    if (!this.isRoot()) {
      this.parent.backpropagate(wins);
    }
  }

  // check if the node is the root
  isRoot() {
    return this.parent === null ? true : false;
  }

  getRoot() {
    if (this.isRoot()) {
      return this;
    } else {
      this.parent.getRoot();
    }
  }

  // UCT function for choice the best child child.winrate + C * raiz(parent.nroVisits/child.nroVisits)
  uctFunction() {
    return this.nroVisits === 0
      ? Number.MAX_SAFE_INTEGER
      : this.nroWins / this.nroVisits +
	  2.84 * Math.sqrt(Math.log(this.parent.nroVisits) / this.nroVisits);
  }

  heuristicFunction(vertex) {
    const beta = 5000;
    let alpha = ((beta - vertex.playouts) / beta > 0) ? (beta - vertex.playouts) / beta : 0;

    if (alpha == 1) {
    return this.uctFunction();
    } else {
    return alpha * (vertex.amafWins / vertex.playouts) + (1 - alpha) * this.uctFunction();
    }
    return this.uctFunction();
  }

  // get best child
  getBestChild(amaf, len) {
    return this.childList.length > 0
      ? this.childList.reduce(function (prev, current) {
          return prev.heuristicFunction(
            amaf[prev.move[0] * len + prev.move[1]]
          ) >
            current.heuristicFunction(
              amaf[current.move[0] * len + current.move[1]]
            )
            ? prev
            : current;
        })
      : null;
  }

  //
  getMostVisited() {
    return this.childList.length > 0
      ? this.childList.reduce(function (prev, current) {
          return prev.getNodeVisits() > current.getNodeVisits()
            ? prev
            : current;
        })
      : null;
  }
}

// Union find
class UnionFind {
  constructor(board, player) {
    this.board = board;
    this.id = [];
    this.sz = [];
    this.initial = [];
    this.terminal = [];
    this.player = player;
    this.initialize();
    this.neighbors();
  }

  initialize() {
    for (let i = 0; i < this.board.length * this.board.length; i++) {
      this.id.push(i);
      this.sz.push(i);
    }
  }

  neighbors() {
    let len = this.board.length;
    let isPlayer1 = this.player === "1";

    for (let i = 0; i < len; i++) {
      for (let j = 0; j < len; j++) {
        if (this.board[i][j] === this.player) {
          if (isPlayer1) {
            if (j === 0) {
              this.initial.push(i * len + j);
            } else if (j === len - 1) {
              this.terminal.push(i * len + j);
            }
          } else {
            if (i === 0) {
              this.initial.push(i * len + j);
            } else if (i === len - 1) {
              this.terminal.push(i * len + j);
            }
          }

          if (j != len - 1) {
            if (this.board[i][j + 1] === this.player) {
              this.union(i * len + j + 1, i * len + j);
            }
          }

          if (i != len - 1) {
            if (this.board[i + 1][j] === this.player) {
              this.union((i + 1) * len + j, i * len + j);
            }
          }

          if (i != len - 1 && j != 0) {
            if (this.board[i + 1][j - 1] === this.player) {
              this.union((i + 1) * len + j - 1, i * len + j);
            }
          }
        }
      }
    }
  }

  update(i, j, board) {
    let len = this.board.length;
    let isPlayer1 = this.player === "1";

    if (isPlayer1) {
      if (j === 0) {
        this.initial.push(i * len + j);
      } else if (j === len - 1) {
        this.terminal.push(i * len + j);
      }
    } else {
      if (i === 0) {
        this.initial.push(i * len + j);
      } else if (i === len - 1) {
        this.terminal.push(i * len + j);
      }
    }

    // UP
    if (i != 0) {
      if (board[i - 1][j] === this.player) {
        this.union(i * len + j, (i - 1) * len + j);
      }
    }

    // UP RIGHT
    if (i != 0 && j != len - 1) {
      if (board[i - 1][j + 1] === this.player) {
        this.union(i * len + j, (i - 1) * len + j + 1);
      }
    }

    // LEFT
    if (j != 0) {
      if (board[i][j - 1] === this.player) {
        this.union(i * len + j, i * len + j - 1);
      }
    }

    // Right
    if (j != len - 1) {
      if (board[i][j + 1] === this.player) {
        this.union(i * len + j, i * len + j + 1);
      }
    }

    // BOT LEFT
    if (j != 0 && i != len - 1) {
      if (board[i + 1][j - 1] === this.player) {
        this.union(i * len + j, (i + 1) * len + j - 1);
      }
    }

    // BOT
    if (i != len - 1) {
      if (board[i + 1][j] === this.player) {
        this.union(i * len + j, (i + 1) * len + j);
      }
    }
    //this.auxPrint(board);
    //this.printRoots();
    //console.log(this.terminal);
    //console.log(this.initial)
    //console.log(this.checkWinCondition(), this.player, "\n");
  }

  auxPrint(board) {
    for (let i = 0; i < board.length; i++) {
      let str = "";
      for (let j = 0; j < board.length; j++) {
        if (j == board.length - 1) {
          str += "" + board[i][j];
        } else {
          str += "" + board[i][j] + ", ";
        }
      }
    }
  }

  printRoots() {
    for (let i = 0; i < this.board.length; i++) {
      let str = "";
      for (let j = 0; j < this.board.length; j++) {
        if (j == this.board.length - 1) {
          str += "" + this.root(this.id[i * this.board.length + j]);
        } else {
          str += "" + this.root(this.id[i * this.board.length + j]) + ", ";
        }
      }
    }
  }

  checkWinCondition() {
    for (let i = 0; i < this.initial.length; i++) {
      for (let j = 0; j < this.terminal.length; j++) {
        if (this.connected(this.initial[i], this.terminal[j])) {
          return true;
        }
      }
    }
    return false;
  }

  root(index) {
    while (index != this.id[index]) {
      this.id[index] = this.id[this.id[index]];
      index = this.id[index];
    }
    return index;
  }

  getLargePath() {
    let max = 0;
    for (let i = 0; i < this.id.length; i++) {
      let temp = this.getArrayRoot(this.root(i)).length;
      if (max < temp) {
        max = temp;
      }
    }
    return max;
  }
  getArrayRoot(root) {
    let array = [];
    for (let i = 0; i < this.id.length; i++) {
      if (this.root(i) == root) {
        array.push(root);
      }
    }
    return array;
  }

  connected(p, q) {
    return this.root(p) === this.root(q);
  }

  union(p, q) {
    let i = this.root(p);
    let j = this.root(q);
    if (i == j) {
      return;
    }

    if (this.sz[i] < this.sz[j]) {
      this.id[i] = j;
      this.sz[j] += this.sz[i];
    } else {
      this.id[j] = i;
      this.sz[i] += this.sz[j];
    }
  }
}

// Monte Carlo Tree Search
class MonteCarloTreeSearch {
  constructor(board, timeLimit, id) {
    this.node = new Node(null, 0, 0, [], null, id);
    this.board = board;
    this.timeLimit = timeLimit;
    this.id = id;
    this.possibleMoves = [];
    this.highPriorityMoves = [];
    this.currentBoard = [];
    this.opponentId = id === "2" ? "1" : "2";
    this.unionFind = new UnionFind(board, id);
    this.unionFindEnemy = new UnionFind(board, id === "2" ? "1" : "2");
    this.amaf = [];
    this.initAmafArr();
    this.threshhold = 2;
    this.playsMade = 0;
  }

  initAmafArr() {
    for (let i = 0; i < this.board.length * this.board.length; i++) {
      this.amaf.push({
        amafWins: 0,
        playouts: 0,
      });
    }
  }

  auxPrint(board) {
    for (let i = 0; i < board.length; i++) {
      let str = "";
      for (let j = 0; j < board.length; j++) {
        if (j == board.length - 1) {
          str += "" + board[i][j];
        } else {
          str += "" + board[i][j] + ", ";
        }
      }
    }
  }

  start() {
    let start = Date.now();
    this.resetBoard();
    this.addMovesToNode(this.node, this.id);
    while (this.timeLimit > Date.now() - start) {
      this.mcts(this.node);
      this.resetBoard();
      this.unionFind = new UnionFind(this.board, this.id);
      this.unionFindEnemy = new UnionFind(
        this.board,
        this.id === "2" ? "1" : "2"
      );
    }
    //best Play
    let move = this.node.getBestChild(this.amaf, this.board.length).getMove();
    return move;
  }

  mcts(currentNode) {
    if (currentNode == null) {
      this.auxPrint(this.currentBoard);
    }

    if (this.unionFind.checkWinCondition()) {
      if (this.unionFindEnemy.getLargePath() <= 8) {
        currentNode.backpropagate(5);
      } else {
        currentNode.backpropagate(1);
      }
      return;
    } else if (this.unionFindEnemy.checkWinCondition()) {
      if (this.unionFindEnemy.getLargePath() <= 7) {
        currentNode.backpropagate(-30);
      } else if (this.unionFindEnemy.getLargePath() <= 13) {
        currentNode.backpropagate(-15);
      } else if (this.unionFindEnemy.getLargePath() <= 19) {
        currentNode.backpropagate(-5);
      } else if (this.unionFindEnemy.getLargePath() <= 24) {
        currentNode.backpropagate(-1);
      } else {
        currentNode.backpropagate(0);
      }
      return;
    }

    if (currentNode.isLeaf()) {
      this.currentNodeMove(currentNode);

      if (currentNode.getNodeId() === this.opponentId) {
        this.playsMade += 1;
        //this.initialBridgeCheck();
      }

      if (currentNode.wasVisited()) {
        //expand
        this.addMovesToNode(
          currentNode,
          currentNode.getNodeId() === "2" ? "1" : "2"
        );
        currentNode = currentNode.getBestChild(this.amaf, this.board.length);
        this.mcts(currentNode);
      } else {
        //Rollout
        let value = this.rollout(
          currentNode.getNodeId() === "2" ? "1" : "2" === this.opponentId
        );
        currentNode.backpropagate(value);
      }
    } else {
      if (!currentNode.isRoot()) {
        this.currentNodeMove(currentNode);
      }

      if (currentNode.getNodeId() === this.opponentId) {
        this.playsMade += 1;
      }
      this.mcts(currentNode.getBestChild(this.amaf, this.board.length));
    }
  }

  rollout(isOpponent) {
    let listOfActions = [];
    while (true) {
      if (this.unionFind.checkWinCondition()) {
        if (this.unionFindEnemy.getLargePath() <= 8) {
          return 5;
        } else {
          return 1;
        }
      }

      if (this.unionFindEnemy.checkWinCondition()) {
        for (let i = 0; i < listOfActions.length; i++) {
          this.amaf[
            listOfActions[i][0] * this.board.length + listOfActions[i][1]
          ].playouts += 1;
        }
        if (this.unionFindEnemy.getLargePath() <= 7) {
          return -30;
        } else if (this.unionFindEnemy.getLargePath() <= 15) {
          return -15;
        } else if (this.unionFindEnemy.getLargePath() <= 19) {
          return -5;
        } else if (this.unionFindEnemy.getLargePath() <= 23) {
          return -1;
        } else {
          return 0;
        }
      }

      let nextPlay = this.decideMove(isOpponent);

      if (isOpponent) {
        this.currentBoard[nextPlay[0]][nextPlay[1]] = this.opponentId;
        this.unionFindEnemy.update(nextPlay[0], nextPlay[1], this.currentBoard);
      } else {
        this.currentBoard[nextPlay[0]][nextPlay[1]] = this.id;
        this.unionFind.update(nextPlay[0], nextPlay[1], this.currentBoard);
        listOfActions.push(nextPlay);
      }

      this.removeMove(nextPlay);
      isOpponent = !isOpponent;
    }
  }

  currentNodeMove(currentNode) {
    let curMove = currentNode.getMove();
    this.currentBoard[curMove[0]][curMove[1]] = currentNode.getNodeId();
    currentNode.getNodeId() === this.id
      ? this.unionFind.update(curMove[0], curMove[1], this.currentBoard)
      : this.unionFindEnemy.update(curMove[0], curMove[1], this.currentBoard);
    this.possibleMoves.indexOf(curMove);
    this.removeMove(curMove);
  }

  decideMove(isOpponent) {
    let nextPlayIndex;
    let nextMove;

    if (isOpponent) {
      // Bridge check for opponent move
      nextPlayIndex = this.randomIntFromInterval(
        0,
        this.possibleMoves.length - 1
      );
      nextMove = this.possibleMoves[nextPlayIndex];
      this.playsMade += 1;
      this.highPriorityMoves = [];
    } else {
      // Has no bridges to defend so plays random
      nextPlayIndex = this.randomIntFromInterval(
        0,
        this.possibleMoves.length - 1
      );
      nextMove = this.possibleMoves[nextPlayIndex];
    }
    return nextMove;
  }

  randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  addMovesToNode(node, id) {
    for (let i = 0; i < this.possibleMoves.length; i++) {
      let newNode = new Node(node, 0, 0, [], this.possibleMoves[i], id);
      node.addChild(newNode);
    }
  }

  resetBoard() {
    this.currentBoard = [];
    for (let i = 0; i < this.board.length; i++) {
      let row = [];
      for (let j = 0; j < this.board.length; j++) {
        row.push(this.board[i][j]);
      }
      this.currentBoard.push(row);
    }

    this.possibleMoves = [];
    for (let i = 0; i < this.board.length; i++) {
      for (let j = 0; j < this.board.length; j++) {
        if (this.board[i][j] == 0) {
          this.possibleMoves.push([i, j]);
        }
      }
    }

    this.playsMade = 0;
    this.highPriorityMoves = [];
    //this.initialBridgeCheck();
  }

  initialBridgeCheck() {
    for (let i = 0; i < this.board.length; i++) {
      for (let j = 0; j < this.board.length; j++) {
        this.hasTwoBride(i, j);
      }
    }
  }

  hasTwoBride(i, j) {
    //this.resetBoard();
    let len = this.board.length;

    // i + 1
    if (i != len - 1) {
      // j - 2
      if (j > 1 && this.currentBoard[i + 1][j - 2] === this.id) {
        this.isTwoBrideUnderAttack({ i: i, j: j - 1 }, { i: i + 1, j: j - 1 });
      }

      // j + 1
      if (j < len - 1 && this.currentBoard[i + 1][j + 1] === this.id) {
        this.isTwoBrideUnderAttack({ i: i, j: j + 1 }, { i: i + 1, j: j });
      }
    }

    // i+2, j-1
    if (i < len - 2 && j != 0 && this.currentBoard[i + 2][j - 1]) {
      this.isTwoBrideUnderAttack({ i: i + 1, j: j - 1 }, { i: i + 1, j: j });
    }

    //console.log(this.highPriorityMoves);
    this.getMaxPriorityMove();
  }

  getMaxPriorityMove() {
    // Finds returns and deletes duplicates in highPriorityMoves if found else returns -1
    for (let i = 0; i < this.highPriorityMoves.length - 1; i++) {
      let current = [
        this.highPriorityMoves[i][0],
        this.highPriorityMoves[i][1],
      ];
      for (let j = i + 1; j < this.highPriorityMoves.length; j++) {
        if (
          current[0] === this.highPriorityMoves[j][0] &&
          current[1] === this.highPriorityMoves[j][1]
        ) {
          this.highPriorityMoves.splice(i, 1);
          this.highPriorityMoves.splice(j - 1, 1);
          return current;
        }
      }
    }
    return -1;
  }

  isTwoBrideUnderAttack(pos1, pos2) {
    let pos1UnderAttack = false;
    let pos2UnderAttack = false;

    if (
      this.currentBoard[pos1.i][pos1.j] === this.id ||
      this.currentBoard[pos2.i][pos2.j] === this.id
    ) {
      return;
    }

    if (this.currentBoard[pos1.i][pos1.j] === this.opponentId) {
      pos1UnderAttack = true;
    }

    if (this.currentBoard[pos2.i][pos2.j] === this.opponentId) {
      pos2UnderAttack = true;
    }

    if (pos1UnderAttack ^ pos2UnderAttack) {
      //console.log("Yes");
      if (pos1UnderAttack) {
        this.highPriorityMoves.push([pos2.i, pos2.j]);
        //console.log("defend on pos: ", pos2.i, pos2.j);
      } else {
        this.highPriorityMoves.push([pos1.i, pos1.j]);
        //console.log("defend on pos: ", pos1.i, pos1.j);
      }
    }
  }

  updateBridgesUnderAttack(i, j) {}

  removeMove(move) {
    let i = 0;
    for (let possibleMove of this.possibleMoves) {
      if (move[0] == possibleMove[0] && move[1] == possibleMove[1]) {
        this.possibleMoves.splice(i, 1);
      }
      i++;
    }
  }

  removeHighPriorityMove(move) {
    let i = 0;
    for (let highPriorityMove of this.highPriorityMoves) {
      if (move[0] == highPriorityMove[0] && move[1] == highPriorityMove[1]) {
        this.highPriorityMoves.splice(i, 1);
      }
      i++;
    }
  }
}

function RunMon(board, id) {
  timeLimit = 4000;

  let monteCarloTreeSearch = new MonteCarloTreeSearch(board, timeLimit, id);

  return monteCarloTreeSearch.start();
}
module.exports = RunMon;

},{}],"/src/HexAgent.js":[function(require,module,exports){
const Agent = require('ai-agents').Agent;
const getEmptyHex = require('./getEmptyHex');
const RunMon = require('./montecarlo13.js');

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
        
		return RunMon(board,this.getID());
    }
}

module.exports = HexAgent;

},{"./getEmptyHex":5,"./montecarlo13.js":6,"ai-agents":4}]},{},[]);

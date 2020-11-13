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
const Queue = require('./PriorityQueue');

const removeDeepFromMap = require('./removeDeepFromMap');

const toDeepMap = require('./toDeepMap');

const validateDeep = require('./validateDeep');
/** Creates and manages a graph */


class Graph {
  /**
   * Creates a new Graph, optionally initializing it a nodes graph representation.
   *
   * A graph representation is an object that has as keys the name of the point and as values
   * the points reacheable from that node, with the cost to get there:
   *
   *     {
   *       node (Number|String): {
   *         neighbor (Number|String): cost (Number),
   *         ...,
   *       },
   *     }
   *
   * In alternative to an object, you can pass a `Map` of `Map`. This will
   * allow you to specify numbers as keys.
   *
   * @param {Objec|Map} [graph] - Initial graph definition
   * @example
   *
   * const route = new Graph();
   *
   * // Pre-populated graph
   * const route = new Graph({
   *   A: { B: 1 },
   *   B: { A: 1, C: 2, D: 4 },
   * });
   *
   * // Passing a Map
   * const g = new Map()
   *
   * const a = new Map()
   * a.set('B', 1)
   *
   * const b = new Map()
   * b.set('A', 1)
   * b.set('C', 2)
   * b.set('D', 4)
   *
   * g.set('A', a)
   * g.set('B', b)
   *
   * const route = new Graph(g)
   */
  constructor(graph) {
    if (graph instanceof Map) {
      validateDeep(graph);
      this.graph = graph;
    } else if (graph) {
      this.graph = toDeepMap(graph);
    } else {
      this.graph = new Map();
    }
  }
  /**
   * Adds a node to the graph
   *
   * @param {string} name      - Name of the node
   * @param {Object|Map} neighbors - Neighbouring nodes and cost to reach them
   * @return {this}
   * @example
   *
   * const route = new Graph();
   *
   * route.addNode('A', { B: 1 });
   *
   * // It's possible to chain the calls
   * route
   *   .addNode('B', { A: 1 })
   *   .addNode('C', { A: 3 });
   *
   * // The neighbors can be expressed in a Map
   * const d = new Map()
   * d.set('A', 2)
   * d.set('B', 8)
   *
   * route.addNode('D', d)
   */


  addNode(name, neighbors) {
    let nodes;

    if (neighbors instanceof Map) {
      validateDeep(neighbors);
      nodes = neighbors;
    } else {
      nodes = toDeepMap(neighbors);
    }

    this.graph.set(name, nodes);
    return this;
  }
  /**
   * @deprecated since version 2.0, use `Graph#addNode` instead
   */


  addVertex(name, neighbors) {
    return this.addNode(name, neighbors);
  }
  /**
   * Removes a node and all of its references from the graph
   *
   * @param {string|number} key - Key of the node to remove from the graph
   * @return {this}
   * @example
   *
   * const route = new Graph({
   *   A: { B: 1, C: 5 },
   *   B: { A: 3 },
   *   C: { B: 2, A: 2 },
   * });
   *
   * route.removeNode('C');
   * // The graph now is:
   * // { A: { B: 1 }, B: { A: 3 } }
   */


  removeNode(key) {
    this.graph = removeDeepFromMap(this.graph, key);
    return this;
  }
  /**
   * Compute the shortest path between the specified nodes
   *
   * @param {string}  start     - Starting node
   * @param {string}  goal      - Node we want to reach
   * @param {object}  [options] - Options
   *
   * @param {boolean} [options.trim]    - Exclude the origin and destination nodes from the result
   * @param {boolean} [options.reverse] - Return the path in reversed order
   * @param {boolean} [options.cost]    - Also return the cost of the path when set to true
   *
   * @return {array|object} Computed path between the nodes.
   *
   *  When `option.cost` is set to true, the returned value will be an object with shape:
   *    - `path` *(Array)*: Computed path between the nodes
   *    - `cost` *(Number)*: Cost of the path
   *
   * @example
   *
   * const route = new Graph()
   *
   * route.addNode('A', { B: 1 })
   * route.addNode('B', { A: 1, C: 2, D: 4 })
   * route.addNode('C', { B: 2, D: 1 })
   * route.addNode('D', { C: 1, B: 4 })
   *
   * route.path('A', 'D') // => ['A', 'B', 'C', 'D']
   *
   * // trimmed
   * route.path('A', 'D', { trim: true }) // => [B', 'C']
   *
   * // reversed
   * route.path('A', 'D', { reverse: true }) // => ['D', 'C', 'B', 'A']
   *
   * // include the cost
   * route.path('A', 'D', { cost: true })
   * // => {
   * //       path: [ 'A', 'B', 'C', 'D' ],
   * //       cost: 4
   * //    }
   */


  path(start, goal, options = {}) {
    // Don't run when we don't have nodes set
    if (!this.graph.size) {
      if (options.cost) return {
        path: null,
        cost: 0
      };
      return null;
    }

    const explored = new Set();
    const frontier = new Queue();
    const previous = new Map();
    let path = [];
    let totalCost = 0;
    let avoid = [];
    if (options.avoid) avoid = [].concat(options.avoid);

    if (avoid.includes(start)) {
      throw new Error(`Starting node (${start}) cannot be avoided`);
    } else if (avoid.includes(goal)) {
      throw new Error(`Ending node (${goal}) cannot be avoided`);
    } // Add the starting point to the frontier, it will be the first node visited


    frontier.set(start, 0); // Run until we have visited every node in the frontier

    while (!frontier.isEmpty()) {
      // Get the node in the frontier with the lowest cost (`priority`)
      const node = frontier.next(); // When the node with the lowest cost in the frontier in our goal node,
      // we can compute the path and exit the loop

      if (node.key === goal) {
        // Set the total cost to the current value
        totalCost = node.priority;
        let nodeKey = node.key;

        while (previous.has(nodeKey)) {
          path.push(nodeKey);
          nodeKey = previous.get(nodeKey);
        }

        break;
      } // Add the current node to the explored set


      explored.add(node.key); // Loop all the neighboring nodes

      const neighbors = this.graph.get(node.key) || new Map();
      neighbors.forEach((nCost, nNode) => {
        // If we already explored the node, or the node is to be avoided, skip it
        if (explored.has(nNode) || avoid.includes(nNode)) return null; // If the neighboring node is not yet in the frontier, we add it with
        // the correct cost

        if (!frontier.has(nNode)) {
          previous.set(nNode, node.key);
          return frontier.set(nNode, node.priority + nCost);
        }

        const frontierPriority = frontier.get(nNode).priority;
        const nodeCost = node.priority + nCost; // Otherwise we only update the cost of this node in the frontier when
        // it's below what's currently set

        if (nodeCost < frontierPriority) {
          previous.set(nNode, node.key);
          return frontier.set(nNode, nodeCost);
        }

        return null;
      });
    } // Return null when no path can be found


    if (!path.length) {
      if (options.cost) return {
        path: null,
        cost: 0
      };
      return null;
    } // From now on, keep in mind that `path` is populated in reverse order,
    // from destination to origin
    // Remove the first value (the goal node) if we want a trimmed result


    if (options.trim) {
      path.shift();
    } else {
      // Add the origin waypoint at the end of the array
      path = path.concat([start]);
    } // Reverse the path if we don't want it reversed, so the result will be
    // from `start` to `goal`


    if (!options.reverse) {
      path = path.reverse();
    } // Return an object if we also want the cost


    if (options.cost) {
      return {
        path,
        cost: totalCost
      };
    }

    return path;
  }
  /**
   * @deprecated since version 2.0, use `Graph#path` instead
   */


  shortestPath(...args) {
    return this.path(...args);
  }

}

module.exports = Graph;

},{"./PriorityQueue":6,"./removeDeepFromMap":7,"./toDeepMap":8,"./validateDeep":9}],6:[function(require,module,exports){
/**
 * This very basic implementation of a priority queue is used to select the
 * next node of the graph to walk to.
 *
 * The queue is always sorted to have the least expensive node on top.
 * Some helper methods are also implemented.
 *
 * You should **never** modify the queue directly, but only using the methods
 * provided by the class.
 */
class PriorityQueue {
  /**
   * Creates a new empty priority queue
   */
  constructor() {
    // The `keys` set is used to greatly improve the speed at which we can
    // check the presence of a value in the queue
    this.keys = new Set();
    this.queue = [];
  }
  /**
   * Sort the queue to have the least expensive node to visit on top
   *
   * @private
   */


  sort() {
    this.queue.sort((a, b) => a.priority - b.priority);
  }
  /**
   * Sets a priority for a key in the queue.
   * Inserts it in the queue if it does not already exists.
   *
   * @param {any}     key       Key to update or insert
   * @param {number}  value     Priority of the key
   * @return {number} Size of the queue
   */


  set(key, value) {
    const priority = Number(value);
    if (isNaN(priority)) throw new TypeError('"priority" must be a number');

    if (!this.keys.has(key)) {
      // Insert a new entry if the key is not already in the queue
      this.keys.add(key);
      this.queue.push({
        key,
        priority
      });
    } else {
      // Update the priority of an existing key
      this.queue.map(element => {
        if (element.key === key) {
          Object.assign(element, {
            priority
          });
        }

        return element;
      });
    }

    this.sort();
    return this.queue.length;
  }
  /**
   * The next method is used to dequeue a key:
   * It removes the first element from the queue and returns it
   *
   * @return {object} First priority queue entry
   */


  next() {
    const element = this.queue.shift(); // Remove the key from the `_keys` set

    this.keys.delete(element.key);
    return element;
  }
  /**
   * @return {boolean} `true` when the queue is empty
   */


  isEmpty() {
    return Boolean(this.queue.length === 0);
  }
  /**
   * Check if the queue has a key in it
   *
   * @param {any} key   Key to lookup
   * @return {boolean}
   */


  has(key) {
    return this.keys.has(key);
  }
  /**
   * Get the element in the queue with the specified key
   *
   * @param {any} key   Key to lookup
   * @return {object}
   */


  get(key) {
    return this.queue.find(element => element.key === key);
  }

}

module.exports = PriorityQueue;

},{}],7:[function(require,module,exports){
/**
 * Removes a key and all of its references from a map.
 * This function has no side-effects as it returns
 * a brand new map.
 *
 * @param {Map}     map - Map to remove the key from
 * @param {string}  key - Key to remove from the map
 * @return {Map}    New map without the passed key
 */
function removeDeepFromMap(map, key) {
  const newMap = new Map();

  for (const [aKey, val] of map) {
    if (aKey !== key && val instanceof Map) {
      newMap.set(aKey, removeDeepFromMap(val, key));
    } else if (aKey !== key) {
      newMap.set(aKey, val);
    }
  }

  return newMap;
}

module.exports = removeDeepFromMap;

},{}],8:[function(require,module,exports){
/**
 * Validates a cost for a node
 *
 * @private
 * @param {number} val - Cost to validate
 * @return {bool}
 */
function isValidNode(val) {
  const cost = Number(val);

  if (isNaN(cost) || cost <= 0) {
    return false;
  }

  return true;
}
/**
 * Creates a deep `Map` from the passed object.
 *
 * @param  {Object} source - Object to populate the map with
 * @return {Map} New map with the passed object data
 */


function toDeepMap(source) {
  const map = new Map();
  const keys = Object.keys(source);
  keys.forEach(key => {
    const val = source[key];

    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      return map.set(key, toDeepMap(val));
    }

    if (!isValidNode(val)) {
      throw new Error(`Could not add node at key "${key}", make sure it's a valid node`, val);
    }

    return map.set(key, Number(val));
  });
  return map;
}

module.exports = toDeepMap;

},{}],9:[function(require,module,exports){
/**
 * Validate a map to ensure all it's values are either a number or a map
 *
 * @param {Map} map - Map to valiadte
 */
function validateDeep(map) {
  if (!(map instanceof Map)) {
    throw new Error(`Invalid graph: Expected Map instead found ${typeof map}`);
  }

  map.forEach((value, key) => {
    if (typeof value === 'object' && value instanceof Map) {
      validateDeep(value);
      return;
    }

    if (typeof value !== 'number' || value <= 0) {
      throw new Error(`Values must be numbers greater than 0. Found value ${value} at ${key}`);
    }
  });
}

module.exports = validateDeep;

},{}],10:[function(require,module,exports){
const Graph = require('node-dijkstra');
const transpose = require('./transposeHex');

let cache = {};

function boardScore(board, player) {
    let path0 = boardPath(board);
    let score = 0;
    if (!path0) {
        score = -(board.length * board.length);
    } else {
        if (path0.length === 2) {
            score = (board.length * board.length);
        } else {
            let path1 = boardPath(transpose(board));
            if (!path1) {
                score = (board.length * board.length)
            } else {
                score = path1.length - path0.length;
            }
        }
    }

    return player === '1' ? score : -score;
}

function boardPath(board) {
    let player = '1';
    let size = board.length;

    const route = new Graph();

    let neighborsT = {};
    let neighborsX = {};
    cache = {};
    // Build the graph out of the hex board
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            let key = i * size + j;
            if (board[i][j] === 0) { // || board[i][j] === player
                let list = getNeighborhood(key, player, board);
                list = removeIfAny(board, list, i, j);

                let neighbors = {};
                let sideX = false;
                let sideT = false;
                list.forEach(x => {
                    switch (x) {
                        case -1:
                            neighbors[player + 'X'] = 1;
                            neighborsX[key + ''] = 1;
                            sideX = sideX || board[i][j] === player;
                            break;
                        case -2:
                            neighbors[player + 'T'] = 1;
                            neighborsT[key + ''] = 1;
                            sideT = sideT || board[i][j] === player;
                            break;
                        default:
                            neighbors[x + ''] = 1;
                    }
                });
                // This case occurs when the game has finished
                if (sideT && sideX) {
                    neighborsX[player + 'T'] = 1;
                    neighborsT[player + 'X'] = 1;
                }
                route.addNode(key + '', neighbors);
            }
        }
    }

    route.addNode(player + 'T', neighborsT);
    route.addNode(player + 'X', neighborsX);

    return route.path(player + 'T', player + 'X');
}


function removeIfAny(board, list, row, col) {
    let size = board.length;
    if(row > 0 && col > 0 && row < size - 1 && col < size - 1 && list.length > 0) {
        if (board[row - 1][col] === 0 && board[row - 1][col - 1] === '2' && board[row][col + 1] === '2') {
            let k = list.findIndex(key => key === (row - 1) *  size + col);
            //console.log('x: ' + k + ' ' + ((row - 1) *  size + col));
            //console.log(list);
            if (k >= 0)
                list.splice(k, 1);
        }
        if (board[row][col + 1] === 0 && board[row - 1][col] === '2' && board[row + 1][col + 1] === '2') {
            let k = list.findIndex(key => key === row *  size + col + 1);
            //console.log('x: ' + k + ' ' + (row *  size + col + 1) );
            //console.log(list);
            if (k >= 0)
                list.splice(k, 1);
        }
        if (board[row + 1][col + 1] === 0 && board[row][col + 1] === '2' && board[row + 1][col] === '2') {
            let k = list.findIndex(key => key === (row + 1) * size + col + 1);
            //console.log('x: ' + k + ' ' + ((row + 1) * size + col));
            //console.log(list);
            if (k >= 0)
                list.splice(k, 1);
        }
        if (board[row + 1][col] === 0 && board[row + 1][col + 1] === '2' && board[row + 1][col - 1] === '2') {
            let k = list.findIndex(key => key === (row + 1) * size + col);
            //console.log('x: ' + k+ ' ' + ((row + 1) * size + col));
            //console.log(list);
            if (k >= 0)
                list.splice(k, 1);
        }
        if (board[row][col - 1] === 0 && board[row + 1][col] === '2' && board[row -1 ][col - 1] === '2') {
            let k = list.findIndex(key => key === row * size + col - 1);
            //console.log('x: ' + k + ' ' + (row * size + col - 1));
            //console.log(list);
            if (k >= 0)
                list.splice(k, 1);
        }
        if (board[row - 1][col - 1] === 0 && board[row - 1][col] === '2' && board[row][col - 1] === '2') {
            let k = list.findIndex(key => key === (row - 1) * size + col - 1);
            //console.log('x: ' + k + ' ' + ((row - 1) * size + col - 1));
            //console.log(list);
            if (k >= 0)
                list.splice(k, 1);
        }
    }
    return list;
}
/**
 * Return an array of the neighbors of the currentHex that belongs to the same player. The 
 * array contains the id of the hex. id = row * size + col
 * @param {Number} currentHex 
 * @param {Number} player 
 * @param {Matrix} board 
 */
function getNeighborhood(currentHex, player, board) {
    //Check if this value has been precalculated in this turn
    if (cache[currentHex + player]) {
        //console.log("Returned from cache");
        return cache[currentHex + player];
    }

    let size = board.length;
    let row = Math.floor(currentHex / size);
    let col = currentHex % size;
    let result = [];
    let currentValue = board[row][col];
    board[row][col] = 'x';
    // Check the six neighbours of the current hex
    pushIfAny(result, board, player, row - 1, col);
    pushIfAny(result, board, player, row - 1, col + 1);
    pushIfAny(result, board, player, row, col + 1);
    pushIfAny(result, board, player, row, col - 1);
    pushIfAny(result, board, player, row + 1, col);
    pushIfAny(result, board, player, row + 1, col - 1);

    // Add the edges if hex is at the border
    if (col === size - 1) {
        result.push(-1);
    } else if (col === 0) {
        result.push(-2);
    }

    board[row][col] = currentValue;

    // Cache this result
    cache[currentHex + player] = result;

    return result;
}

function pushIfAny(result, board, player, row, col) {
    let size = board.length;
    if (row >= 0 && row < size && col >= 0 && col < size) {
        if (board[row][col] === player || board[row][col] === 0) {
            if (board[row][col] === player) {
                result.push(...getNeighborhood(col + row * size, player, board));
            } else {
                result.push(col + row * size);
            }
        }
    }
}

module.exports = boardScore;
/*
board = [[0, 0, 0],
[0, '2', 0],
['1', '1', 0]];
console.log(boardScore(board, '1'));  // Debe dar 3 - 1 = 2

board = [[0, 0, '1'],
[0, '2', 0],
['1', 0, 0]];
console.log(boardScore(board, '1'));  // Debe dar 3 - 1 = 2

/*let board = [[0, '1', '1'],
['2', '2', '2'],
[0, 0, 0]];
console.log(boardScore(board, '2'));*/

/* = [[0, '1', '1'],
['2', '2', '2'],
[0, 0, 0]];
console.log(boardScore(board, '1'));*/
/*
let board = [[0, '2', '2'],
['1', '1', '1'],
[0, 0, 0]];
console.log(boardScore(board, '1'));

board = [[0, '2', '2'],
['1', '1', '1'],
[0, 0, 0]];
console.log(boardScore(board, '2'));

board = [[0, '2', '2'],
['1', '1', '2'],
[0, 0, '2']];
console.log(boardScore(board, '1'));

board = [[0, '2', '2'],
['1', '1', '2'],
[0, 0, '2']];
console.log(boardScore(board, '2'));
*/
/*let board = [['1', '1', '2'],
             [0,   '2', 0],
             [0,    0,  0]];
console.log(boardScore(board, '2'));

    board = [['1', '1', 0],
             [0,   '2', '2'],
             [0,    0,  0]];
console.log(boardScore(board, '2'));*/

},{"./transposeHex":13,"node-dijkstra":5}],11:[function(require,module,exports){
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
},{}],12:[function(require,module,exports){
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

},{"./boardScore":10,"./getEmptyHex":11,"./transposeHex":13}],13:[function(require,module,exports){
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

module.exports = transpose;
},{}],"/src/HexAgent.js":[function(require,module,exports){
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
    send(){
       return startMinMax(this.perception,this.getID());
    }
}

const Graph = require('node-dijkstra')

'use strict'
function send(){
    startMinMax(this.perception,this.getID());
}

class Arbol{

    constructor(){
        this.table = {};    
    }

    insert(id,mapa, hijos = [],padre = 0,valorH = 0){
        this.table[id] = {id,hijos,padre,valorH,mapa};   
    }

    get(id){
        let tableValue = this.table[id];
        return tableValue ? tableValue : -1;
    }
    getTable(){
        return this.table;
    }
}

function crearGrafo(mapa,jugadorId){
    let g = new Graph();
    let copiaMapa = JSON.parse(JSON.stringify(mapa));
    if(jugadorId == 2){
        copiaMapa = transponerMatrix(copiaMapa);
    }
    let adyI = {};
    for (let i = 0; i < copiaMapa.length ; i++ ) {
        if(copiaMapa[i][0] == 0){
            adyI[''+i+0] = 1;
        }else if(copiaMapa[i][0] == jugadorId){
            adyI[''+i+0] = 0.00000000000000000000000000001;
        }
        

    }
    g.addVertex('I',adyI);

    for(let i = 0; i < copiaMapa.length ; i++ ){
        for(let j = 0; j < copiaMapa.length ; j++ ){
            let adya= retornarAdj([i,j],copiaMapa,jugadorId); // [[posAdj, 1:0 ],[posAdj, 1:0]]
            let objAdy = construirAdj(adya);
            if(j == copiaMapa.length-1){
                if((copiaMapa[i][copiaMapa.length-1] == 0)||(copiaMapa[i][copiaMapa.length-1] == jugadorId)){
                    objAdy['D'] = 0.00000000000000000000000000001;
                }
            } 
            g.addVertex(''+i+j , objAdy);
        
        }
    }

    g.addVertex('D',{})
    return g;
}

function retornarAdj(pos, mapa,jugador) {
    let filas =    [-1, -1, 0, 0, 1, 1];
    let columnas = [ 0,  1,-1, 1,-1, 0];
    let contador = 0;
    let salida = [];
    while(contador < columnas.length){
        filaTemp = pos[0] + filas[contador];
        columnaTemp = pos[1] + columnas[contador];
        if((filaTemp < mapa.length) && (0 <= filaTemp)&&(columnaTemp < mapa.length) && (0 <= columnaTemp)){
            if(mapa[filaTemp][columnaTemp] == jugador){
                salida.push([[filaTemp,columnaTemp],0.00000000000000000000000000001]);
            }
            if(mapa[filaTemp][columnaTemp] == 0){
                salida.push([[filaTemp,columnaTemp],1]);
            }
        }
        contador++;
    }
    return salida;
}

function construirAdj(adj) {
    let salida = {}
    for (let i = 0; i < adj.length ; i++ ){
        salida[''+adj[i][0][0]+adj[i][0][1] ]= adj[i][1];
    }
    return salida;
}

function descartarEvaluados(idJugadas, mapa,jugador) {
    let salida = [];
    let copiaMapa = JSON.parse(JSON.stringify(mapa));
    if(jugador == 2){
        copiaMapa = transponerMatrix(copiaMapa);
    }
    idJugadas.shift();
    while(idJugadas[0] != 'D'){
        pos  = castingNodeGraph(idJugadas[0]);
        if(copiaMapa[pos[0]][pos[1]] == 0){
            salida.push(pos);
        }
        idJugadas.shift();
    }
    return salida;
}

                            
function castingNodeGraph(node) {
    
    return [parseInt(node[node.length - 2]),parseInt(node[node.length - 1])];

}

function jugadasValidas(mundo,jugador) {
    let grafo = crearGrafo(mundo,jugador);
    let salida = grafo.shortestPath('I','D');
    
    if(salida != null){
        salida = descartarEvaluados(salida,mundo,jugador);
        if(jugador == 2){
            salida = transponerJugadas(salida);
        }
    }else{
        salida = [];
    }
    return salida;
}

function transponerJugadas(jugadas){
    salida = [];
    while(jugadas.length != 0){
        salida.push([jugadas[0][1],jugadas[0][0]]);
        jugadas.shift();
    }
    return salida;
}

function transponerMatrix(mapa){
    let matriz = [];
    for (let i = 0; i < mapa.length; i++) {
        let fila = []
        for (let j = 0; j < mapa.length; j++) {
            fila.push(mapa[j][i])
        }
        matriz.push(fila);
    }
    return matriz;
}


function startMinMax(mapa,jugador){
    let turno = determinarTurno(mapa);
    let profundidadArbol = 7;
    if(turno == 1){
        return [Math.floor(mapa.length / 2),(Math.floor(mapa.length / 2)-1)]
    }
    if(turno == 2){
        return [Math.floor(mapa.length / 2),Math.floor(mapa.length / 2)]
    }
    if(turno > 20){
        profundidadArbol = 9;
    }
        let arbol = new Arbol();
        if(jugador == 1){
            crearArbolCompleto('',mapa,jugador,0,arbol,jugador,profundidadArbol);
        }else{
            crearArbolCompleto('',mapa,oponente(jugador),0,arbol,jugador,profundidadArbol);
        }
        let mejorJugada = minimax('',arbol,true,jugador,profundidadArbol);
        return [mejorJugada[0][0],mejorJugada[0][1]];
    
}

function minimax(id,arbol,flag,jugador,alfa = Number.MIN_SAFE_INTEGER, beta = Number.MAX_SAFE_INTEGER,profundidad){
    if((id.length >= (profundidad * 2))||(ganoAlguien(arbol.get(id).mapa))){
        return [id,heuristica(arbol.get(id).mapa,jugador)];        
    }
    if(flag){
        let maxEval = Number.MIN_SAFE_INTEGER;
        let respuesta = [id,maxEval];
        for(let i = 0; i < arbol.get(id).hijos.length;i++){
            let eval = minimax(arbol.get(arbol.get(id).hijos[i]).id,arbol,false,jugador,alfa,beta,profundidad);
            if(eval[1] >= respuesta[1]){
                respuesta = [eval[0],eval[1]];
            }
            if(eval[1] > alfa){
                alfa = eval[1];
            }
            if(beta <= alfa){
                break;
            }
        }
        return respuesta;
    }else{
        let minEval = Number.MAX_SAFE_INTEGER;
        let respuesta = [id,minEval];
        for(let i = 0; i < arbol.get(id).hijos.length;i++){
            let eval = minimax(arbol.get(arbol.get(id).hijos[i]).id,arbol,true,jugador,alfa,beta,profundidad)
            if(respuesta[1] >= eval[1]){
                respuesta = [eval[0],eval[1]]
            }
            if(beta > eval[1]){
                beta = eval[1];
            }
            if(beta <= alfa){
                break;
            }
        }
        return respuesta;
    }

}

function ganoAlguien(mapa){
    let g1 = crearGrafo(mapa,1);
    let g2 = crearGrafo(mapa,2); 
    let distrak1 = g1.shortestPath('I','D');
    let distrak2 = g2.shortestPath('I','D');
    if((distrak1 == null) || (distrak2 == null)){
        return true;
    }else{
        return false;
    }
}

function crearArbolCompleto(id,mapa,jugador, profundidad = 0,arbol,ficha,profundidadPermitida){
    if(profundidad == profundidadPermitida){
        arbol.insert(id,mapa,[],id.substr(0,id.length-2));
    }else{
        let jugadas = jugadasValidas(mapa,jugador);
        if(id == ''){
            arbol.insert(id,mapa,[]);
        }
        crearHijos(jugadas,id,arbol,mapa,ficha);
        for (let i = 0; i < arbol.get(id).hijos.length; i++) {
            let idHijo = arbol.get(id).hijos[i];
            crearArbolCompleto(idHijo,arbol.get(idHijo).mapa,jugador, profundidad+1,arbol,oponente(ficha),profundidadPermitida);
        }
    }
}

function determinarTurno(mapa){
    let contador = 1;
    for (let i = 0; (contador < 21) && (i < mapa.length); i++) {
        for (let j = 0; (contador < 21) &&(j < mapa.length); j++) {
            if(mapa[i][j] != 0){
                contador++;
            }
        }
    }
    return contador;
}

function crearHijos(ids, padre, arbol, estado,jugador){
    while(ids.length != 0){
       let copiaEstado = JSON.parse(JSON.stringify(estado));
       copiaEstado = realizarMovimiento(ids[0],copiaEstado,jugador);
       arbol.get(padre).hijos.push(''+padre+ids[0][0]+ids[0][1]);
       arbol.insert(''+padre+ids[0][0]+ids[0][1],copiaEstado,[],padre)
       ids.shift();
    }
}

function realizarMovimiento(movimiento,estado,jugador){
    estado[movimiento[0]][movimiento[1]] = jugador;
    return estado;
}

function oponente(jugador){
    if(jugador == 1){
        return 2;
    }else{
        return 1;
    }
} 
function heuristica(mapa,jugador){
    let gPropio = crearGrafo(mapa,jugador);
    let gRival = crearGrafo(mapa, oponente(jugador)); 
    let distrakPropio = gPropio.shortestPath('I','D', {cost : true});
    let distrakRival = gRival.shortestPath('I','D',{cost : true});
    if((distrakPropio.path == null) || ((distrakRival.path != null)&&(Math.floor(distrakRival.cost) == 0))){
        return Number.MIN_SAFE_INTEGER;
    }
    if((distrakPropio.path != null)&&(Math.floor(distrakPropio.cost) == 0)){
        return Number.MAX_SAFE_INTEGER;
    }
    if(distrakRival.path == null){
        return Number.MAX_SAFE_INTEGER-1;
    }
    
    return  Math.floor(distrakRival.cost) - Math.floor(distrakPropio.cost);
}


module.exports = HexAgent;

},{"./getEmptyHex":11,"./minMax":12,"ai-agents":4,"node-dijkstra":5}]},{},[]);

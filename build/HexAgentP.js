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

},{}],"/src/HexAgent.js":[function(require,module,exports){
const Agent = require('ai-agents').Agent;
const Graph = require('node-dijkstra');

class AgenteP extends Agent {
    constructor(value) {
        super(value);
        this.size=0;
        this.rootNode;
    }

    send(){
        let board = this.perception;
        let size = board.length;
        let available = getEmptyHex(board);
        let nTurn = size * size - available.length;
        let bdLength = board.length;

        if (nTurn == 0) { // First move use behind center 
            let posibleFirst = [
                [Math.floor(size / 2), Math.floor(size / 2) - 1],
                [Math.floor(size / 2), Math.floor(size / 2) + 1]
            ]

            let i = Math.floor(Math.random() * 2);
            this.goFirst = true;

            return (posibleFirst[i]);
        } else if (nTurn == 1) { // Second move use center

            return ([Math.floor(size / 2), Math.floor(size / 2)])
        } else {
            //let move = available[Math.round(Math.random() * (available.length - 1))];
            let node = {
                board: board,
                type: "Max",
                depth: 0,
                father: null,
                pos:  null,
                utility: -Infinity
            }
            this.rootNode = node;
            
            
            this.minimax(this.rootNode, -Infinity, Infinity);

            return this.rootNode.pos 
        }
    }

    expand(node, type){
        let nodeSons = [];
        let nNode = node;
        let availables = getEmptyHex(node.board);
        
        for(let i = 0; i < availables.length; i++) {
            let board = copyBoard(nNode.board); // PEEK

            let f = availables[i][0];
            let c = availables[i][1];

            if(type === "Min"){
                board[f][c] = this.getID();
            } else if(type === "Max"){
                if(this.getID() === "2") {
                    board[f][c] = "1";
                } else {
                    board[f][c] = "2";
                }
            } 

            let utility = -Infinity;
            if(type === "Min"){
                utility = Infinity
            }

            let node = {board: board, type: type, depth: nNode.depth+1, father: nNode, pos: [f,c], utility: utility}
            nodeSons.unshift(node);
        }

        return nodeSons;
    }

    minimax(node, alpha, betha){
        if(node.depth === 2){
            this.setHeuristic(node);
            this.fatherReport(node);
            return node.utility;
        } else {
            this.poda(node,alpha,betha);
        }
    }

    poda(node,alpha, betha){
        let sons = [];
        // Min father, max sons
        if(node.type === "Min"){
            sons = this.expand(node, "Max")
        } else {
            sons = this.expand(node, "Min")
        }

        if(node.type === "Max"){
            for(let i = 0; i<sons.length; i++) {
                // Expand sons until level 3
                let newAlpha = this.minimax(sons[i],alpha,betha);
                newAlpha > alpha ? alpha=newAlpha : alpha=alpha;
                if(alpha>=betha){
                    return alpha;
                }
            }
            return alpha;
        } else if(node.type === "Min"){
            for(let i = 0; i<sons.length; i++) {
                // Expand sons until level 3
                let newBetha = this.minimax(sons[i],alpha,betha);
                newBetha < betha ? betha=newBetha : betha=betha;
                if(alpha>=betha){
                    return betha;
                }
            }
            return betha;
        }
    }

    setHeuristic(node){

        let perry = this.findPath("P", node.board);
        let doof = this.findPath("D", node.board);
        if(perry === null){
            node.utility = -100;
        } else if(doof === null){
            node.utility = 100;
        } else {
            
            let perry = this.findPath("P", node.board);
            let doof = this.findPath("D", node.board);
            
            let perryF = this.amount(perry[1]);
            let doofF = this.amount(doof[1]);
            

            if (perry[0][node.pos[0]][node.pos[1]] === this.getID()) {
                node.utility = 5 - doofF - perryF 
            }else{
                node.utility = -5 - doofF - perryF
            }
        }
    }

    amount(world) {
        let cant = 0;
        for(let i = 0; i < world.length; i++) {
            for(let j = 0; j<world.length; j++) {
                if(world[i][j] === this.getID()){
                    cant++;
                }
            }
        }
        return cant;
    }

    fatherReport(node){
        if(node.father.type === "Max"){
            node.father.utility = getMax(node.utility, node.father.utility); 
        } else {
            node.father.utility = getMin(node.utility, node.father.utility);
        }

        if(node.father.depth !=0){
            this.fatherReport(node.father)
        } else if(node.father.utility === node.utility){
            node.father.pos=[node.pos[0], node.pos[1]];
        } 
        
    }

    pathify(board,i, j) {
        return `"${i},${j}":` + (board[i][j] == this.getID() ? 2 : board[i][j] === 0 ? 3 : 99)
    }

    getBorder(board,i,j){
        if (this.getID()==="1") {
            if (j == 0) {
                return `"leftBorder":100000,`
            }else if (j==board.length-1){
                return `"rightBorder":100000,`
            } else if (i === 0) {
                return '"topBorder":100000,'
            }else if (i===board.length-1){
                return `"bottomBorder":100000,`
            }else{
                return ""
            }
        } else {
            if (i === 0) {
                return '"topBorder":100000,'
            }else if (i===board.length-1){
                return `"bottomBorder":100000,`
            }else  if (j == 0) {
                return `"leftBorder":100000,`
            }else if (j==board.length-1){
                return `"rightBorder":100000,`
            } else {
                return ""
            }
        }
    }

    findPath(agent, board) {
        const route = new Graph();
        let bdLength = board.length;
        let boaddd = copyBoard(board);
        let boardCopy = boaddd;
        let nameNode;

        for (let i = 0; i < bdLength; i++) {
            for (let j = 0; j < bdLength; j++) {
                nameNode = `${i},${j}`
                let adjacent = "";

                if (i > 0 && j > 0 && i < bdLength -1 && j < bdLength-1) { //cualquier lugar del centro
                    adjacent += '{' + this.pathify(board,i - 1, j) + ',' +
                        this.pathify(board,i - 1, j + 1) + ',' +
                        this.pathify(board,i, j - 1) + ',' +
                        this.pathify(board,i, j + 1) + ',' +
                        this.pathify(board,i + 1, j - 1) + ',' +
                        this.pathify(board,i + 1, j) + '}';

                } else if (i === 0 && j === 0) { //esquina superior izquierda
                    adjacent += '{' + this.pathify(board,i, j + 1) + ',' +
                        this.getBorder(board,i,j)  +
                        this.pathify(board,i + 1, j) + '}';

                } else if (i === 0 && j === bdLength-1) { //esquina superior derecha
                    adjacent += '{' + this.pathify(board,i, j-1) + ',' +
                        this.getBorder(board,i,j)  +
                        this.pathify(board,i+1, j - 1) + ','+this.pathify(board,i+1, j) + '}';

                } else if (i === bdLength-1 && j === bdLength-1) { //esquina inferior derecha
                    adjacent += '{' + this.pathify(board,i - 1, j) + ',' +
                        this.getBorder(board,i,j)  +
                        this.pathify(board,i, j - 1) + '}';

                } else if (i === bdLength-1 && j === 0) { //esquina inferior izquierda
                    adjacent += '{' + this.pathify(board,i - 1, j) + ',' +
                        this.getBorder(board,i,j)  +
                        this.pathify(board,i, j + 1) + '}';

                } else if (i === 0 && j < bdLength) { //fila 0
                    adjacent += '{' + this.pathify(board,i, j - 1) + ',' +
                        this.pathify(board,i, j + 1) + ',' +
                        this.pathify(board,i + 1, j - 1) + ',' +
                        this.getBorder(board,i,j)  +
                        this.pathify(board,i + 1, j) + '}';

                } else if (i > 0 && j == 0) { //columna 0
                    adjacent += '{' + this.pathify(board,i - 1, j) + ',' +
                        this.getBorder(board,i,j)  +
                        this.pathify(board,i - 1, j + 1) + ',' +
                        this.pathify(board,i, j + 1) + ',' +
                        this.pathify(board,i + 1, j) + '}';

                } else if (i == bdLength-1 && j < bdLength) { //fila final
                    adjacent += '{' + this.pathify(board,i - 1, j) + ',' +
                        this.getBorder(board,i,j)  +
                        this.pathify(board,i, j - 1) + ',' +
                        this.pathify(board,i-1, j + 1) + ',' +
                        this.pathify(board,i, j + 1) +'}';

                } else if (i < bdLength && j == bdLength-1) { //columna final
                    adjacent += '{' + this.pathify(board,i - 1, j) + ',' +
                        this.getBorder(board,i,j)  +
                        this.pathify(board,i, j - 1) + ',' +
                        this.pathify(board,i + 1, j - 1) + ',' +
                        this.pathify(board,i + 1, j) + '}';
                }

                if(adjacent === ""){
                    continue;
                } else{
                    route.addNode(nameNode,JSON.parse(adjacent))
                }
                
            }
        }

        let left = {"0,0":1,"1,0":1,"2,0":1,"3,0":1,"4,0":1,"5,0":1,"6,0":1};
        let top =  {"0,0":1,"0,1":1,"0,2":1,"0,3":1,"0,4":1,"0,5":1,"0,6":1};
        let right = {"0,6":1,"1,6":1,"2,6":1,"3,6":1,"4,6":1,"5,6":1,"6,6":1};
        let down = {"6,0":1,"6,1":1,"6,2":1,"6,3":1,"6,4":1,"6,5":1,"6,6":1};
        
        
        for(let i = 0; i<bdLength; i++) {
            for(let j = 0; j<bdLength; j++) {
                try {
                    if(i === 0){
                        if(board[i][j] != this.getID() && board[i][j] != 0){
                            top[`${i},${j}`] = 99;
                        }
                    } else if(i === bdLength-1){
                        if(board[i][j] != this.getID() && board[i][j] != 0){
                            down[`${i},${j}`] = 99;
                        } 
                    } else if(j === 0){
                        if(board[i][j] != this.getID() && board[i][j] != 0){
                            left[`${i},${j}`] = 99;
                        }  
                    } else if(j === bdLength-1){
                        if(board[i][j] != this.getID() && board[i][j] != 0){
                            right[`${i},${j}`] = 99;
                        }  
                    }
                } catch (error) {
                    continue
                }
                
            }
        }
        
        route.addNode("leftBorder", left);
        route.addNode("topBorder",top);
        route.addNode("rightBorder",right);
        route.addNode("bottomBorder",down);
        let path;
        
        
        if(this.getID() === "2"){
            if(agent === "P"){
                path = route.path("topBorder", "bottomBorder")
            } else {
                path = route.path("leftBorder", "rightBorder")
            }
        } else {
            if(agent === "P"){
                path = route.path("leftBorder", "rightBorder")
            } else {
                path = route.path("topBorder", "bottomBorder")
            }
        }
        //console.log(path)
       if(agent === "P"){
            for(let i = 1; i < path.length-1; i++){
                boardCopy[path[i].charAt(0)][path[i].charAt(2)] = this.getID();
            }
        } else {
            for(let i = 1; i < path.length-1; i++){
                boardCopy[path[i].charAt(0)][path[i].charAt(2)] = this.getID() === "2" ? "1" : "2";
            }
        }

        return [path,boardCopy];
        
    }
}

function getEmptyHex(board) {
    let result = [];
    let size = board.length;
    for (let k = 0; k < size; k++) {
        for (let j = 0; j < size; j++) {
            if (board[k][j] === 0) {
                //result.push(k * size + j);
                result.push([k, j])
            }
        }
    }
    return result;
}

function copyBoard(board) {
    return board.map(fil => fil.slice());
}

function getMin(x,y){
    if(x<y){
        return x;
    } else {
        return y;
    }
}

function getMax(x,y){
    if(x>y){
        return x;
    } else {
        return y;
    }
}


module.exports = AgenteP;
},{"ai-agents":4,"node-dijkstra":5}]},{},[]);

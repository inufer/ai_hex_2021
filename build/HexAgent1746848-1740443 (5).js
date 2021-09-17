require = (function () {
	function r(e, n, t) {
		function o(i, f) {
			if (!n[i]) {
				if (!e[i]) {
					var c = 'function' == typeof require && require;
					if (!f && c) return c(i, !0);
					if (u) return u(i, !0);
					var a = new Error("Cannot find module '" + i + "'");
					throw ((a.code = 'MODULE_NOT_FOUND'), a);
				}
				var p = (n[i] = { exports: {} });
				e[i][0].call(
					p.exports,
					function (r) {
						var n = e[i][1][r];
						return o(n || r);
					},
					p,
					p.exports,
					r,
					e,
					n,
					t
				);
			}
			return n[i].exports;
		}
		for (var u = 'function' == typeof require && require, i = 0; i < t.length; i++) o(t[i]);
		return o;
	}
	return r;
})()(
	{
		'/src/HexAgent.js': [
			function (require, module, exports) {
				const Agent = require('ai-agents').Agent;
				const getEmptyHex = require('./getEmptyHex');
				const minMax = require('./minMax');
				const Graph = require('node-dijkstra');

				//  Implementamos la clase HexAgente e iniciamos el constructor el cual recibe la variable value.

				class Node {
					constructor(nodeFather, world, maximaxingPlay, depth, x, y) {
						this.nodeFather = nodeFather;
						this.world = world;
						this.maximazingPlay = maximaxingPlay;
						this.depth = depth;
						this.posx = x;
						this.posy = y;

						if (!this.maximazingPlay) {
							this.miniMaxVal = Infinity;
						} else {
							this.miniMaxVal = -Infinity;
						}
					}

					getWorld() {
						return this.world;
					}

					getDepth() {
						return this.depth;
					}

					isMaximizing() {
						return this.maximazingPlay;
					}

					getMinimaxVal() {
						return this.miniMaxVal;
					}

					getPos() {
						return [this.posx, this.posy];
					}

					setMinimaxVal(val, r, c) {
						if (!this.maximaxingPlay) {
							this.miniMaxVal = Math.min(val, this.miniMaxVal);
						} else {
							this.miniMaxVal = Math.max(val, this.miniMaxVal);
						}
						if (this.depth != 0) {
							this.informFather();
						} else if (this.miniMaxVal == val) {
							this.pos = [r, c];
						}
					}

					informFather() {
						let row = this.posx;
						let column = this.posy;
						this.nodeFather.setMinimaxVal(this.utility, row, column);
					}

					getheuristic(player) {
						let worldT = this.transpose(this.world);
						let oponentPath;
						let playerPath = this.shortestPath(this.world, player);
						//console.log(worldT);
						if (player === '1') {
							oponentPath = this.shortestPath(worldT, player);
							playerPath = this.shortestPath(this.world, player);
						} else {
							oponentPath = this.shortestPath(this.world, '1');
							playerPath = this.shortestPath(worldT, '1');
						}

						if (playerPath === null) {
							this.miniMaxVal = -101;
						} else if (oponentPath === null) {
							this.miniMaxVal = 101;
						} else {
							let oponentPathlength;
							let playerPathlength;

							if (player === '1') {
								oponentPathlength = this.pathLength(oponentPath, worldT, player);
								playerPathlength = this.pathLength(playerPath, this.world, player);
							} else {
								oponentPathlength = this.pathLength(oponentPath, this.world, '1');
								playerPathlength = this.pathLength(playerPath, worldT, '1');
							}
							if (playerPathlength <= 0) {
								this.miniMaxVal = 100;
							} else if (oponentPathlength <= 0) {
								this.miniMaxVal = -100;
							} else {
								//console.log(`oponent ${oponentPathlength}`);
								//console.log(`player ${playerPathlength}`);
								let val = oponentPathlength - playerPathlength;
								//console.log(`value op ${val}`);
								this.miniMaxVal = val;
							}
						}
					}

					pathLength(arr, world, play) {
						let size = arr.length;
						let worldSize = world.length;
						let count = 0;

						for (let i = 1; i < size - 1; i++) {
							let key = parseInt(arr[i], 10);
							let x = Math.floor(key / worldSize);
							let y = key % worldSize;

							if (world[x][y] != play) {
								count++;
							}
						}

						return count;
					}

					shortestPath(world, player) {
						const graph = new Graph();
						let size = world.length;

						for (let i = 0; i < size; i++) {
							for (let j = 0; j < size; j++) {
								let key = i * size + j;
								let neighbors = this.getNeighborhood(key, world, player);

								if (j === 0) {
									if (world[i][j] === 0) {
										neighbors['L'] = 2;
									} else if (world[i][j] === player) {
										neighbors['L'] = 1;
									}
								}
								if (j === size - 1) {
									if (world[i][j] === 0) {
										neighbors['R'] = 2;
									} else if (world[i][j] === player) {
										neighbors['R'] = 1;
									}
								}

								graph.addNode(key + '', neighbors);
							}
						}

						let neighborsL = {};
						let neighborsR = {};

						for (let i = 0; i < size; i++) {
							if (world[i][0] === 0) {
								neighborsL[i * size + ''] = 2;
							} else if (world[i][0] === player) {
								neighborsL[i * size + ''] = 1;
							}
							if (world[i][size - 1] === 0) {
								neighborsR[i * size + size - 1 + ''] = 2;
							} else if (world[i][size - 1] === player) {
								neighborsR[i * size + size - 1 + ''] = 1;
							}
						}

						graph.addNode('L', neighborsL);
						graph.addNode('R', neighborsR);

						return graph.path('L', 'R');
					}

					getNeighborhood(key, world, player) {
						let size = world.length;
						let row = Math.floor(key / size);
						let col = key % size;
						let result = {};

						if (this.insertNeighbor(row - 1, col)) {
							let name = (row - 1) * size + col;
							if (world[row - 1][col] === 0) {
								result[name + ''] = 2;
							} else if (world[row - 1][col] === player) {
								result[name + ''] = 1;
							}
						}

						if (this.insertNeighbor(row - 1, col + 1)) {
							let name = (row - 1) * size + (col + 1);
							if (world[row - 1][col + 1] === 0) {
								result[name + ''] = 2;
							} else if (world[row - 1][col + 1] === player) {
								result[name + ''] = 1;
							}
						}

						if (this.insertNeighbor(row, col + 1)) {
							let name = row * size + (col + 1);
							if (world[row][col + 1] === 0) {
								result[name + ''] = 2;
							} else if (world[row][col + 1] === player) {
								result[name + ''] = 1;
							}
						}

						if (this.insertNeighbor(row + 1, col)) {
							let name = (row + 1) * size + col;
							if (world[row + 1][col] === 0) {
								result[name + ''] = 2;
							} else if (world[row + 1][col] === player) {
								result[name + ''] = 1;
							}
						}

						if (this.insertNeighbor(row + 1, col - 1)) {
							let name = (row + 1) * size + (col - 1);
							if (world[row + 1][col - 1] === 0) {
								result[name + ''] = 2;
							} else if (world[row + 1][col - 1] === player) {
								result[name + ''] = 1;
							}
						}

						if (this.insertNeighbor(row - 1, col - 1)) {
							let name = (row - 1) * size + (col - 1);
							if (world[row][col - 1] === 0) {
								result[name + ''] = 2;
							} else if (world[row][col - 1] === player) {
								result[name + ''] = 1;
							}
						}

						return result;
					}

					insertNeighbor(row, col) {
						if (row >= 0 && row < this.world.length && col >= 0 && col < this.world.length) {
							return true;
						} else {
							return false;
						}
					}

					transpose(world) {
						let size = world.length;
						let worldT = new Array(size);
						for (let j = 0; j < size; j++) {
							worldT[j] = new Array(size);
							for (let i = 0; i < size; i++) {
								worldT[j][i] = world[i][j];
								if (worldT[j][i] === '1') {
									worldT[j][i] = '2';
								} else if (worldT[j][i] === '2') {
									worldT[j][i] = '1';
								}
							}
						}
						return worldT;
					}
				}

				class HexAgent extends Agent {
					constructor(value) {
						super(value);
						this.size = 0;
						this.world = [];
						this.check = [];
						this.root;

						this.expandNode = this.expandNode.bind(this);
						this.arraysEqual = this.arraysEqual.bind(this);
						this.isExplored = this.isExplored.bind(this);
						this.minimaxAlgo = this.minimaxAlgo.bind(this);
					}

					arraysEqual(arr1, arr2) {
						for (var i = arr1.length; i--; ) {
							for (var j = arr1.length; j--; ) {
								if (arr1[i][j] !== arr2[i][j]) return false;
							}
						}
						return true;
					}

					isExplored(world) {
						for (let i = 0; i < this.check.length; i++) {
							if (this.arraysEqual(world, this.check[i].getWorld())) {
								return false;
							}
						}
						return true;
					}

					expandNode(type, father) {
						var sonNodes = [];
						for (let i = 0; i < this.size; i++) {
							for (let j = 0; j < this.size; j++) {
								let aux = father.getWorld().map(function (arr) {
									return arr.slice();
								});
								if (aux[i][j] === 0) {
									if (!type) aux[i][j] = this.getID();
									else if (type) {
										if (this.getID() == '1') aux[i][j] = '2';
										else aux[i][j] = '1';
									}
									if (this.isExplored(father.getWorld())) {
										sonNodes.unshift(new Node(father, aux, type, father.getDepth() + 1, i, j));
									}
								}
							}
						}
						return sonNodes;
					}

					minimaxAlgo(player, alfa, beta) {
						let sonNodes = [];
						if (player.getDepth() == 3) {
							player.getheuristic(this.getID());
							player.informFather();
							let Val = player.getMinimaxVal();
							//console.log(`minimaxVal ${miniMaxVal}`);
							return Val;
						}
						//console.log(`player is ${player.isMaximizing() ? 'maximizing' : 'minimizing'}`);

						if (!player.isMaximizing()) {
							sonNodes = this.expandNode(true, player);
						} else {
							sonNodes = this.expandNode(false, player);
						}

						if (player.isMaximizing()) {
							for (let i = 0; i < sonNodes.length; i++) {
								let score = this.minimaxAlgo(sonNodes[i], alfa, beta);
								if (score > alfa) {
									alfa = score;
								}
								if (alfa >= beta) {
									//console.log(`is maximizing \n score ${score} \n alfa ${alfa} \n beta ${beta}`);
									return alfa;
								}
								//console.log(`is maximizing \n score ${score} \n alfa ${alfa} \n beta ${beta}`);
							}
							return alfa;
						} else {
							for (let i = 0; i < sonNodes.length; i++) {
								let score = this.minimaxAlgo(sonNodes[i], alfa, beta);

								if (score < beta) {
									beta = score;
								}
								if (alfa >= beta) {
									//console.log(`is minimizing \n score ${score} \n alfa ${alfa} \n beta ${beta}`);
									return beta;
								}
								//console.log(`is minimizing \n score ${score} \n alfa ${alfa} \n beta ${beta}`);
							}
							return beta;
						}
					}

					send() {
						this.world = this.perception.map(function (arr) {
							return arr.slice();
						});
						this.size = this.world.length;

						this.root = new Node(null, this.world, true, 0);

						//console.log(this.root);

						let num = this.minimaxAlgo(this.root, -100, 100);

						this.check = [];

						let sendPos = this.root.getPos();

						return sendPos;
					}
				}

				module.exports = HexAgent;
			},
			{ './getEmptyHex': 11, './minMax': 12, 'ai-agents': 4, 'node-dijkstra': 5 },
		],
		1: [
			function (require, module, exports) {
				//const tf = require('@tensorflow/tfjs-node');

				class Agent {
					constructor(name) {
						this.id = name;
						if (!name) {
							this.id = Math.round(Math.random() * 10e8);
						}
						this.state = null;
						this.perception = null;
						this.table = { default: 0 };
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
						return this.table['deafult'];
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
			},
			{},
		],
		2: [
			function (require, module, exports) {
				class AgentController {
					constructor() {
						this.agents = {};
						this.world0 = null;
						this.actions = [];
						this.data = { states: {}, world: {} };
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
						let id = '';
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
							// Espera
							let action = agent.send();
							this.actions.push({ agentID: agent.getID(), action });
							this.problem.update(this.data, action, agent.getID());
							if (this.problem.goalTest(this.data)) {
								this.finishAll();
								return false;
							} else {
								if (this.callbacks.onTurn) {
									this.callbacks.onTurn({
										actions: this.getActions(),
										data: JSON.parse(JSON.stringify(this.data)),
									});
								}
								if (this.currentAgentIndex >= keys.length - 1) this.currentAgentIndex = 0;
								else this.currentAgentIndex++;
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
										if (this.callbacks.onTurn)
											this.callbacks.onTurn({ actions: this.getActions(), data: this.data });
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
						if (this.callbacks.onFinish)
							this.callbacks.onFinish({ actions: this.getActions(), data: this.data });
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
			},
			{},
		],
		3: [
			function (require, module, exports) {
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
			},
			{ '../core/AgentController': 2 },
		],
		4: [
			function (require, module, exports) {
				const Problem = require('./core/Problem');
				const Agent = require('./core/Agent');
				const AgentController = require('./core/AgentController');

				module.exports = { Problem, Agent, AgentController };
			},
			{ './core/Agent': 1, './core/AgentController': 2, './core/Problem': 3 },
		],
		5: [
			function (require, module, exports) {
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
							if (options.cost)
								return {
									path: null,
									cost: 0,
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
							if (options.cost)
								return {
									path: null,
									cost: 0,
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
								cost: totalCost,
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
			},
			{ './PriorityQueue': 6, './removeDeepFromMap': 7, './toDeepMap': 8, './validateDeep': 9 },
		],
		6: [
			function (require, module, exports) {
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
								priority,
							});
						} else {
							// Update the priority of an existing key
							this.queue.map(element => {
								if (element.key === key) {
									Object.assign(element, {
										priority,
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
			},
			{},
		],
		7: [
			function (require, module, exports) {
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
			},
			{},
		],
		8: [
			function (require, module, exports) {
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
							throw new Error(
								`Could not add node at key "${key}", make sure it's a valid node`,
								val
							);
						}

						return map.set(key, Number(val));
					});
					return map;
				}

				module.exports = toDeepMap;
			},
			{},
		],
		9: [
			function (require, module, exports) {
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
							throw new Error(
								`Values must be numbers greater than 0. Found value ${value} at ${key}`
							);
						}
					});
				}

				module.exports = validateDeep;
			},
			{},
		],
		10: [
			function (require, module, exports) {
				const Graph = require('node-dijkstra');
				const transpose = require('./transposeHex');

				let cache = {};

				/**
				 * Implemente aquí su función heurística para calcular el puntaje
				 * de un tablero de hex puede contener varias jugadas de ambos jugadores.
				 * Tenga en cuenta que usted puede ser el jugador 1 o el juegador 2.
				 * @param {array} board
				 * @param {string} player
				 * @returns {float}
				 */
				function boardScore(board, player) {
					// Implemente esta funció
					toReturn.move = player1;
					n;
					return Math.random() * 10;
				}
				/**
				 * Esta función construye un grafo a partir de un
				 * tablero de Hex para el jugador 1.
				 * Cada casilla es un nodo que tiene conexiones a sus 6 vecinos.
				 * Para la casilla (i, j), las 6 casillas vecinas tienen
				 * conexiones en el grafo entre si. Si un vecino de esta casilla ya
				 * pertenece al jugador 1, los vecinos de dicha casilla vecina también
				 * se consideran vecinos de (i, j). Su un vecino de esta casilla
				 * pertenece al jugador 2, dicho vecino no se considera vecino de (i,j)
				 * @param {array} board
				 * @returns
				 */
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
							if (board[i][j] === 0 || board[i][j] === player) {
								let list = getNeighborhood(key, player, board);
								// Cache this result
								//cache[key] = list;
								list = removeIfAny(board, list, i, j);

								//if (key === 5) console.log(list)

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

					//console.log(route)

					return route.path(player + 'T', player + 'X');
				}

				/**
				 * Evita que se consideren las casillas donde el enemigo tiene 2 opciones para cerrar el camino
				 * @param {*} board
				 * @param {*} list
				 * @param {*} row
				 * @param {*} col
				 * @returns
				 */
				function removeIfAny(board, list, row, col) {
					let size = board.length;
					if (row > 0 && col > 0 && row < size - 1 && col < size - 1 && list.length > 0) {
						if (
							board[row - 1][col] === 0 &&
							board[row - 1][col - 1] === '2' &&
							board[row][col + 1] === '2'
						) {
							let k = list.findIndex(key => key === (row - 1) * size + col);
							//console.log('x: ' + k + ' ' + ((row - 1) *  size + col));
							//console.log(list);
							if (k >= 0) list.splice(k, 1);
						}
						if (
							board[row][col + 1] === 0 &&
							board[row - 1][col] === '2' &&
							board[row + 1][col + 1] === '2'
						) {
							let k = list.findIndex(key => key === row * size + col + 1);
							//console.log('x: ' + k + ' ' + (row *  size + col + 1) );
							//console.log(list);
							if (k >= 0) list.splice(k, 1);
						}
						if (
							board[row + 1][col + 1] === 0 &&
							board[row][col + 1] === '2' &&
							board[row + 1][col] === '2'
						) {
							let k = list.findIndex(key => key === (row + 1) * size + col + 1);
							//console.log('x: ' + k + ' ' + ((row + 1) * size + col));
							//console.log(list);
							if (k >= 0) list.splice(k, 1);
						}
						if (
							board[row + 1][col] === 0 &&
							board[row + 1][col + 1] === '2' &&
							board[row + 1][col - 1] === '2'
						) {
							let k = list.findIndex(key => key === (row + 1) * size + col);
							//console.log('x: ' + k+ ' ' + ((row + 1) * size + col));
							//console.log(list);
							if (k >= 0) list.splice(k, 1);
						}
						if (
							board[row][col - 1] === 0 &&
							board[row + 1][col] === '2' &&
							board[row - 1][col - 1] === '2'
						) {
							let k = list.findIndex(key => key === row * size + col - 1);
							//console.log('x: ' + k + ' ' + (row * size + col - 1));
							//console.log(list);
							if (k >= 0) list.splice(k, 1);
						}
						if (
							board[row - 1][col - 1] === 0 &&
							board[row - 1][col] === '2' &&
							board[row][col - 1] === '2'
						) {
							let k = list.findIndex(key => key === (row - 1) * size + col - 1);
							//console.log('x: ' + k + ' ' + ((row - 1) * size + col - 1));
							//console.log(list);
							if (k >= 0) list.splice(k, 1);
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
					let size = board.length;
					let row = Math.floor(currentHex / size);
					let col = currentHex % size;
					let result = [];
					let currentValue = board[row][col];

					board[row][col] = 'x';
					//Check if this value has been precalculated in this turn
					//if (cache[currentHex]) {
					//console.log("From cache")
					//  return cache[currentHex];
					//}

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

				/*board = [[0, '2', 0],
[0, '2', 0],
['1', '2', 0]];
console.log( boardPath(board));  // Debe dar 3 - 1 = 2
*/
				/*board = [[0, 0, '1'],
[0, '2', 0],
['1', 0, 0]];
console.log(boardScore(board, '1'));  // Debe dar 2-2=0
*/
				//board = [[0, '1', '1'],
				//['2', '2', '2'],
				//[0, 0, 0]];
				//console.log(boardScore(board, '1')) ;

				/*
board = [[0, '1', '1'],
['2', '2', '2'],
[0, 0, 0]];
console.log(boardScore(board, '1'));
board = [[0, '2', '2'],
['1', '1', '1'],
[0, 0, 0]];
console.log(boardScore(board, '2'));
/*
board = [[0, '2', '2'],
['1', '1', '1'],
[0, 0, 0]];
console.log(boardScore(board, '2'));
board = [[0, '2', 0],
['1', '2', 0],
['1', '1', '1']];
console.log(boardPath(board));
/*
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
			},
			{ './transposeHex': 13, 'node-dijkstra': 5 },
		],
		11: [
			function (require, module, exports) {
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
			},
			{},
		],
		12: [
			function (require, module, exports) {
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

					if (available == null) available = getCandidates(board); //getEmptyHex(board);
					let bestScore = Number.MIN_SAFE_INTEGER;

					// Implemente su algoritmo minmax con poda alpha beta aquí

					// Fin de su implementación
					// retorna el mejor puntaje y la mejor jugada [i, j]
					return { score: bestScore, move: bestMove };
				}

				module.exports = minMax;

				/**
				 * Esta función sirve para construir un hash del tablero.
				 * O puede reducirla usando una función md5
				 * Usela para construir una tabla que le permita identificar nodos ya visitados
				 * @param {*} board
				 * @returns
				 */
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
			},
			{ './boardScore': 10, './getEmptyHex': 11, './transposeHex': 13 },
		],
		13: [
			function (require, module, exports) {
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
			},
			{},
		],
	},
	{},
	[]
);

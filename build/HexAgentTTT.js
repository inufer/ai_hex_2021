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
},{"./core/Agent":1,"./core/AgentController":2,"./core/Problem":3}],"/modelHex/HexAgent.js":[function(require,module,exports){
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
        var jugador = this.getID();
        //console.log(board);
        //console.log(available);
        let profundidad = 4;
        if(available.length<20){
          profundidad = 6;
        }
        if(available.length<14){
          profundidad = 7;
        }
        if(available.length<11){
          profundidad = 10;
        }
        let nTurn = size * size - available.length;
        //console.log(nTurn)
        if (nTurn == 0) { // First move
            //console.log([Math.floor(size / 2), Math.floor(size / 2) - 1])
            return [Math.floor(size / 2), Math.floor(size / 2) - 1];
        } else{ if (nTurn == 1) {
            var jugada = mejorsegunda(board,this.getID());
            return jugada;
          }else{
            //console.log(this.getID());
            //var resultado = minMax(board, this.getID(), this.getID(), 0, 4, -10000, 10000, available);
            //console.log(resultado);
            var resultado = minMax(board, this.getID(), this.getID(), 0, profundidad, -10000, 10000, available,[]);
            //console.log(resultado);
            return resultado[1];
          }
        }

        let move = available[Math.round(Math.random() * (available.length - 1))];
        return [Math.floor(move / board.length), move % board.length];
    }

}

module.exports = HexAgent;

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
function mejorsegunda(tablero,jugador){
  var buscar = "1";
    if (jugador=="1"){
      buscar = "2";
    }
    for(var a=0;a<tablero.length;a++){
      for(var e=0;e<tablero.length;e++){
        if(tablero[a][e]==buscar){
          if(a<4){
            a = a+3
          }else{
            a=a-2
          }
          if(e<4){
            e = e+3
          }else{
            e=e-2
          }
          return [4,e]
        }
      }
    }
}

function CalcularPosNodos(pos,tamaño){
  var nodosV= [];
  var nodosD= [];
  var y = tamaño- 1;
  var x = tamaño -1;
  //Posibles Nodos con caminos Virtuales
  if(pos[0]>1&&pos[1]<x){//superior
    var miniarray = [[pos[0]-2,pos[1]+1]];//nodo
    miniarray.push([pos[0]-1,pos[1]]);//vecinos
    miniarray.push([pos[0]-1,pos[1]+1]);
    nodosV.push(miniarray);
  }
  if(pos[0]>0&&pos[1]>0){//sup izq
    var miniarray = [[pos[0]-1,pos[1]-1]];
    miniarray.push([pos[0]-1,pos[1]]);
    miniarray.push([pos[0],pos[1]-1]);
    nodosV.push(miniarray);
  }
  if(pos[0]>0&&pos[1]<x-1){//sup der
    var miniarray = [[pos[0]-1,pos[1]+2]];
    miniarray.push([pos[0]-1,pos[1]+1]);
    miniarray.push([pos[0],pos[1]+1]);
    nodosV.push(miniarray);

  }
  if(pos[0]<y-1&&pos[1]>0){ // inf
    var miniarray = [[pos[0]+2,pos[1]-1]];
    miniarray.push([pos[0]+1,pos[1]]);
    miniarray.push([pos[0]+1,pos[1]-1]);
    nodosV.push(miniarray);
  }
  if(pos[0]<y&&pos[1]>1){ // inf izq
    var miniarray = [[pos[0]+1,pos[1]-2]];
    miniarray.push([pos[0],pos[1]-1]);
    miniarray.push([pos[0]+1,pos[1]-1]);
    nodosV.push(miniarray);
  }

  if(pos[0]<y&&pos[1]<x){ // inf der
    var miniarray = [[pos[0]+1,pos[1]+1]];
    miniarray.push([pos[0]+1,pos[1]]);
    miniarray.push([pos[0],pos[1]+1]);
    nodosV.push(miniarray);
  }
 // console.log(nodosV);
  //Posibles Nodos con caminos Directos
  if(pos[0]>1){ // sup izq
    var miniarray = [[pos[0]-2,pos[1]]];
    miniarray.push([pos[0]-1,pos[1]]);
    nodosD.push(miniarray);
  }

  if(pos[0]>1&&pos[1]<x-1){ // sup der
    var miniarray = [[pos[0]-2,pos[1]+2]];
    miniarray.push([pos[0]-1,pos[1]+1]);
    nodosD.push(miniarray);
  }
  if(pos[1]>1){ //  izq
    var miniarray = [[pos[0],pos[1]-2]];
    miniarray.push([pos[0],pos[1]-1]);
    nodosD.push(miniarray);
  }
  if(pos[1]<x-1){ //  der
    var miniarray = [[pos[0],pos[1]+2]];
    miniarray.push([pos[0],pos[1]+1]);
    nodosD.push(miniarray);
  }
  if(pos[0]<y-1&&pos[1]>1){ // inf izq
    var miniarray = [[pos[0]+2,pos[1]-2]];
    miniarray.push([pos[0]+1,pos[1]-1]);
    nodosD.push(miniarray);
  }

  if(pos[0]<y-1){ // inf der
    var miniarray = [[pos[0]+2,pos[1]]];
    miniarray.push([pos[0]+1,pos[1]]);
    nodosD.push(miniarray);
  }
  //console.log(nodosD);
  return [nodosV,nodosD];

}


var EliminarMatriz =function ( arr, item ) {
    var i = arr.indexOf( item );

    if ( i !== -1 ) {
        arr.splice( i, 1 );
    }
}


function recursivoCaminosP2(pos,noeval,coords,minicamino,tamaño,jugador){
 // console.log(minicamino);
  //console.log(pos);
  minicamino.push(pos);
  EliminarMatriz(noeval,pos);
  var pregunta1 = Number.isInteger(pos/tamaño);
  var pregunta2 = Number.isInteger((pos+1)/tamaño);
  if(pregunta1==false){//izq
    if(noeval.indexOf(pos-1)!=-1){
      if(coords[pos-1]==jugador){
      recursivoCaminosP2(pos-1,noeval,coords,minicamino,tamaño,jugador);
      }
    }
  }
  if(pregunta2==false){//der
    if(noeval.indexOf(pos+1)!=-1){
      if(coords[pos+1]==jugador){
        //console.log(minicamino);
        //console.log(pos);
      recursivoCaminosP2(pos+1,noeval,coords,minicamino,tamaño,jugador);
      }
    }
  }
  if(pos/7<tamaño-1){//abajo
    if(pregunta1==false){//abajo izq
      if(noeval.indexOf(pos+6)!=-1){
        if(coords[pos+6]==jugador){
        recursivoCaminosP2(pos+6,noeval,coords,minicamino,tamaño,jugador);
        }
      }
    }
    if(noeval.indexOf(pos+7)!=-1){//abajo der
      if(coords[pos+7]==jugador){
      recursivoCaminosP2(pos+7,noeval,coords,minicamino,tamaño,jugador);
      }
    }

  }
  if(pos/7>0){//arriba
    if(pregunta2==false){
      if(noeval.indexOf(pos-6)!=-1){
        if(coords[pos-6]==jugador){
        recursivoCaminosP2(pos-6,noeval,coords,minicamino,tamaño,jugador);
        }
      }
    }
    if(noeval.indexOf(pos-7)!=-1){//abajo der
      if(coords[pos-7]==jugador){
      recursivoCaminosP2(pos-7,noeval,coords,minicamino,tamaño,jugador);
      }
    }

    }
  }

  function calcularCoords(pos,tamaño,jugador){
    var division = Math.floor(pos/tamaño);
    var residuo = pos % tamaño;
    //console.log(division);
    //console.log(residuo);
    if(jugador=="1"){
      return [residuo,division];
    }else{
      return [division,residuo];
    }
  }


  function calcularPos(coords,tamaño,jugador){
  var pos = 0;
  if(jugador=="1"){
    pos = pos + coords[1]*tamaño;
    pos= pos + coords[0];
  }else{
    pos = pos + coords[0]*tamaño;
    pos= pos + coords[1];

  }
  return pos;
  }


  function calcularCaminos(mapa,tamaño,jugador){
    var coords = [];
    var cond = false;
    var noevaluados =[];
    var asignador = 0;
    var minicamino = [];
    var caminos= [];
    for(var y=0;y<tamaño;y++){
      for(var x=0;x<tamaño;x++){
        if(jugador=="2"){
          coords.push(mapa[y][x]);
        }
        else{
          coords.push(mapa[x][y]);
        }
        noevaluados.push(asignador);
        asignador= asignador + 1;
      }
    }
    for(var i=0;i<1;i=0){
      if (noevaluados.length==0){
       // console.log(caminos);
        break;
      }

      if (coords[noevaluados[0]]==jugador){
        recursivoCaminosP2(noevaluados[0],noevaluados,coords,minicamino,tamaño,jugador);
        var micamino = JSON.parse( JSON.stringify( minicamino ) );
        micamino.sort(function compareNumbers(a, b)
        {return a - b;});
        caminos.push(micamino);
        minicamino = [];
      }else{
        noevaluados.shift();
      }

    }

    return caminos;
    }

    function recorrerCaminos(pos,caminos,index){
      var conexiones = [];
      for(var i = 0;i<caminos.length;i++){
          if(i== index){
            continue;
          }
          for(var o = 0;o<caminos[i].length;o++){
            if(pos==caminos[i][o]){
              conexiones.push(i);
            }
          }
        }
      return conexiones;
    }


    function soyVecinoPotencial(candidatos,caminos,index,jugador,tamaño,validas){
      var cond = [];
      for(var e= 0;e<candidatos.length;e++){
      //  console.log(candidatos);
        var pos = calcularPos(candidatos[e][0],tamaño,jugador);
      //  console.log(pos);
        var conexiones = recorrerCaminos(pos,caminos,index);

        if(conexiones.length != 0){

          for(var n = 0;n<conexiones.length;n++){

            var opc1 = calcularPos(candidatos[e][1],tamaño,"2");
            var opc2 = calcularPos(candidatos[e][2],tamaño,"2");
            var caso1 = validas.indexOf(opc1);
            var caso2 = validas.indexOf(opc2);

            if(caso1 != -1 || caso2 != -1){
              if(caso1 == -1 || caso2 == -1){
                cond.push([conexiones,'D']);//
              }else{
                cond.push([conexiones,'V']);//
              }

            }
          }

        }
      }

      return cond;
    }

    function soyVecinoPotencialD(candidatos,caminos,index,jugador,tamaño,validas){
      var cond = [];
      //console.log(index);
      //console.log(candidatos);
      for(var e= 0;e<candidatos.length;e++){

        var pos = calcularPos(candidatos[e][0],tamaño,jugador);
      //  console.log(pos);
        var conexiones = recorrerCaminos(pos,caminos,index);

        if(conexiones.length != 0){

          for(var n = 0;n<conexiones.length;n++){

            var opc1 = calcularPos(candidatos[e][1],tamaño,"2");

            var caso1 = validas.indexOf(opc1);


            if(caso1 != -1){
                cond.push([conexiones,'D']);//
            }
          }

        }
      }

      return cond;
    }
    function calcularCaminosV(caminosv1,tamaño,jugador,validas){

      var caminoV  = 0;
      var caminoD = 0;
      //console.log(caminosv1);
      var listas = [];
      var longitud = caminosv1.length;
      for(var l = 0; l<longitud ; l++){
          listas.push([]);
        }
      for(var a = 0; a<caminosv1.length; a++){
        var novisita = listas[a];

        var minicamino = caminosv1[a];

        var final = minicamino.length - 1;
        var Inicio = calcularCoords(minicamino[0],tamaño,jugador);
        var Final = calcularCoords(minicamino[final],tamaño,jugador);

        var posiblesI = CalcularPosNodos(Inicio,tamaño);
        var posiblesF = CalcularPosNodos(Final,tamaño);

        var analizarI = soyVecinoPotencial(posiblesI[0],caminosv1,a,jugador,tamaño,validas);
        var analizarF = false;
        if(final != 0){
          analizarF = soyVecinoPotencial(posiblesF[0],caminosv1,a,jugador,tamaño,validas);
        }

        /////////
        var analizarID = soyVecinoPotencialD(posiblesI[1],caminosv1,a,jugador,tamaño,validas);
        var analizarFD = false;
        if(final != 0){
          analizarFD = soyVecinoPotencialD(posiblesF[1],caminosv1,a,jugador,tamaño,validas);
        }
        //console.log(a);
        //console.log(analizarID);
        //console.log(analizarFD);
        if(analizarI.length != 0){

          for(var d=0; d<analizarI.length;d++){

            var conexion = analizarI[d];
            if(conexion[1]== 'V'){
              var indexito = novisita.indexOf(conexion[0][0]);
              if(indexito == -1){
                caminoV = caminoV + 1;
                novisita.push(conexion[0][0]);
                listas[conexion[0][0]].push(a);
              }

            }else{
              var indexito = novisita.indexOf(conexion[0][0]);
              if(indexito == -1){
                caminoD = caminoD + 1;
                novisita.push(conexion[0][0]);
                listas[conexion[0][0]].push(a);
              }

            }
          }
        }
        //////////
        if(analizarID.length != 0){

          for(var d=0; d<analizarID.length;d++){

            var conexion = analizarID[d];

              var indexito = novisita.indexOf(conexion[0][0]);
              if(indexito == -1){
                caminoD = caminoD + 1;
                novisita.push(conexion[0][0]);
                listas[conexion[0][0]].push(a);
              }


          }
        }


        ////////
        if(final!=false){
          if(analizarF.length != 0){
          for(var d=0; d<analizarF.length;d++){
            var conexion = analizarF[d];
            if(conexion[1]== 'V'){
              var indexito = novisita.indexOf(conexion[0][0]);
              if(indexito == -1){
                caminoV = caminoV + 1;
                novisita.push(conexion[0][0]);
                listas[conexion[0][0]].push(a);
              }
            }else{
             var indexito = novisita.indexOf(conexion[0][0]);
              if(indexito == -1){
                caminoD = caminoD + 1;
                novisita.push(conexion[0][0]);
                listas[conexion[0][0]].push(a);
              }
            }
          }
        }
    //////////
    if(analizarFD.length != 0){
          for(var d=0; d<analizarFD.length;d++){
            var conexion = analizarFD[d];

             var indexito = novisita.indexOf(conexion[0][0]);
              if(indexito == -1){
                caminoD = caminoD + 1;
                novisita.push(conexion[0][0]);
                listas[conexion[0][0]].push(a);
              }

          }
        }

    /////////
        }

      }
      return [caminoV,caminoD,listas];

    }



    function contarCaminos(caminos,tamaño){
      var mayor = 0;
      var array = [];
      for(var e = 0;e<caminos.length;e++){
        var numero = caminos[e].length;
        array.push(e);

       // console.log(caminos[e][0]);

        if(Math.floor(caminos[e][0]/tamaño)==0){
          if(Math.floor(caminos[e][numero-1]/tamaño)==(tamaño-1)){
            return 'H';
          }
        }


        if(mayor<numero){
          mayor = numero
        }

      }
      mayor = JSON.parse( JSON.stringify( mayor ) );
      return [mayor,array];
    }

    function unirCaminos(caminos,listaU,nounidos,index,mini,caminosV,contador){

      minicamino = [];

      if(listaU[index].length==0){
        var minicamino = JSON.parse( JSON.stringify(caminos[mini]) );
        var minicontador = JSON.parse( JSON.stringify(contador) );
        //console.log(minicamino);
        caminosV.push([minicamino,minicontador]);
        //console.log(caminosV);
        EliminarMatriz(nounidos,index);
        if(nounidos.length==0){
          return caminosV;
        }
        var mini = JSON.parse( JSON.stringify(nounidos[0]) );
        var index =  JSON.parse( JSON.stringify(nounidos[0]) );
        unirCaminos(caminos,listaU,nounidos,mini,index,caminosV,0);
      }else{
        for(var e= 0;e<listaU[index].length;e++){
          if(nounidos.indexOf(listaU[index][e])!=-1){

          caminos[mini] = caminos[mini].concat(caminos[listaU[index][e]]);
          contador= contador + 1;
          EliminarMatriz(nounidos,index);
          EliminarMatriz(nounidos,listaU[index][e]);
          EliminarMatriz(listaU[listaU[index][e]],index);
          //console.log(listaU);
          //console.log(listaU[index][e]);
          unirCaminos(caminos,listaU,nounidos,listaU[index][e],mini,caminosV,contador);
          }

        }
      }
      //console.log(caminos);
      return caminosV;
    }
    function jugadasfaltantes(caminosV,tamaño){
      var menor = 100;
      for(var e = 0;e<caminosV.length;e++){
        caminosV[e][0].sort(function compareNumbers(a, b)
        {return a - b;});
        var tamaño1 = caminosV[e][0].length - 1;
        //console.log(caminosV[e][0]);
        var inicio = Math.floor(caminosV[e][0][0]/tamaño);
        //console.log(inicio);
        var final =  Math.floor(caminosV[e][0][tamaño1]/tamaño);
        //console.log(final);
        var faltantes = caminosV[e][1]+ inicio + (tamaño - 1 - final  );
        if(faltantes<menor){
          menor = faltantes;
        }
      }
      return menor;
    }
    function calcularHeuristica(mapa,tamaño,validas,jugador){
      var caminosE = null;
      var listaE = null;
      var miscaminos=calcularCaminos(mapa,tamaño,jugador);
      if(jugador=="2"){
      caminosE = calcularCaminos(mapa,tamaño,"1");
      listaE = calcularCaminosV(caminosE,tamaño,"1",validas);
      }else{
      caminosE = calcularCaminos(mapa,tamaño,"2");
      listaE = calcularCaminosV(caminosE,tamaño,"2",validas);
      }
      var listaA = calcularCaminosV(miscaminos,tamaño,jugador,validas);
      //console.log(miscaminos);
      //console.log(caminosE);
      //console.log(listaA);
      //console.log(listaE);
      var caminoA1 = contarCaminos(miscaminos,tamaño);
      var caminoE1 = contarCaminos(caminosE,tamaño);


     // console.log('heyyyyy');


      var caminoA = caminoA1[0];
      var caminoE = caminoE1[0];
      var conexionesVA= listaA[0];
      var conexionesDA= listaA[1];
      var conexionesVE= listaE[0];
      var conexionesDE= listaE[1];


      if (caminoA=='H'){
        return 10000;
      }
      if (caminoE=='H'){
        return -10000;
      }

      var caminosVA= unirCaminos(miscaminos,listaA[2],caminoA1[1],0,0,[],0);

      var caminosVE= unirCaminos(caminosE,listaE[2],caminoE1[1],0,0,[],0);
      var jugadasFA = jugadasfaltantes(caminosVA,tamaño);
      var jugadasFE = jugadasfaltantes(caminosVE,tamaño);
     // console.log(jugadasFA);
     // console.log(jugadasFE);
      var sumaA =  conexionesVA*2+caminoA-jugadasFA;
      //console.log(sumaA);
      var sumaB =  conexionesVE*2+caminoE-jugadasFE;
      return sumaA-sumaB;
      //console.log(sumaB);
    }


    function minMax(tablero, jugadorOficial, turno, contador, profundidad, alpha, beta, validas,hash) {
      const tamaño = tablero.length;
      var mejor = 10000;
      var peor = -10000;
      var bestScore = -100000;
      if (contador % 2 == 1) {
        bestScore = 100000;
      }
      let MiJugada = [];
      let jugadasT = validas.length;
      for (var n = 0; n < jugadasT; n++) {
        if (validas[n] >= 0) {
          let pos = JSON.parse( JSON.stringify( validas[n] ) );
          let coords = calcularCoords(pos,tamaño,"2");
          //console.log(validas[n]);
          validas[n] = -1;
          tablero[coords[0]][coords[1]] = turno;
          let score = 0;



            score = calcularHeuristica(tablero,tamaño,validas,jugadorOficial);

            //console.log(score);
            if (hash.indexOf(score)==-1) {
            //Muere
          } else {
            if (contador != profundidad||score!=mejor||score!=peor) {
              var siguienteTurno = 0;
              if(turno=='1'){
                siguienteTurno = '2';
              }else{
                siguienteTurno = '1';
              }
              var array = minMax(tablero, jugadorOficial, siguienteTurno, contador + 1, profundidad, alpha, beta, validas,hash);
               score = array[0];
            }

            hash.push(score);
          }

           tablero[coords[0]][coords[1]] = 0;

           if (contador % 2 == 1) {
          //   console.log('hola');
            if (score < bestScore) {
              bestScore = score;
              MiJugada = coords;
              if (score < beta)
                beta = score;
            }
          } else {
          //  console.log('adios');
            if (score > bestScore) {
              bestScore = score;
              MiJugada = coords;
              if (score > alpha)
                alpha = score;
            }
          //  console.log(bestScore);
          //  console.log(MiJugada);
          }
          validas[n] = pos;

          if (alpha >= beta) {
            break;
          }
        }
      }
      return  [bestScore, MiJugada ]

    }

},{"ai-agents":4}]},{},[]);

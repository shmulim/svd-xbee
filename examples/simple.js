var util = require('util');
var parser = require('./simple-parser.js');
var XBee = require('../index.js').XBee;

// Replace with your xbee's UART location
var xbee = new XBee('/dev/ttyO1');
//var xbee = new XBee('/dev/ttyO1', parser);
xbee.init();

xbee.on("configured", function(config) {
  console.log("XBee Config: %s", util.inspect(config));
});


xbee.on("node", function(node) {
  console.log("Node %s connected", node.remote64.hex);

  node.on("data", function(data) {
    console.log("%s: %s", node.remote64.hex, util.inspect(data)); 
    //node.send("pong", function(err, status) {});
  });

});

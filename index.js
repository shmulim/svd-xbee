var util = require('util');
var EventEmitter = require('events').EventEmitter;
var api = require("./lib/xbee-api.js");
var serialport = require("serialport");
var async = require('async');
var os = require('os');

var C = api.Constants;

function XBee(options) { 
  EventEmitter.call(this);

  // Option Parsing
  if (typeof options === 'string') {
    this.options = { port: options };
  } else {
    this.options = options;
  }

  this.tools = api.tools;

  this.data_parser = options.data_parser || undefined;

  this.use_heartbeat = options.use_heartbeat || false;
  this.heartbeat_packet = options.heartbeat_packet || '```';
  this.heartbeat_timeout = options.heartbeat_timeout || 8000;

  // How long (in ms) shall we wait before deciding that a transmit hasn't been successful?
  this.transmit_status_timeout = options.transmit_status_timeout || 1000;

  if (options.api_mode) api.api_mode = options.api_mode;

  // Current nodes
  this.nodes = {};
}

util.inherits(XBee, EventEmitter);

XBee.prototype.init = function(cb) {
  var self = this;
  // Serial connection to the XBee
  self.serial = new serialport.SerialPort(self.options.port, {
    baudrate: self.options.baudrate || 9600,
    databits: 8,
    stopbits: 1,
    parity: 'none',
    parser: api.packetBuilder()
  });

  self.serial.on("open", function() {
    self.readParameters.bind(self)(cb);
  });

  var exit = function() { 
    self.serial.close(function(err) {
      if (err) console.log("Error closing port: "+util.inspect(err));
      process.exit();
    });
  }
  
  if (os.platform() !== 'win32') {
    process.on('SIGINT', exit);
  }


  /* Frame-specific Handlers */

  // Whenever a node is identified (on ATND command).
  self._onNodeDiscovery = function(data) {
    var node = data.node;
    if (!self.nodes[node.remote64.hex]) {
      self.nodes[node.remote64.hex] = new Node(self, node, self.data_parser);
      self.emit("newNodeDiscovered", self.nodes[node.remote64.hex]);
    } else {
      // update 16-bit address, as it may change during reconnects.
      self.nodes[node.remote64.hex].remote16 = node.remote16;
      self.nodes[node.remote64.hex].id = node.id;
      self.nodes[node.remote64.hex].emit("discovered", self.nodes[node.remote64.hex]);
    }
    self.nodes[node.remote64.hex].connected = true;
  }

  // Modem Status
  self._onModemStatus = function(res) {
    if (res.status == C.MODEM_STATUS.JOINED_NETWORK) {
      self.emit("joinedNetwork");  
    } else if (res.status == C.MODEM_STATUS.HARDWARE_RESET) {
      self.emit("hardwareReset");
    } else if (res.status == C.MODEM_STATUS.WATCHDOG_RESET) {
      self.emit("watchdogReset");
    } else if (res.status == C.MODEM_STATUS.DISASSOCIATED) {
      self.emit("disassociated");
    } else if (res.status == C.MODEM_STATUS.COORDINATOR_STARTED) {
      self.emit("coordinatorStarted");
    } else {
      console.warn("Modem status: ", C.MODEM_STATUS[res.status]);
    }
  }

  // Loose AT Command Responses from remote AT Commands.
  // Should not arrive here if callback was passed to remote AT cmd.
  self._onRemoteCommandResponse = function(res) {
    if (self.nodes[res.remote64.hex]) {
      self.nodes[res.remote64.hex]._onRemoteCommandResponse(res);
    } 
  }

  // Messages
  self._onReceivePacket = function(data) {
    if (!self.nodes[data.remote64.hex]) {
      var _data = { node:data };
      self._onNodeDiscovery(_data);
    }
    self.nodes[data.remote64.hex]._onReceivePacket(data);
  }

  // Data samples (from XBee's I/O)
  self._onDataSampleRx = function(data) {
    if (!self.nodes[data.remote64.hex]) {
      var _data = { node:data };
      self._onNodeDiscovery(_data);
    }
    self.nodes[data.remote64.hex]._onDataSampleRx(data);
  }

  self.serial.on(C.FRAME_TYPE.MODEM_STATUS,             self._onModemStatus);
  self.serial.on(C.FRAME_TYPE.REMOTE_COMMAND_RESPONSE,  self._onRemoteCommandResponse);
  self.serial.on(C.FRAME_TYPE.NODE_IDENTIFICATION,      self._onNodeDiscovery);
  self.serial.on(C.FRAME_TYPE.ZIGBEE_RECEIVE_PACKET,    self._onReceivePacket);
  self.serial.on(C.FRAME_TYPE.ZIGBEE_IO_DATA_SAMPLE_RX, self._onDataSampleRx);
  
  self._queue = async.queue(function(task, callback) {
    async.series(task.packets, function(err, data) {
      if (typeof task.cb === 'function') task.cb(err, data[data.length-1]);
      callback();
    });
  }, 1);
}

XBee.prototype.readParameters = function(_done_cb) {
  var self = this;

  // Returns a function that initiates an AT command to
  // query a configuration parameter's value. 
  // To be passed to an async.parallel.
  var QF = function(command, val, f) { // Format the result using f
    f = typeof f !== 'undefined' ? f : function(a){return a};
    return function(cb) {
      self._AT(command, val, function(err, data) {
        if (!err) {
          cb(err, f(data.commandData));
        } else {
          console.error('Error: XBee.readParameters.QF; ', err.msg);
        }
      });
    }
  }

  var parameters = {
    panid:             QF('ID', undefined, api.tools.bArr2HexStr),
    id:                QF('NI', undefined, api.tools.bArr2Str),
    sourceHigh:        QF('SH', undefined, api.tools.bArr2HexStr),
    sourceLow:         QF('SL', undefined, api.tools.bArr2HexStr),
    nodeDiscoveryTime: QF('NT', undefined, function(a) { return 100 * api.tools.bArr2Dec(a); })
  };
  
  var done = function(err, results) {
    if (err) {
      self.emit("error", new Error("Failure to read XBee params: "+util.inspect(err)));
      if (typeof _done_cb === 'function') _done_cb(err);
    }
    self.parameters = results;
    self.emit("initialized", self.parameters);
    if (typeof _done_cb === 'function') _done_cb(null, self.parameters);
  }

  // Using async to read parameters
  var res_stop = Object.keys(parameters).length;
  var results = {};
  for (k in parameters) {
    parameters[k]((function(key) {
      return function(err, data) {
        if (err) return done(err, null);
        results[key] = data; 
        // TODO: Timeout?
        if (--res_stop === 0) {
          done(null, results);
        }
      }
    })(k));
  }
}

// Add a node by hand.
XBee.prototype.addNode = function(remote64) {
  var self = this;
  var remote16 = [0xff,0xfe]; // Unknown
  var node = {
    remote16: { dec: remote16, hex: api.tools.bArr2HexStr(remote16) },
    remote64: { dec: remote64, hex: api.tools.bArr2HexStr(remote64) }
  };

  if (!self.nodes[node.remote64.hex]) {
    self.nodes[node.remote64.hex] = new Node(self, node, self.data_parser);
    self.nodes[node.remote64.hex].connected = false;
  }

  return self.nodes[node.remote64.hex];
}

// Run network discovery. Associated nodes can report in
// for config.nodeDiscoveryTime ms.
XBee.prototype.discover = function(cb) {
  var self = this;
  var cbid = self._AT('ND');
  self.serial.on(cbid, self._onNodeDiscovery);
  setTimeout(function() {
    if (typeof cb === 'function') cb(); 
    self.removeAllListeners(cbid);
    self.emit("discoveryEnd");
  }, self.parameters.nodeDiscoveryTime || 6000);
}

XBee.prototype.broadcast = function(data, cb) {
  var remote64 = [0x00,0x00,0x00,0x00,0x00,0x00,0xff,0xff];
  var remote16 = [0xff,0xfe]; 
  this._send(data, remote64, remote16, cb);
}

XBee.prototype._makeTask = function(packet) {
  var self = this;
  return function Writer(cb) {
    //console.log("<<< "+util.inspect(packet.data));
    //console.log("<<< "+packet.data);

    var timeout = setTimeout(function() {
      cb({ msg: "Never got Transmit status from XBee" });
    }, self.transmit_status_timeout );
    self.serial.write(packet.data, function(err, results) {
      if (err) {
        cb(err);
      } else {
        //console.log(util.inspect(packet.data));
        if (results != packet.data.length) return cb(new Error("Not all bytes written"));
        self.serial.once(packet.cbid, function(data) {
          //console.log("Got Respones: "+packet.cbid);
          clearTimeout(timeout);
          var error = null;
          if (data.commandStatus && data.commandStatus != C.COMMAND_STATUS.OK) {
            error = C.COMMAND_STATUS[data.commandStatus];
          } else if (data.deliveryStatus && data.deliveryStatus != C.DELIVERY_STATUS.SUCCESS) {
            error = C.DELIVERY_STATUS[data.deliveryStatus];
          }
          cb(error, data);
        });
      }
    });
  };
}

XBee.prototype._send = function(data, remote64, remote16, _cb) {
  var packets = [];
  while (data.length > 0) {
    var frame = new api.TransmitRFData();
    frame.destination64 = remote64.dec;
    frame.destination16 = remote16.dec;
    frame.RFData = data.slice(0, C.MAX_PAYLOAD_SIZE);
    data = data.slice(C.MAX_PAYLOAD_SIZE);
    packets.push(this._makeTask({
      data: frame.getBytes(),
      cbid: C.FRAME_TYPE.ZIGBEE_TRANSMIT_STATUS + C.EVT_SEP + frame.frameId
    }));
  }

  this._queue.push({ packets:packets, cb:_cb });
}

XBee.prototype.AT = function(cmd, val, _cb) {
  this._AT(cmd, val, _cb);
}

XBee.prototype._AT = function(cmd, val, _cb) {
  // val parameter is optional
  if (typeof val === 'function') {
    _cb = val;
    val = undefined;
  }

  var frame = new api.ATCommand();
  frame.setCommand(cmd);
  frame.commandParameter = val;
  var cbid = C.FRAME_TYPE.AT_COMMAND_RESPONSE + C.EVT_SEP + frame.frameId;
  var packet = [this._makeTask({
    data: frame.getBytes(),
    cbid: cbid
  })];
  this._queue.push({ packets:packet, cb:_cb });
  return cbid;
}


XBee.prototype._remoteAT = function(cmd, remote64, remote16, val, _cb) {
  // val parameter is optional
  if (typeof val === 'function') {
    _cb = val;
    val = undefined;
  }

  var frame = new api.RemoteATCommand();
  frame.setCommand(cmd);
  frame.commandParameter = val;
  frame.destination64 = remote64.dec;
  frame.destination16 = remote16.dec;
  var cbid = C.FRAME_TYPE.REMOTE_COMMAND_RESPONSE + C.EVT_SEP + frame.frameId;
  var packet = [this._makeTask({
    data: frame.getBytes(),
    cbid: cbid
  })];
  this._queue.push({ packets:packet, cb:_cb });
  return cbid;
}

exports.XBee = XBee;

function Node(xbee, params, data_parser) {
  EventEmitter.call(this);
  this.xbee = xbee;
  this.remote16 = params.remote16;
  this.remote64 = params.remote64;
  this.id = params.id || "";
  this.deviceType = params.deviceType || -1;
  this.buffer = "";
  if (typeof data_parser === 'function')
    this.parser = data_parser(this);
  this.timeout = {};
  this.connected = true;
  this.refreshTimeout();
}

util.inherits(Node, EventEmitter);

Node.prototype.timeoutOccured = function() {
  this.connected = false;
  this.emit('disconnect');
}

Node.prototype.refreshTimeout = function() {
  clearTimeout(this.timeout);
  this.timeout = setTimeout(this.timeoutOccured.bind(this), this.xbee.heartbeat_timeout);
  if (!this.connected) {
    this.connected = true;
    // todo other stuff
  }
}

Node.prototype.send = function(data, cb) {
  this.xbee._send(data, this.remote64, this.remote16, cb);
}

Node.prototype._onReceivePacket = function(data) {
  // TODO: should be buffer all along!
  var packet = new Buffer(data.rawData).toString('ascii');
  if (this.xbee.use_heartbeat && packet === this.xbee.heartbeat_packet)
    this.refreshTimeout();
  else if (this.parser !== undefined)
    this.parser.parse(packet);
  else
    this.emit('data', packet);
}

Node.prototype.AT = function(cmd, val, cb) {
  var cbid;
  // val parameter is optional
  if (typeof val === "function") {
    // use val as the callback in this case
    cbid = this.xbee._remoteAT(cmd, this.remote64, this.remote16, val);
  } else {
    cbid = this.xbee._remoteAT(cmd, this.remote64, this.remote16, val, cb);
  }

  /*
  this.xbee.serial.on(cbid, function(res) {
    console.log("Remote AT Response (2): ", util.inspect(err), util.inspect(res));
  });
  */
}

Node.prototype._onRemoteCommandResponse = function(res) {
  console.warn("Remote Command Response not Implemented.", util.inspect(res));
}


Node.prototype.isCoordinator = function() {
  return this.deviceType === C.DEVICE_TYPES.COORDINATOR;
}

Node.prototype.isRouter = function() {
  return this.deviceType === C.DEVICE_TYPES.ROUTER;
}

Node.prototype.isEndDevice = function() {
  return this.deviceType === C.DEVICE_TYPES.END_DEVICE
}


/*
Node.prototype._onATResponse = function(res) {
  console.log("Node %s got AT_RESPONSE: %s", util.inspect(res));
}
*/

Node.prototype._onDataSampleRx = function(res) {
  this.emit('io', res.ioSample);  
}

exports.Node = Node;

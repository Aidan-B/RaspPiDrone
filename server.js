//server data (client-server)
var http = require('http').createServer(handler)
var io = require('socket.io')(http);
var fs = require('fs');
var serverPort = 8080;

//serial data (server-flight controller)
var mspFuncs = require('./mspfunctions.js');
var serialport = require('serialport');
var portLocation = '/dev/ttyUSB0';
var serialPort = new serialport(portLocation, { baudRate : 115200 });

var dataRate = 200;
var motorData, attitude, altitude, rcData;
var controller = {
  throttle: 1000,
  pitch: 1500,
  roll: 1500,
  yaw: 1500,
  aux1: 1000,
  aux2: 1000,
  aux3: 1000,
  aux4: 1000
};

console.log('Server Started');
http.listen(serverPort);
console.log('Listening on port: ' + serverPort);

//Serve index.html
function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }
    res.writeHead(200);
    res.end(data);
  });
}

serialPort.on('open', function () {
  console.log('Flight controller connected at: ' + portLocation);
  setInterval(function() {

    serialPort.write(mspFuncs.MSP_MOTOR(), function (err) {
      //console.log(err);
    });
    serialPort.write(mspFuncs.MSP_ATTITUDE(), function (err) {
      //console.log(err);
    });
    serialPort.write(mspFuncs.MSP_RC(), function (err) {
      //console.log(err);
    });
    serialPort.write(mspFuncs.MSP_ALTITUDE(), function (err) {
      //console.log(err);
    });

  }, dataRate);

  setInterval(function() {
    serialPort.write(mspFuncs.MSP_SET_RAW_RC(controller.throttle, controller.roll, controller.pitch, controller.yaw, controller.aux1, controller.aux2, controller.aux3, controller.aux4))
  }, 20);

  //received data from flight controller
  serialPort.on('data', function (data) {
    if (data[4] == 104) { //MSP_MOTOR
      //console.log('MSP_MOTOR');
      motorData = {};
      for (var count = 0; count < 8; count++) {
        var motor = data.readInt16LE(5 + (count * 2));
        if (motor != 0) {
          motorData['m' + (count+1)] = motor;
        }
      }
      //console.log(motorData);
    }

    if (data[4] == 108) { //MSP_ATTITIDE
      //console.log('MSP_ATTITIDE');
      var roll = data.readInt16LE(5) / 10.0;
      var pitch = data.readInt16LE(7) / 10.0;
      var yaw = data.readInt16LE(9);
      attitude = {roll: roll, pitch: pitch, yaw: yaw};
      //console.log(attitude);
    }
    if (data[4] == 109) {//MSP_ALTITUDE
      altitude = {cm: data.readInt32LE(5), cmps: data.readInt16LE(9)};
      //console.log(rcData);
    }
    if (data[4] == 200 && data[4] == data[5]) { //MSP_SET_RAW_RC
      //console.log(JSON.stringify(data));
    }
    if (data[4] == 105) {//MSP_RC
      rcData = mspFuncs.ReturnMSP_RC(data);
      //console.log(rcData);
    }
  });




});
serialPort.on('close', function () {
  console.log('Flight controller disconnected');
  controller.aux4 = 2000; //activate FAILSAFE
});

io.on('connection', function (socket) {
  console.log('Client connected');

  setInterval(function() {
    socket.emit('motorData', motorData);
    socket.emit('attitude', attitude);
    socket.emit('rcData', rcData);
    socket.emit('altitude', altitude);
  }, dataRate);

  socket.on('RC', function(data) {
    controller = data;
  })

  socket.on('disconnect', function() {
    console.log('Client disconnected');
    controller.aux4 = 2000; //activate FAILSAFE
  });
});

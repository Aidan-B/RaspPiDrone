/*
MultiWii Serial Protocol
MSP is a protocol designed by the MultiWii community, with the idea to be light, generic, bit wire efficient, secure. The MSP data frames are structured as:

$<header>,<direction>,<size>,<command>,<crc>$
where:

header: the ASCII characters $\$M$
direction: the ASCII character $<$ if the message goes to the MultiWii board or $>$ if the message is coming from the board
size: number of data bytes, binary. Can be zero as in the case of a data request to the board
command: message id of MSP
data: values to be sent. UINT16 values are LSB first
crc: (cyclic redundancy check) checksum, XOR of $<size>,<command>$ and each data byte into a zero sum
*/

function int16ToInt8(num) {
  var num8Bit1 = num & 0xff;
  var num8Bit2 = ((num >> 8) & 0xff);
  return [num8Bit1, num8Bit2];
}

module.exports = {

  MSP_ATTITUDE: function() {
    return [36, 77, 60, 0, 108, 108];
  },

  MSP_ALTITUDE: function() {
    return [36, 77, 60, 0, 109, 109];
  },

  MSP_MOTOR: function() {
   return [36, 77, 60, 0, 104, 104];
  },

  MSP_RC: function() {
    return [36, 77, 60, 0, 105, 105];
  },

  MSP_SET_RAW_RC: function(throttle, roll, pitch, yaw, aux1, aux2, aux3, aux4) {
    var out = [36, 77, 60, 16, 200];
    var cs = 16 ^ 200;
    var inputs = [roll, pitch, throttle, yaw, aux1, aux2, aux3, aux4];
    inputs.forEach(function(data) {
      int16ToInt8(data).forEach(function(value) {
        cs ^= value;
        out.push(value);
      });
    })
    out.push(cs);

    return out;
  },

  MSP_SET_MOTOR: function(m1, m2, m3, m4, m5, m6, m7, m8) {
    var out = [36, 77, 60, 16, 214];
    var cs = 16 ^ 214;
    var inputs = [m1, m2, m3, m4, m5, m6, m7, m8];
    inputs.forEach(function(data) {
      int16ToInt8(data).forEach(function(value) {
        cs ^= value;
        out.push(value);
      });
    })
    out.push(cs);

    return out;
  },


  ReturnMSP_RC: function(data) {
    var roll = data.readInt16LE(5);
    var pitch = data.readInt16LE(7);
    var yaw = data.readInt16LE(9);
    var throttle = data.readInt16LE(11);
    var aux1 = data.readInt16LE(13);
    var aux2 = data.readInt16LE(15);
    var aux3 = data.readInt16LE(17);
    var aux4 = data.readInt16LE(19);
    return {throttle: throttle, roll: roll, pitch: pitch, yaw: yaw, aux1: aux1, aux2: aux2, aux3: aux3, aux4: aux4}
  }

}

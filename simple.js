// remote control using the sensortag library
var SensorTag = require('sensortag');
var applescript = require('applescript');

SensorTag.discover(function(sensorTag) {
    console.log("Found " + sensorTag);
    
    sensorTag.connectAndSetUp(function(error) {
        sensorTag.notifySimpleKey();        
    });
    
    sensorTag.on('simpleKeyChange', function(left, right) {
        if (right) {
            applescript.execFile('right.applescript');
        } else if (left) {
            applescript.execFile('left.applescript');
        }
    });
    
});
var DISCOVER_TIMEOUT = 10 * 1000; // ms

var noble = require('noble');
var applescript = require('applescript');

var scanTimeout = null;;

function startScanning() {
    noble.startScanning([], false, function() {
        console.log("Scan Started.");

        scanTimeout = setTimeout(stopScanning, DISCOVER_TIMEOUT);
    }); // any service UUID, no duplicates
}

function scanTimeout() {
    // TODO if we didn't find a sensor tag, log a message and exit

    stopScanning();
}

function stopScanning() {
    noble.stopScanning(function() {
        console.log("Scan Stopped.");

        isScanning = false;
    });
}

noble.on('discover', function(peripheral) {
    console.log(peripheral.toString());

    var localName = peripheral.advertisement.localName;

    // The SensorTag doesn't advertise any services, so let's filter based on local name
    if (localName && localName.match(/Sensor/)) {
        stopScanning(); // stop scanning, we found a Sensor Tag

        clearTimeout(scanTimeout); // cancel the timeout

        console.log("Attempting to connect to " + peripheral.advertisement.localName);

        connectAndSetUpSensorTag(peripheral);
    }
});

function connectAndSetUpSensorTag(peripheral) {
    peripheral.connect(function(error) {
        if (error) {
            console.log("There was an error connecting " + error);
            return; // TODO: exit?
        }

        console.log("Connected");

        var serviceUUIDs = ['FFE0'];
        var characteristicUUIDs = ['FFE1'];

        peripheral.discoverSomeServicesAndCharacteristics(serviceUUIDs, characteristicUUIDs, function(error, services, characteristics) {
            if (error) {
                console.log("Error discovering services and characteristics " + error);
                return; // TODO: exit?
            }

            var characteristic = characteristics[0];
            console.log("Found the characteristic " + characteristic);

            characteristic.notify(true, function(error) {
                if (error) {
                    console.log("Error adding notification " + error);
                    return; // TODO: exit?
                }
            });

            // This is called when notification state changes
            characteristic.on('notify', function(state) {
                console.log("Characteristic notification changed to " + state);
            });

            // This is called when the data changes
            characteristic.on('data', onCharacteristicData);
        });
    });

    peripheral.on('disconnect', onDisconnect); // attach disconnect event handler
}

function onDisconnect() {
    console.log('Peripheral disconnected!')

    // TODO exit?
}

function onCharacteristicData(data, isNotification) {
    if (isNotification) {
        if (data[0] === 1) {
            console.log("Right Arrow");
            rightArrow();
        } else if (data[0] === 2) {
            console.log("Left Arrow");
            leftArrow();
        }
    }
}

function rightArrow() {
    applescript.execFile('right.applescript', function(err, rtn) {
        if (err) {
            console.log("AppleScript failed to execute" + err);
        }
    });
}

function leftArrow() {
    applescript.execFile('left.applescript', function(err, rtn) {
        if (err) {
            console.log("AppleScript failed to execute " + err);
        }
    });
}

startScanning();

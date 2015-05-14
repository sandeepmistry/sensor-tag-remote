var noble = require('noble');
var applescript = require('applescript');

// Need this because calling noble.stopScanning in callback failing
function stop() {
    noble.stopScanning();
}

noble.on('scanStart', function() {
    console.log("Scan Started.");
    //setTimeout(noble.stopScanning, 3000);
    setTimeout(stop, 5000);
});

noble.on('scanStop', function() {
    console.log("Scan Stopped.");
    // TODO if we didn't find a sensor tag, log a message and exit
});

noble.on('discover', function(peripheral) {
    console.log(peripheral.toString());

    // The SensorTag doesn't advertise any services, so let's filter based on name
    if (peripheral.advertisement.localName && peripheral.advertisement.localName.match(/Sensor/)) {
        console.log("Attempting to connect to " + peripheral.advertisement.localName);

        peripheral.connect(function(error) {
            if (error) {
                console.log("There was an error connecting " + error);
            }
        });

        peripheral.on('connect', function() {
            console.log("Connected");

            var serviceUUIDs = ['FFE0'];
            var characteristicUUIDs = ['FFE1'];

            peripheral.discoverSomeServicesAndCharacteristics(serviceUUIDs, characteristicUUIDs, function(error, services, characteristics) {
                if (error) {
                    console.log("Error discovering services and characteristics " + error);
                    return;
                }

                var characteristic = characteristics[0];
                console.log("Found the characteristic " + characteristic);

                characteristic.notify(true, function(error) {
                    if (error) {
                        console.log("Error adding notification " + error);
                    }
                });

                // This is called when notification state changes
                characteristic.on('notify', function(state) {
                    console.log("Characteristic notification changed to " + state);
                });

                // This is called when the data changes
                characteristic.on('data', function(data, isNotification) {
                    if (isNotification) {
                        if (data[0] === 1) {
                            console.log("Right Arrow");
                            rightArrow();
                        } else if (data[0] === 2) {
                            console.log("Left Arrow");
                            leftArrow();
                        }
                    }
                });

            });

        });

    }
});

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

noble.startScanning(); // any service UUID, no duplicates

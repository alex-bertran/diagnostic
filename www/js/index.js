var platform, osVersion;
function onDeviceReady() {
    osVersion = parseFloat(device.version);
    platform = device.platform.toLowerCase();
    if(platform.match(/win/)){
        platform = "windows";
    }

    $('body').addClass(platform);

    // Bind events
    $(document).on("resume", onResume);
    $('#do-check').on("click", checkState);

    // Register change listeners for iOS+Android
    if(platform === "android" || platform === "ios") {
        cordova.plugins.diagnostic.enableDebug();

        cordova.plugins.diagnostic.registerLocationStateChangeHandler(function (state) {
            log("Location state changed to: " + state);
            checkState();
        }, function (error) {
            handleError("Error registering for location state changes: " + error);
        });
    }

    // Register change listeners for Android
    if(platform === "android"){
        cordova.plugins.diagnostic.registerPermissionRequestCompleteHandler(function(statuses){
            console.info("Permission request complete");
            for (var permission in statuses){
                switch(statuses[permission]){
                    case cordova.plugins.diagnostic.permissionStatus.GRANTED:
                        log("Permission granted to use "+permission);
                        break;
                    case cordova.plugins.diagnostic.permissionStatus.NOT_REQUESTED:
                        log("Permission to use "+permission+" has not been requested yet");
                        break;
                    case cordova.plugins.diagnostic.permissionStatus.DENIED:
                        log("Permission denied to use "+permission);
                        break;
                    case cordova.plugins.diagnostic.permissionStatus.DENIED_ALWAYS:
                        log("Permission permanently denied to use "+permission);
                        break;
                }
            }
        });

       
    }

    // iOS settings
    var onLocationRequestChange = function(status){
        log("Successfully requested location authorization: authorization was " + status);
        checkState();
    };
    $('#request-location-always').on("click", function(){
        cordova.plugins.diagnostic.requestLocationAuthorization(onLocationRequestChange, handleError, cordova.plugins.diagnostic.locationAuthorizationMode.ALWAYS);
    });

    $('#request-location-in-use').on("click", function(){
        cordova.plugins.diagnostic.requestLocationAuthorization(onLocationRequestChange, handleError, cordova.plugins.diagnostic.locationAuthorizationMode.WHEN_IN_USE);
    });

    $('#request-location').on("click", function(){
        cordova.plugins.diagnostic.requestLocationAuthorization(function(status){
            log("Successfully requested location authorization: authorization was " + status);
        }, handleError);
    });

    $('#location-settings').on("click", function(){
        cordova.plugins.diagnostic.switchToLocationSettings();
    });

    $('#get-location').on("click", function(){
        var posOptions = { timeout: 35000, enableHighAccuracy: true, maximumAge: 5000 };
        navigator.geolocation.getCurrentPosition(function(position) {
            var lat = position.coords.latitude;
            var lon = position.coords.longitude;
            log("Current position: "+lat+","+lon, true);
        }, function (err) {
            handleError("Position error: code="+ err.code + "; message=" + err.message);
        }, posOptions);
    });

    setTimeout(checkState, 500);
}


function checkState(){
    log("Checking state...");

    $('#state li').removeClass('on off');

    // Location
    var onGetLocationAuthorizationStatus;
    cordova.plugins.diagnostic.isLocationAvailable(function(available){
        $('#state .location').addClass(available ? 'on' : 'off');
    }, handleError);

    if(platform === "android" || platform === "ios") {
        cordova.plugins.diagnostic.isLocationEnabled(function (enabled) {
            $('#state .location-setting').addClass(enabled ? 'on' : 'off');
        }, handleError);


        cordova.plugins.diagnostic.isLocationAuthorized(function(enabled){
            $('#state .location-authorization').addClass(enabled ? 'on' : 'off');
        }, handleError);

        cordova.plugins.diagnostic.getLocationAuthorizationStatus(function(status){
            $('#state .location-authorization-status').find('.value').text(status.toUpperCase());
            onGetLocationAuthorizationStatus(status); // platform-specific
        }, handleError);
    }


    if(platform === "ios"){
        onGetLocationAuthorizationStatus = function(status){
            $('.request-location').toggle(status === cordova.plugins.diagnostic.permissionStatus.NOT_REQUESTED);
        }
    }

    if(platform === "android"){
        cordova.plugins.diagnostic.isGpsLocationAvailable(function(available){
            $('#state .gps-location').addClass(available ? 'on' : 'off');
        }, handleError);

        cordova.plugins.diagnostic.isNetworkLocationAvailable(function(available){
            $('#state .network-location').addClass(available ? 'on' : 'off');
        }, handleError);

        cordova.plugins.diagnostic.isGpsLocationEnabled(function(enabled){
            $('#state .gps-location-setting').addClass(enabled ? 'on' : 'off');
        }, handleError);

        cordova.plugins.diagnostic.isNetworkLocationEnabled(function(enabled){
            $('#state .network-location-setting').addClass(enabled ? 'on' : 'off');
        }, handleError);

        cordova.plugins.diagnostic.getLocationMode(function(mode){
            $('#state .location-mode').find('.value').text(mode.toUpperCase());
        }, handleError);

        onGetLocationAuthorizationStatus = function(status){
            $('#request-location').toggle(status != cordova.plugins.diagnostic.permissionStatus.GRANTED && status != cordova.plugins.diagnostic.permissionStatus.DENIED_ALWAYS);
        };

    }
  
}

function handleError(error){
    var msg = "Error: "+error;
    console.error(msg);
    alert(msg);
}

function log(msg, showAlert){
    console.log(msg);
    if(showAlert){
        alert(msg);
    }
}

function onResume(){
    checkState();
}

$(document).on("deviceready", onDeviceReady);
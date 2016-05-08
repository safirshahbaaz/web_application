var http = require('http');
var url = require('url');
var request = require('request');

var receivedResponseBody = '';
var originalResponse = '';

/**********************************************************************************************************************************/

/* HTTP Route Handler */
var httpRoute = {
	/* GET request handler */
	'GET': function(request, response, pathList) {
		/* Get Vehicle Information */
		if(!isNaN(pathList[pathList.length - 1])) {
			getVehicleInfo(pathList[pathList.length - 1], response);
		}
		/* Get Vehicle doors information */
		else if(pathList[pathList.length - 1] === 'doors') {
			if(!isNaN(pathList[pathList.length - 2])) {
				getVehicleDoorInfo(pathList[pathList.length - 2], response);
			}
			else{
				httpRoute['NA']['wrongParameters'](request, response);
			}
		}
		/* Get Vehicle Fuel Information */
		else if(pathList[pathList.length - 1] === 'fuel') {
			if(!isNaN(pathList[pathList.length - 2])) {
				getVehicleFuelInfo(pathList[pathList.length - 2], response);
			}
			else{
				httpRoute['NA']['wrongParameters'](request, response);
			}
		}
		/* Get Vehicle Battery Information */
		else if(pathList[pathList.length - 1] === 'battery') {
			if(!isNaN(pathList[pathList.length - 2])) {
				getVehicleBatteryInfo(pathList[pathList.length - 2], response);
			}
			else{
				httpRoute['NA']['wrongParameters'](request, response);
			}
		}
		/* Wrong URL sent. Return appropriate response */
		else {
			httpRoute['NA']['wrongUrl'](request, response);
		}
	},

	/* POST request handler */
	'POST': function(request, response, pathList) {
		/* Start or Stop the Vehicle */
		if(pathList[pathList.length - 1] === 'engine') {
			if(!isNaN(pathList[pathList.length - 2])) {
				var data = '';

				/* Receive the POSTed to information */
    			request.on('data', function(chunk) {
        			data += chunk.toString();
    			});

    			/* Send the request once the POSTed information is received */
    			request.on('end', function() {
        			data = eval("(" + data + ")");

        			if(data['action'] != 'START' && data['action'] != 'STOP') {
        				/* Wrong action specified */
    					httpRoute['NA']['wrongParameters'](request, response);
    				}
    				else {
    					startOrStopVehicle(pathList[pathList.length - 2], data, response);
    				}
    			});
			}
			/* Wrong URL sent */
			else{
				httpRoute['NA']['wrongParameters'](request, response);
			}
		}
		/* Wrong URL sent */
		else {
			console.log("Something went wrong!");
			httpRoute['NA']['wrongUrl'](request, response);
		}
	},

	/* Wrong URL or Parameters handler */
	'NA': {

		'wrongUrl': function(request, response){
			response.writeHead(404);
			response.end('<h1> Wrong URL entered </h1>');
		},

		'wrongParameters': function(request, response){
			response.writeHead(404);
			response.end('<h1> Wrong parameters passed </h1>');
		},
	}
};

/**********************************************************************************************************************************/

/* Response Generators */
var routes = {
	/* Vehicle Information Response  */
	'vehicleInfo': function() {
		var responseFields = {
			'vin': receivedResponseBody['data']['vin']['value'],
			'color': receivedResponseBody['data']['color']['value'],
		};
		if(receivedResponseBody['data']['fourDoorSedan']['value'] == 'True'){
			responseFields["doorCount"] = 4;
		}
		else{
			responseFields["doorCount"] = 2;
		}
		responseFields["driveTrain"] = receivedResponseBody['data']['driveTrain']['value'];

		originalResponse.writeHead(200, {'Content-Type': 'application/json'});
		originalResponse.end(JSON.stringify(responseFields));
	},

	/* Vehicle Door Response */
	'vehicleDoorInfo': function() {
		var responseFields = [];
		for(i = 0; i < receivedResponseBody['data']['doors']['values'].length; i++){
			var jsonInfo = {
				'location': receivedResponseBody['data']['doors']['values'][i]['location']['value']
			};

			if(receivedResponseBody['data']['doors']['values'][i]['locked']['value'] === 'True'){
				jsonInfo['locked'] = true;
			}
			else {
				jsonInfo['locked'] = false;
			}

			responseFields.push(jsonInfo);
		}

		originalResponse.writeHead(200, {'Content-Type': 'application/json'});
		originalResponse.end(JSON.stringify(responseFields));
	},

	/* Vehichle Fuel Information Response */
	'vehicleFuelInfo': function() {
		var responseFields = {
			'percent': receivedResponseBody['data']['tankLevel']['value'],
		};

		originalResponse.writeHead(200, {'Content-Type': 'application/json'});
		originalResponse.end(JSON.stringify(responseFields));
	},

	/* Vehichle Battery Information Response */
	'vehicleBatteryInfo': function() {
		var responseFields = {
			'percent': receivedResponseBody['data']['batteryLevel']['value'],
		};

		originalResponse.writeHead(200, {'Content-Type': 'application/json'});
		originalResponse.end(JSON.stringify(responseFields));
	},

	/* Vehichle Start or Stop Response */
	'vehicleStartOrStopInfo': function() {
		
		var responseFields = {};

		if(receivedResponseBody['actionResult']['status'] === 'EXECUTED') {
			responseFields['status'] = 'success';
		}
		else if(receivedResponseBody['actionResult']['status'] === 'FAILED') {
			responseFields['status'] = 'error';
		}
		else {
			/* Not likely to happen but nevertheless */
			responseFields['status'] = 'failed';
		}

		originalResponse.writeHead(200, {'Content-Type': 'application/json'});
		originalResponse.end(JSON.stringify(responseFields));
	}
};

/**********************************************************************************************************************************/

/* Function to call the appropriate response generator */
var storeParseReturntheResponse = function(body, actionType){
	receivedResponseBody = body;
	console.log(receivedResponseBody);
	routes[actionType]();
}

/**********************************************************************************************************************************/

/* Callback functions for each of the different responses */

var receiveVehicleInfo = function(error, response, body) {
	if (!error && response.statusCode === 200) {
		storeParseReturntheResponse(body, 'vehicleInfo');
	}
}

var receiveVehicleDoorInfo = function(error, response, body) {
	if (!error && response.statusCode === 200) {
		storeParseReturntheResponse(body, 'vehicleDoorInfo');
	}
}

var receiveVehicleFuelInfo = function(error, response, body) {
	if (!error && response.statusCode === 200) {
		storeParseReturntheResponse(body, 'vehicleFuelInfo');
	}
}

var receiveVehicleBatteryInfo = function(error, response, body) {
	if (!error && response.statusCode === 200) {
		storeParseReturntheResponse(body, 'vehicleBatteryInfo');
	}
}

var receiveVehicleStartOrStopInfo = function(error, response, body) {
	if (!error && response.statusCode === 200) {
		storeParseReturntheResponse(body, 'vehicleStartOrStopInfo');
	}
}

/**********************************************************************************************************************************/

/* Function to send the request to the Server */
var sendTheRequest = function(urlString, requestFields, callBackFunction){

	request({
		uri: urlString,
		method: "POST",
		timeout: 10000,
	  	followRedirect: true,
	  	maxRedirects: 100,
	  	json: true,
		headers: {
			'content-type': 'application/json'
		},
		body: requestFields
	}, callBackFunction);

}

/**********************************************************************************************************************************/

/* Starting functions to send the requests */

var getVehicleInfo = function(vehicleId, response) {
	console.log("I entered here", vehicleId);

	originalResponse = response;

	var urlString = "http://gmapi.azurewebsites.net/getVehicleInfoService";
	var requestFields = {
		"id": vehicleId,
		"responseType": "JSON"
	}
	sendTheRequest(urlString, requestFields, receiveVehicleInfo);
}

var getVehicleDoorInfo = function(vehicleId, response) {
	console.log("I entered here getVehicleDoorInfo", vehicleId);

	originalResponse = response;

	var urlString = "http://gmapi.azurewebsites.net/getSecurityStatusService";
	var requestFields = {
		"id": vehicleId,
		"responseType": "JSON"
	}
	sendTheRequest(urlString, requestFields, receiveVehicleDoorInfo);
}

var getVehicleFuelInfo = function(vehicleId, response) {
	console.log("I entered here getVehicleFuelInfo", vehicleId);

	originalResponse = response;

	var urlString = "http://gmapi.azurewebsites.net/getEnergyService";
	var requestFields = {
		"id": vehicleId,
		"responseType": "JSON"
	}
	sendTheRequest(urlString, requestFields, receiveVehicleFuelInfo);
}

var getVehicleBatteryInfo = function(vehicleId, response) {
	console.log("I entered here getVehicleBatteryInfo", vehicleId);

	originalResponse = response;

	var urlString = "http://gmapi.azurewebsites.net/getEnergyService";
	var requestFields = {
		"id": vehicleId,
		"responseType": "JSON"
	}
	sendTheRequest(urlString, requestFields, receiveVehicleBatteryInfo);
}

var startOrStopVehicle = function(vehicleId, actionRequested, response) {
	console.log("I entered here startOrStopVehicle", vehicleId);

	originalResponse = response;

	var urlString = "http://gmapi.azurewebsites.net/actionEngineService";

	var actionString = '';

	if(actionRequested['action'] == 'START') {
		actionString = 'START_VEHICLE';
	}
	else if(actionRequested['action'] == 'STOP') {
		actionString = 'STOP_VEHICLE';
	}
	else {
		/* We should not be hitting this else statement */
	}

	var requestFields = {
		"id": vehicleId,
		"command": actionString,
		"responseType": "JSON"
	}
	sendTheRequest(urlString, requestFields, receiveVehicleStartOrStopInfo);
}

/**********************************************************************************************************************************/

function router(request, response) {
	console.log('request.url: ', request.url);
	console.log('request.method: ', request.method);

	var baseUrl = url.parse(request.url, true);
	console.log('Requested: ', baseUrl)

	/* Defensive Coding: Removing a slash from the end of URLs if present */
	if(baseUrl.pathname[baseUrl.pathname.length - 1] === '/'){
		baseUrl.pathname = baseUrl.pathname.substring(0, baseUrl.pathname.length - 1);
		console.log(baseUrl.pathname);
	}

	var pathList = baseUrl.pathname.split("/");

	/* Move the request and response along with the path to the correct HTTP request handler */
	if(pathList.length >= 3 && pathList[1] === 'vehicles' && (request.method === 'POST' || request.method === 'GET')) {
		httpRoute[request.method](request, response, pathList);
	}
	else {
		/* Got a wrong URL */
		httpRoute['NA']['wrongUrl'](request, response);
	}

}

http.createServer(router).listen(9000);

console.log('Running on 127.0.0.1:9000');
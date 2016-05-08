var http = require('http');
var url = require('url');
var request = require('request');

var receivedResponseBody = '';
var originalResponse = '';

var httpRoute = {
	'GET': function(request, response, pathList) {
		if(!isNaN(pathList[pathList.length - 1])) {
		getVehicleInfo(pathList[pathList.length - 1], response);
		}
		else if(pathList[pathList.length - 1] === 'doors') {
			if(!isNaN(pathList[pathList.length - 2])) {
				getVehicleDoorInfo(pathList[pathList.length - 2], response);
			}
			else{
				httpRoute['NA'](request, response);
			}
		}
		else if(pathList[pathList.length - 1] === 'fuel') {
			if(!isNaN(pathList[pathList.length - 2])) {
				getVehicleFuelInfo(pathList[pathList.length - 2], response);
			}
			else{
				httpRoute['NA'](request, response);
			}
		}
		else if(pathList[pathList.length - 1] === 'battery') {
			if(!isNaN(pathList[pathList.length - 2])) {
				getVehicleBatteryInfo(pathList[pathList.length - 2], response);
			}
			else{
				httpRoute['NA'](request, response);
			}
		}
		else {
			console.log("Something went wrong!");
			httpRoute['NA'](request, response);
		}
	},
	'POST': function(request, response, pathList) {
		if(pathList[pathList.length - 1] === 'engine') {
			if(!isNaN(pathList[pathList.length - 2])) {
				var data = '';
    			request.on('data', function(chunk) {
        			data += chunk.toString();
    			});
    			request.on('end', function() {
        			console.log("SAFIR-->Post ", data);
        			data = eval("(" + data + ")");

        			if(data['action'] != 'START' && data['action'] != 'STOP') {
    					httpRoute['NA'](request, response);
    				}
    				else {
    					
    				}
    			});
			}
			else{
				httpRoute['NA'](request, response);
			}
		}
		else {
			console.log("Something went wrong!");
			httpRoute['NA'](request, response);
		}
	},
	'NA': function(request, response){
		response.writeHead(404);
		response.end('<h1> Page not found</h1>');
	}
};

var routes = {
	'vehicleInfo': function() {
		var responseFields = {
			'vin': receivedResponseBody['data']['vin']['value'],
			'color': receivedResponseBody['data']['color']['value'],
		};
		if(receivedResponseBody['data']['fourDoorSedan']['value'] == true){
			responseFields["doorCount"] = 4;
		}
		else{
			responseFields["doorCount"] = 2;
		}
		responseFields["driveTrain"] = receivedResponseBody['data']['driveTrain']['value'];

		originalResponse.writeHead(200, {'Content-Type': 'application/json'});
		originalResponse.end(JSON.stringify(responseFields));
	},
	'vehicleDoorInfo': function() {
		var responseFields = [];
		for(i = 0; i < receivedResponseBody['data']['doors']['values'].length; i++){
			responseFields.push({
				'location': receivedResponseBody['data']['doors']['values'][i]['location']['value'],
				'locked': receivedResponseBody['data']['doors']['values'][i]['locked']['value']
			});
		}

		originalResponse.writeHead(200, {'Content-Type': 'application/json'});
		originalResponse.end(JSON.stringify(responseFields));
	},
	'vehicleFuelInfo': function() {
		var responseFields = {
			'percent': receivedResponseBody['data']['tankLevel']['value'],
		};

		originalResponse.writeHead(200, {'Content-Type': 'application/json'});
		originalResponse.end(JSON.stringify(responseFields));
	},
	'vehicleBatteryInfo': function() {
		var responseFields = {
			'percent': receivedResponseBody['data']['batteryLevel']['value'],
		};

		originalResponse.writeHead(200, {'Content-Type': 'application/json'});
		originalResponse.end(JSON.stringify(responseFields));
	}
};

/**********************************************************************************************************************************/

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

/**********************************************************************************************************************************/

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

	var urlString = "http://gmapi.azurewebsites.net/getEnergyService";
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

var getVehicleStartStopInfo = function(vehicleId, response) {
	console.log("I entered here getVehicleStartStopInfo", vehicleId);

	originalResponse = response;

	var urlString = "http://gmapi.azurewebsites.net/actionEngineService";
	var requestFields = {
		"id": vehicleId,
		"command": "START_VEHICLE|STOP_VEHICLE",
		"responseType": "JSON"
	}
	sendTheRequest(urlString, requestFields, receiveVehicleBatteryInfo);
}

/**********************************************************************************************************************************/

function router(request, response) {
	console.log('request.url: ', request.url);
	console.log('request.method: ', request.method);

	var baseUrl = url.parse(request.url, true);
	console.log('Requested: ', baseUrl)

	var pathList = baseUrl.pathname.split("/");

	console.log('SAFIR->>', pathList);

	httpRoute[request.method](request, response, pathList);

	/*var resolvedRoute = routes[request.method][baseUrl.pathname];

	if(resolvedRoute != undefined){
		request.queryParams = baseUrl.query;
		resolvedRoute(request, response);
	}
	else {
		routes['NA'](request, response);
	}*/

}

http.createServer(router).listen(9000);

console.log('Running on 9000');
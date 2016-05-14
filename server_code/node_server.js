var http = require('http');
var url = require('url');
var request = require('request');

var originalResponse = '';



/**********************************************************************************************************************************/

/* HTTP Route Handler */
var httpRoute = {
	/* GET request handler */
	'GET': function(request, response, pathList) {
		/* Get Vehicle Information */

		var pathListLength = pathList.length;

		if(!isNaN(pathList[pathListLength - 1])) {
			getVehicleInfo(pathList[pathListLength - 1], response);
		}
		else if(!isNaN(pathList[pathListLength - 2])) {
			var actionType 	= pathList[pathListLength - 1];
			var vehicleId 	= pathList[pathListLength - 2];

			switch(actionType) {

				/* Get Vehicle doors information */
				case 'doors': {
					getVehicleDoorInfo(vehicleId, response);
					break;	
				}
					
				/* Get Vehicle Fuel Information */
				case 'fuel': {
					getVehicleFuelInfo(vehicleId, response);
					break;
				}
				 		
				/* Get Vehicle Battery Information */
				case 'battery': {
					getVehicleBatteryInfo(vehicleId, response);
					break;
				}	

				/* Wrong URL */
				default: {
					httpRoute['NA']['wrongUrl'](request, response);
					break;
				}			
			}

		}
		/* Wrong parameters sent. Return appropriate response */
		else {
			httpRoute['NA']['wrongParameters'](request, response);
		}
	},

	/* POST request handler */
	'POST': function(request, response, pathList) {

		var pathListLength 	= pathList.length;
		var vehicleId 		=  pathList[pathListLength - 2];

		/* Start or Stop the Vehicle */
		if(pathList[pathListLength - 1] === 'engine') {
			if(!isNaN(vehicleId)) {
				var data = '';

				/* Receive the POSTed to information */
				request.on('data', function(chunk) {
					data += chunk.toString();
				});

				/* Send the request once the POSTed information is received */
				request.on('end', function() {

					data = JSON.parse(data);

					if(data['action'] != 'START' && data['action'] != 'STOP') {
						/* Wrong action specified */
						httpRoute['NA']['wrongParameters'](request, response);
					}
					else {
						startOrStopVehicle(vehicleId, data['action'], response);
					}
				});
			}
			/* Wrong Parameters sent */
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
			response.writeHead(400);
			response.end('<h1> Wrong URL entered </h1>');
		},

		'wrongParameters': function(request, response){
			response.writeHead(400);
			response.end('<h1> Wrong parameters passed </h1>');
		},

		'wrongResponse': function() {
			originalResponse.writeHead(500);
			originalResponse.end('<h1> Wrong JSON returned by Server </h1>');
		}
	}
};

/**********************************************************************************************************************************/

/* Response Generators */
var routes = {
	/* Vehicle Information Response  */
	'vehicleInfo': function(receivedResponseBody) {
		try {
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
		}
		catch(err) {
			httpRoute['NA']['wrongResponse']();
		}
	},

	/* Vehicle Door Response */
	'vehicleDoorInfo': function(receivedResponseBody) {
		try {
			var responseFields 	= [];
			var doorCount	   	= receivedResponseBody['data']['doors']['values'].length;

			for(var i = 0; i < doorCount; i++){
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
		}
		catch(err) {
			httpRoute['NA']['wrongResponse']();
		}
	},

	/* Vehicle Fuel Information Response */
	'vehicleFuelInfo': function(receivedResponseBody) {
		try {
			var responseFields = {
				'percent': parseFloat(receivedResponseBody['data']['tankLevel']['value'], 10)
			};

			originalResponse.writeHead(200, {'Content-Type': 'application/json'});
			originalResponse.end(JSON.stringify(responseFields));
		}
		catch(err) {
			httpRoute['NA']['wrongResponse']();
		}
	},

	/* Vehicle Battery Information Response */
	'vehicleBatteryInfo': function(receivedResponseBody) {
		try {
			var responseFields = {
				'percent': parseFloat(receivedResponseBody['data']['batteryLevel']['value'], 10)
			};

			originalResponse.writeHead(200, {'Content-Type': 'application/json'});
			originalResponse.end(JSON.stringify(responseFields));
		}
		catch(err) {
			httpRoute['NA']['wrongResponse']();
		}
	},

	/* Vehicle Start or Stop Response */
	'vehicleStartOrStopInfo': function(receivedResponseBody) {
		try {
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
		catch(err) {
			httpRoute['NA']['wrongResponse']();
		}
	},

	/* Error Response Handler */
	'errorResponse': function(receivedResponseBody) {
		try {
			var responseFields = {
				'status': 404,
				'reason': receivedResponseBody['reason']
			};

			originalResponse.writeHead(404, {'Content-Type': 'application/json'});
			originalResponse.end(JSON.stringify(responseFields));
		}
		catch(err) {
			httpRoute['NA']['wrongResponse']();
		}
	}
};

/**********************************************************************************************************************************/

/* Function to call the appropriate response generator */
var storeParseReturntheResponse = function(body, actionType){

	console.log(body);

	if(body['status'] === '404') {
		routes['errorResponse'](body);
	}
	else {
		routes[actionType](body);
	}
}

/**********************************************************************************************************************************/

/* Function to send the request to the Server */
var sendTheRequest = function(urlString, requestFields, actionType){

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
	}, function(error, response, body) {
		if (!error && response.statusCode === 200) {
			storeParseReturntheResponse(body, actionType);
		}
	});

}

/**********************************************************************************************************************************/

/* Starting functions to send the requests */

var getVehicleInfo = function(vehicleId, response) {

	originalResponse = response;

	var urlString = "http://gmapi.azurewebsites.net/getVehicleInfoService";
	var requestFields = {
		"id": vehicleId,
		"responseType": "JSON"
	}
	sendTheRequest(urlString, requestFields, 'vehicleInfo');
}

var getVehicleDoorInfo = function(vehicleId, response) {

	originalResponse = response;

	var urlString = "http://gmapi.azurewebsites.net/getSecurityStatusService";
	var requestFields = {
		"id": vehicleId,
		"responseType": "JSON"
	}
	sendTheRequest(urlString, requestFields, 'vehicleDoorInfo');
}

var getVehicleFuelInfo = function(vehicleId, response) {

	originalResponse = response;

	var urlString = "http://gmapi.azurewebsites.net/getEnergyService";
	var requestFields = {
		"id": vehicleId,
		"responseType": "JSON"
	}
	sendTheRequest(urlString, requestFields, 'vehicleFuelInfo');
}

var getVehicleBatteryInfo = function(vehicleId, response) {

	originalResponse = response;

	var urlString = "http://gmapi.azurewebsites.net/getEnergyService";
	var requestFields = {
		"id": vehicleId,
		"responseType": "JSON"
	}
	sendTheRequest(urlString, requestFields, 'vehicleBatteryInfo');
}

var startOrStopVehicle = function(vehicleId, actionRequested, response) {

	originalResponse = response;

	var urlString = "http://gmapi.azurewebsites.net/actionEngineService";

	var actionString = '';

	if(actionRequested == 'START') {
		actionString = 'START_VEHICLE';
	}
	else if(actionRequested == 'STOP') {
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
	sendTheRequest(urlString, requestFields, 'vehicleStartOrStopInfo');
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
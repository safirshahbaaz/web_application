# web_application

The Node Server is running on 127.0.0.1:9000. Every request is handled in the following manner:

1. Based on the request type(GET or POST), the request, response, and the path information is sent to appropriate HTTP request handler.
2. The request handler finds out the information that is being requested, and calls a function to create the request JSON object.
3. The request is then POSTed to the server.
4. In the callback function, a function is called with the action type(based on the request).
5. Finally, the retrieved JSON object is parsed in the appropriate response generator and sent back to the client

Following are the details of the implementation and test cases:

### Get Vehicle Information
The request is of the form http://127.0.0.1:9000/vehicles/1234.

curl http://127.0.0.1:9000/vehicles/1234 -X GET -H 'Content-type: application/json'

### Get Vehicle Door Information
The request is of the form http://127.0.0.1:9000/vehicles/1234/doors.

curl http://127.0.0.1:9000/vehicles/1234/doors -X GET -H 'Content-type: application/json'

### Get Vehicle Fuel and Battery Information
The request is of the form http://127.0.0.1:9000/vehicles/1234/battery or  http://127.0.0.1:9000/vehicles/1234/fuel.

curl http://127.0.0.1:9000/vehicles/1234/battery -X GET -H 'Content-type: application/json'

curl http://127.0.0.1:9000/vehicles/1234/fuel -X GET -H 'Content-type: application/json'

### Post Vehicle Start/Stop Information
The request is of the form curl http://127.0.0.1:9000/vehicles/1234/engine -X POST -H 'Content-type: application/json' -d '{"action":"START"}'

Along with the happy cases, some edge cases have also been tested:

1. Wrong key/value sent in the POST request for Start/Stop the car
2. Wrong URL sent to the Node server
3. Valid URL with a slash in the end. For example: http://127.0.0.1:9000/vehicles/1234/battery/
4. Invalid vehicle ID
5. Defensive coding in place for incorrect server response(Exceptions that can be raised due to incorrect fields in the JSON)

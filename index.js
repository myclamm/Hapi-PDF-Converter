var Hapi = require('hapi');
// var Joi  = require('joi');
var routes = require('./routes');

var config = {
	payload: { maxBytes: 40485760 }
}

var server = new Hapi.Server('0.0.0.0', '8000', config);
server.route(routes)
server.start();
console.log('Server Started On localhost:8000');

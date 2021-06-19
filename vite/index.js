"use strict";
exports.__esModule = true;
var http = require("http");
var connect = require("connect");
var middlewares = connect();
var createServer = function () {
    http.createServer(middlewares).listen(3000, function () {
        console.log('simple-vite-dev-server start at localhost: 3000!');
    });
};
createServer();

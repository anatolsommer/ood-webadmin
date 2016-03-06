/*!
 * ood-webadmin
 * Copyright(c) 2016 Anatol Sommer <anatol@anatol.at>
 * MIT Licensed
 */

'use strict';

var express=require('express'), server;

exports.load=function(log, api, config) {
  var app=express();
  require('./main').init(app, log, api, config);
  server=app.listen(config.port, '127.0.0.1');
};

exports.unload=function() {
  server.close();
};

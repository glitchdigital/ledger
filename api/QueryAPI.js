/* Copyright 2016 Christine S. MacNeill

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by appli cable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

// QueryAPI implementation

var express = require('express');
var immutable = require('seamless-immutable');
var NodeStore = require('./NodeStore.js');
var mdns = require('mdns-js');

function QueryAPI (port, storeFn, serviceName, pri) {
  var app = express();
  var server = null;
  var mdnsService = null;
  if (!pri || Number(pri) !== pri || pri % 1 !== 0) pri = 100;
  if (!serviceName || typeof serviceName !== 'string') serviceName = 'ledger_query';

  function setPagingHeaders(res, total, pageOf, pages, size) {
    if (pageOf) res.set('X-Streampunk-Ledger-PageOf', pageOf.toString());
    if (size) res.set('X-Streampunk-Ledger-Size', size.toString());
    if (pages) res.set('X-Streampunk-Ledger-Pages', pages.toString());
    if (total) res.set('X-Streampunk-Ledger-Total', total.toString());
    return res;
  }

  /**
   * Returns the port that this Query API is configured to use.
   * @return {Number} Port for this node API.
   */
  this.getPort = function () {
    return port;
  }

  /**
   * Initialise the Query APIs routing table.
   * @return {NodeAPI} Returns this object with the routing table initialised and
   *                   ready to {@link NodeAPI#start}.
   */
  this.init = function() {

    app.use(function(req, res, next) {
      // TODO enhance this to better supports CORS
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "GET, PUT, POST, HEAD, OPTIONS, DELETE");
      res.header("Access-Control-Allow-Headers", "Content-Type, Accept");
      res.header("Access-Control-Max-Age", "3600");

      if (req.method == 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    app.get('/', function (req, res) {
      res.json(['x-nmos/']);
    });

    app.get('/x-nmos/', function (req, res) {
      res.json(['query/']);
    });

    app.get('/x-nmos/query/', function (req, res) {
      res.json([ "v1.0/" ]);
    });

    var qapi = express();
    // Mount all other methods at this base path
    app.use('/x-nmos/query/v1.0/', qapi);

    qapi.get('/', function (req, res) {
      res.json([
        "subscriptions/",
        "flows/",
        "sources/",
        "nodes/",
        "devices/",
        "senders/",
        "receivers/"
      ]);
    });

    // List nodes
    qapi.get('/nodes', function (req, res, next) {
      storeFn().getNodes(req.query,
        function (err, nodes, total, pageOf, pages, size) {
          if (err) next(err);
          else setPagingHeaders(res, total, pageOf, pages, size).json(nodes);
      });
    });

    // Get single node
    qapi.get('/nodes/:id', function (req, res, next) {
      storeFn().getNode(req.params.id, function (err, node) {
        if (err) next(err);
        else res.json(node);
      });
    });

    // List devices
    qapi.get('/devices/', function (req, res, next) {
      storeFn().getDevices(req.query,
          function (err, devices, total, pageOf, pages, size) {
        if (err) next(err);
        else setPagingHeaders(res, total, pageOf, pages, size).json(devices);
      });
    });

    // Get a single device
    qapi.get('/devices/:id', function (req, res, next) {
      storeFn().getDevice(req.params.id, function (err, device) {
        if (err) next(err);
        else res.json(device);
      });
    });

    // List sources
    qapi.get('/sources/', function (req, res, next) {
      storeFn().getSources(req.query,
          function(err, sources, total, pageOf, pages, size) {
        if (err) next(err);
        else setPagingHeaders(res, total, pageOf, pages, size).json(sources);
      });
    });

    // Get a single source
    qapi.get('/sources/:id', function (req, res, next) {
      storeFn().getSource(req.params.id, function (err, source) {
        if (err) next(err);
        else res.json(source);
      });
    });

    // List flows
    qapi.get('/flows/', function (req, res, next) {
      storeFn().getFlows(req.query,
          function (err, flows, total, pageOf, pages, size) {
        if (err) next(err);
        else setPagingHeaders(res, total, pageOf, pages, size).json(flows);
      });
    });

    // Get a single flow
    qapi.get('/flows/:id', function (req, res, next) {
      storeFn().getFlow(req.params.id, function (err, flow) {
        if (err) next(err);
        else res.json(flow);
      });
    });

    // List senders
    qapi.get('/senders/', function (req, res, next) {
      storeFn().getSenders(req.query,
         function(err, senders, pageOf, size, page, total) {
        if (err) next(err);
        else setPagingHeaders(res, total, pageOf, page, size).json(senders);
      });
    });

    // Get a single sender
    qapi.get('/senders/:id', function (req, res, next) {
      storeFn().getSender(req.params.id, function (err, sender) {
        if (err) next(err);
        else res.json(sender);
      });
    });

    // List receivers
    qapi.get('/receivers/', function (req, res, next) {
      storeFn().getReceivers(req.query,
          function(err, receivers, total, pageOf, pages, size) {
        if (err) next(err);
        else setPagingHeaders(res, total, pageOf, pages, size).json(receivers);
      });
    });

    // Get a single receiver
    qapi.get('/receivers/:id', function (req, res, next) {
      storeFn().getReceiver(req.params.id, function(err, receiver) {
        if (err) next(err);
        else res.json(receiver);
      });
    });

    qapi.post('/subscriptions', function (req, res, next) {
      next(NodeStore.prototype.statusError(501,
        "Subscriptions are not yet implemented for the ledger query API."));
    });

    qapi.get('/subscriptions', function (req, res, next) {
      next(NodeStore.prototype.statusError(501,
        "Subscriptions are not yet implemented for the ledger query API."));
    });

    qapi.get('/subscriptions/:id', function (req, res, next) {
      next(NodeStore.prototype.statusError(501,
        "Subscriptions are not yet implemented for the ledger query API."));
    });

    qapi.delete('/subscriptions/:id', function (req, res, next) {
      next(NodeStore.prototype.statusError(501,
        "Subscriptions are not yet implemented for the ledger query API."));
    });

    app.use(function (err, req, res, next) {
      if (err.status) {
        res.status(err.status).json({
          code: err.status,
          error: (err.message) ? err.message : 'Internal server error. No message available.',
          debug: (err.stack) ? err.stack : 'No stack available.'
        });
      } else {
        res.status(500).json({
          code: 500,
          error: (err.message) ? err.message : 'Internal server error. No message available.',
          debug: (err.stack) ? err.stack : 'No stack available.'
        })
      }
    });

    app.use(function (req, res, next) {
      res.status(404).json({
          code : 404,
          error : `Could not find the requested resource '${req.path}'.`,
          debug : req.path
        });
    });

    return this;
  }

  /**
   * Start the Query API server. If the port is already in use, the server
   * will be closed.
   * @param  {QueryAPI~trackStatus=} cb Optional callback to track API starting
   *                                    or errors.
   * @return {QueryAPI}                 This object with an asynchronous request
   *                                    to start the server.
   */
  this.start = function (cb) {
    server = app.listen(port, function (e) {
      var host = server.address().address;
      var port = server.address().port;
      if (e) {
        if (e.code == 'EADDRINUSE') {
          console.log('Address http://%s:%s already in use.', host, port);
          server.close();
        };
        if (cb) cb(e);
      } else {
        console.log('Streampunk media ledger query service running at http://%s:%s',
          host, port);
        if (cb) cb();
      };
    });

    this.startMDNS();

    return this;
  }

  this.startMDNS = function startMDNS() {
    if (serviceName === 'none') return; // For REST service acceptance testing
    mdnsService = mdns.createAdvertisement(mdns.tcp('nmos-query'), port, {
      name : serviceName,
      txt : {
        pri : pri
      }
    });

    mdnsService.start();

    if (process.listenerCount('SIGINT') === 0) {
      process.on('SIGINT', function () {
        if (mdnsService) mdnsService.stop();

        setTimeout(function onTimeout() {
          process.exit();
        }, 1000);
      });
    }
  }

  /**
   * Stop the server running the Query API.
   * @param  {QueryAPI~trackStatus=} cb Optional callback that tracks when the
   *                                   server is stopped.
   * @return {QueryAPI}                 This object with an asynchronous request
   *                                   to stop the server.
   */
   this.stop = function(cb) {
     var error = '';
     if (server) {
       server.close(function () {
         this.stopMDNS(cb);
         server = null;
       }.bind(this));
     } else {
       this.stopMDNS(function (e) {
         if (e) cb(new Error(e.message +
           ' Server is not set for this Query API and so cannot be stopped.'));
         else
           cb(new Error('Server is not set for this Query API and so cannot be stopped.'));
         server = null;
       }.bind(this));
     }

     return this;
   }

   this.stopMDNS = function (cb) {
     if (serviceName === 'none') return cb(); // For REST service acceptance testing
     if (mdnsService) {
       mdnsService.stop();
       mdnsService.networking.stop();
       mdnsService = null;
       cb();
     } else {
       cb(new Error('MDNS advertisement is not set for this Query API and so cannot be stopped.'));
     }

     return this;
   }

   // Check the validity of a port
   function validPort(port) {
     return port &&
       Number(port) === port &&
       port % 1 === 0 &&
       port > 0;
   }

   if (!validPort(port))
     return new Error('Port is not a valid value. Must be an integer greater than zero.');
   return immutable(this, { prototype : QueryAPI.prototype });
}

/**
 * Function called when server has been started or stopped.
 * @callback {QueryAPI~trackStatus}
 * @param {Error=} Set if an error occurred when starting or stopping the server.
 */

module.exports = QueryAPI;

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

// Test the registration API.

var test = require('tape');
var http = require('http');
var uuid = require('uuid');
var async = require('async');
var ledger = require('../index.js');

var Node = ledger.Node;
var Device = ledger.Device;
var Source = ledger.Source;
var Flow = ledger.Flow;
var Sender = ledger.Sender;
var Receiver = ledger.Receiver;
var testPort = 3212;

var store = null;
function storeFn() { return store; }

function serverTest(description, fn) {
  test(description, function (t) {
    store = new ledger.NodeRAMStore();
    var api = new ledger.QueryAPI(testPort, storeFn, 'none');
    api.init().start(function (e) {
      if (e) {
        t.fail('Failed to start server');
        t.end();
      } else {
        fn(t, store, api, function () {
          api.stop(function (e) {
            if (e) console.error("Failed to shut down server.");
            t.end();
          });
        });
      }
    });
  });
}

serverTest('The server reports its root path (slash)',
    function (t, store, server, done) {
  http.get({ port : testPort, path : '/'}, function (res) {
    res.on("data", function (chunk) {
      t.equal(chunk.toString(), JSON.stringify(['x-nmos/']), 'and it is as expected.');
      done();
    });
  }).on('error', function (e) {
    t.fail(e); done();
  });
});

serverTest('The server reports its root path (no slash)',
    function (t, store, server, done) {
  http.get({ port : testPort, path : ''}, function (res) {
    res.on("data", function (chunk) {
      t.equal(chunk.toString(), JSON.stringify(['x-nmos/']), 'and it is as expected.');
      done();
    });
  }).on('error', function (e) {
    t.fail(e); done();
  });
});

serverTest('The server reports its api type (slash)',
    function (t, store, server, done) {
  http.get({ port : testPort, path : '/x-nmos/'}, function (res) {
    res.on("data", function (chunk) {
      t.equal(chunk.toString(), JSON.stringify(['query/']), 'and it is as expected.');
      done();
    });
  }).on('error', function (e) {
    t.fail(e); done();
  });
});

serverTest('The server reports its api type (no slash)',
    function (t, store, server, done) {
  http.get({ port : testPort, path : '/x-nmos'}, function (res) {
    res.on("data", function (chunk) {
      t.equal(chunk.toString(), JSON.stringify(['query/']), 'and it is as expected.');
      done();
    });
  }).on('error', function (e) {
    t.fail(e); done();
  });
});

serverTest('The server reports its version (slash)',
    function (t, store, server, done) {
  http.get({ port : testPort, path : '/x-nmos/query/'}, function (res) {
    res.on("data", function (chunk) {
      t.equal(chunk.toString(), JSON.stringify(['v1.0/']), 'and it is as expected.');
      done();
    });
  }).on('error', function (e) {
    t.fail(e); done();
  });
});

serverTest('The server reports its version (no slash)',
    function (t, store, server, done) {
  http.get({ port : testPort, path : '/x-nmos/query'}, function (res) {
    res.on("data", function (chunk) {
      t.equal(chunk.toString(), JSON.stringify(['v1.0/']), 'and it is as expected.');
      done();
    });
  }).on('error', function (e) {
    t.fail(e); done();
  });
});

var baseResponse = [
    "subscriptions/",
    "flows/",
    "sources/",
    "nodes/",
    "devices/",
    "senders/",
    "receivers/"
];

serverTest('The server reports its resources (slash)',
    function (t, store, server, done) {
  http.get({ port : testPort, path : '/x-nmos/query/v1.0/'}, function (res) {
    res.on("data", function (chunk) {
      t.equal(chunk.toString(), JSON.stringify(baseResponse), 'and it is as expected.');
      done();
    });
  }).on('error', function (e) {
    t.fail(e); done();
  });
});

serverTest('The server reports its resources (no slash)',
    function (t, store, server, done) {
  http.get({ port : testPort, path : '/x-nmos/query/v1.0'}, function (res) {
    res.on("data", function (chunk) {
      t.equal(chunk.toString(), JSON.stringify(baseResponse), 'and it is as expected.');
      done();
    });
  }).on('error', function (e) {
    t.fail(e); done();
  });
});

serverTest('The server reports an error for an incorrect short path',
    function (t, store, server, done) {
  http.get({ port : testPort, path : '/x-nmos/wibble'}, function (res) {
    t.equal(res.statusCode, 404, 'with status code 404.')
    res.on("data", function (chunk) {
      t.equal(chunk.toString(), JSON.stringify({
        code : 404,
        error : "Could not find the requested resource '/x-nmos/wibble'.",
        debug : "/x-nmos/wibble"}), 'responding with an error.');
      done();
    });
  }).on('error', function (e) {
    t.fail(e); done();
  });
});

serverTest('The server reports an error for an incorrect long path',
    function (t, store, server, done) {
  http.get({ port : testPort, path : '/x-nmos/query/v1.0/wibble'}, function (res) {
    t.equal(res.statusCode, 404, 'with status code 404.')
    res.on("data", function (chunk) {
      t.equal(chunk.toString(), JSON.stringify({
        code : 404,
        error : "Could not find the requested resource '/x-nmos/query/v1.0/wibble'.",
        debug : "/x-nmos/query/v1.0/wibble"}), 'responding with an error.');
      done();
    });
  }).on('error', function (e) {
    t.fail(e); done();
  });
});

serverTest('Checking CORS headers using base response',
    function (t, store, server, done) {
  http.get({ port : testPort, path : `/x-nmos/query/v1.0/`}, function (res) {
    t.equal(res.statusCode, 200, 'has status code 200.');
    t.equal(res.headers['access-control-allow-origin'], '*',
      'has Access-Control-Allow-Origin header.');
    t.equal(res.headers['access-control-allow-methods'],
      'GET, PUT, POST, HEAD, OPTIONS, DELETE',
      'has Access-Control-Allow-Methods header.');
    t.equal(res.headers['access-control-allow-headers'], 'Content-Type, Accept',
      'has Access-Control-Allow-Headers header.');
    t.equal(res.headers['access-control-max-age'], '3600',
      'has Access-Control-Max-Age header.');
    done();
  }).on('error', function (e) {
    t.fail(e); done();
  });
});

var node1 = new Node(null, null, "Punkd Up Node", "http://tereshkova.local:3000",
  "tereshkova");
var node2 = new Node(null, null, "Smashing Punkins'", "http://hopper.local:3000",
  "hopper");
var device = new Device(null, null, "Dat Punking Ting", null, node1.id);
var videoSource = new Source(null, null, "Garish Punk", "Will you turn it down!!",
  ledger.formats.video, null, null, device.id);
var audioSource = new Source(null, null, "Noisy Punk", "What do you look like!!",
  ledger.formats.audio, null, null, device.id);
var audioFlow = new Flow(null, null, "Funk Punk", "Blasting at you, punk!",
  ledger.formats.audio, null, audioSource.id);
var videoFlow = new Flow(null, null, "Junk Punk", "You looking at me, punk?",
  ledger.formats.video, null, videoSource.id);
var audioSender = new Sender(null, null, "Listen Up Punk",
  "Should have listened to your Mother!", audioFlow.id,
  ledger.transports.rtp_mcast, device.id, "http://tereshkova.local/audio.sdp");
var videoSender = new Sender(null, null, "In Ya Face Punk",
  "What do you look like?", videoFlow.id,
  ledger.transports.rtp_mcast, device.id, "http://tereshkova.local/video.sdp");
var audioReceiver = new Receiver(null, null, "Say It Punk?",
  "You talking to me?", ledger.formats.audio, null, null, device.id,
  ledger.transports.rtp_mcast);
var videoReceiver = new Receiver(null, null, "Watching da Punks",
  "Looking hot, punk!", ledger.formats.video, null, null, device.id,
  ledger.transports.rtp_mcast);

function fillStore(store, filled) {
  async.waterfall([
      function (cb) { store.putNode(node1, cb); },
      function (n, s, cb) { s.putNode(node2, cb); },
      function (n, s, cb) { s.putDevice(device, cb); },
      function (d, s, cb) { s.putSource(videoSource, cb); },
      function (v, s, cb) { s.putSource(audioSource, cb); },
      function (a, s, cb) { s.putFlow(videoFlow, cb); },
      function (v, s, cb) { s.putFlow(audioFlow, cb); },
      function (a, s, cb) { s.putSender(videoSender, cb); },
      function (v, s, cb) { s.putSender(audioSender, cb); },
      function (a, s, cb) { s.putReceiver(videoReceiver, cb); },
      function (v, s, cb) { s.putReceiver(audioReceiver, cb); }
    ], function (e, x, result) { return filled(e, result); });
}

baseResponse.slice(1).forEach(function (r) {
  serverTest(`Where no ${r} are registered (with slash)`,
      function (t, store, server, done) {
    http.get({ port : testPort, path : `/x-nmos/query/v1.0/${r}`}, function (res) {
      t.equal(res.statusCode, 200, 'has status code 200.');
      res.on("data", function (chunk) {
        t.equal(chunk.toString(), JSON.stringify([]), 'responds with an empty array.');
        done();
      });
    }).on('error', function (e) {
      t.fail(e); done();
    });
  });
});

baseResponse.slice(1).forEach(function (r) {
  serverTest(`Where no ${r.slice(0, -1)} are registered (no slash)`,
      function (t, store, server, done) {
    http.get({ port : testPort, path : `/x-nmos/query/v1.0/${r.slice(0, -1)}`}, function (res) {
      t.equal(res.statusCode, 200, 'has status code 200.');
      res.on("data", function (chunk) {
        t.equal(chunk.toString(), JSON.stringify([]), 'responds with an empty array.');
        done();
      });
    }).on('error', function (e) {
      t.fail(e); done();
    });
  });
});

baseResponse.slice(1).forEach(function (r) {
  serverTest(`Where no ${r.slice(0, -1)} are registered (no slash)`,
      function (t, store, server, done) {
    http.get({ port : testPort, path : `/x-nmos/query/v1.0/${r}wibble`}, function (res) {
      t.equal(res.statusCode, 400, 'request for .../wibble has status code 400.');
      res.on("data", function (chunk) {
        var error = JSON.parse(chunk.toString());
        t.equal(error.code, 400, 'error message has status code 400.');
        t.equal(error.error, 'Identifier must be a valid UUID.',
          'error must contain a useful message.');
        t.ok(error.debug.length > 0, 'error debug is not empty.');
        done();
      });
    }).on('error', function (e) {
      t.fail(e); done();
    });
  });
});

baseResponse.slice(1).forEach(function (r) {
  var id = uuid.v4();
  serverTest(`Where no ${r.slice(0, -1)} are registered (no slash)`,
      function (t, store, server, done) {
    http.get({ port : testPort, path : `/x-nmos/query/v1.0/${r}${id}`}, function (res) {
      t.equal(res.statusCode, 404, `request for .../${id} has status code 404.`);
      res.on("data", function (chunk) {
        var error = JSON.parse(chunk.toString());
        t.equal(error.code, 404, 'error message has status code 404.');
        t.ok(error.error.endsWith(`identifier '${id}' could not be found.`),
          'error must contain a useful message.');
        t.ok(error.debug.length > 0, 'error debug is not empty.');
        done();
      });
    }).on('error', function (e) {
      t.fail(e); done();
    });
  });
});

serverTest('Retrieving nodes (with slash)',
    function (t, str, server, done) {
  fillStore(str, function (e, s) {
    if (e) { t.fail(e); }
    else {
      store = s;
      var nds = Object.keys(s.nodes).map(function (x) { return s.nodes[x]; });
      http.get({ port : testPort, path : `/x-nmos/query/v1.0/nodes/`}, function (res) {
        t.equal(res.statusCode, 200, 'has status code 200.');
        t.equal(res.headers['x-streampunk-ledger-pageof'], "1", 'page of header is 1.');
        t.equal(res.headers['x-streampunk-ledger-size'], "2", 'size header is 2.');
        t.equal(res.headers['x-streampunk-ledger-pages'], "1", 'pages header is 1.');
        t.equal(res.headers['x-streampunk-ledger-total'], "2", 'total header is 2.');
        res.on('data', function (chunk) {
          t.deepEqual(JSON.parse(chunk.toString()), nds, 'matches the expected value.');
          done();
        });
      }).on('error', function (e) {
        t.fail(e); done();
      });
    }
  });
});

serverTest('Retrieving nodes (no slash)',
    function (t, str, server, done) {
  fillStore(str, function (e, s) {
    if (e) { t.fail(e); }
    else {
      store = s;
      var nds = Object.keys(s.nodes).map(function (x) { return s.nodes[x]; });
      http.get({ port : testPort, path : `/x-nmos/query/v1.0/nodes`}, function (res) {
        t.equal(res.statusCode, 200, 'has status code 200.');
        t.equal(res.headers['x-streampunk-ledger-pageof'], "1", 'page of header is 1.');
        t.equal(res.headers['x-streampunk-ledger-size'], "2", 'size header is 2.');
        t.equal(res.headers['x-streampunk-ledger-pages'], "1", 'pages header is 1.');
        t.equal(res.headers['x-streampunk-ledger-total'], "2", 'total header is 2.');
        res.on('data', function (chunk) {
          t.deepEqual(JSON.parse(chunk.toString()), nds, 'matches the expected value.');
          done();
        });
      }).on('error', function (e) {
        t.fail(e); done();
      });
    }
  });
});

serverTest('Retrieving node (with slash)',
    function (t, str, server, done) {
  fillStore(str, function (e, s) {
    if (e) { t.fail(e); }
    else {
      store = s;
      http.get({ port : testPort, path : `/x-nmos/query/v1.0/nodes/${node1.id}/`}, function (res) {
        t.equal(res.statusCode, 200, 'has status code 200.');
        res.on('data', function (chunk) {
          t.deepEqual(JSON.parse(chunk.toString()), s.nodes[node1.id], 'matches the expected value.');
          done();
        });
      }).on('error', function (e) {
        t.fail(e); done();
      });
    }
  });
});

serverTest('Retrieving node (no slash)',
    function (t, str, server, done) {
  fillStore(str, function (e, s) {
    if (e) { t.fail(e); }
    else {
      store = s;
      http.get({ port : testPort, path : `/x-nmos/query/v1.0/nodes/${node1.id}`}, function (res) {
        t.equal(res.statusCode, 200, 'has status code 200.');
        res.on('data', function (chunk) {
          t.deepEqual(JSON.parse(chunk.toString()), s.nodes[node1.id], 'matches the expected value.');
          done();
        });
      }).on('error', function (e) {
        t.fail(e); done();
      });
    }
  });
});

serverTest('Retrieving devices (with slash)',
    function (t, str, server, done) {
  fillStore(str, function (e, s) {
    if (e) { t.fail(e); }
    else {
      store = s;
      var d = s.devices[Object.keys(s.devices)[0]]
      http.get({ port : testPort, path : `/x-nmos/query/v1.0/devices/`}, function (res) {
        t.equal(res.statusCode, 200, 'has status code 200.');
        t.equal(res.headers['x-streampunk-ledger-pageof'], "1", 'page of header is 1.');
        t.equal(res.headers['x-streampunk-ledger-size'], "1", 'size header is 1.');
        t.equal(res.headers['x-streampunk-ledger-pages'], "1", 'pages header is 1.');
        t.equal(res.headers['x-streampunk-ledger-total'], "1", 'total header is 1.');
        res.on('data', function (chunk) {
          t.deepEqual(JSON.parse(chunk.toString()), [d], 'matches the expected value.');
          done();
        });
      }).on('error', function (e) {
        t.fail(e); done();
      });
    }
  });
});

serverTest('Retrieving devices (no slash)',
    function (t, str, server, done) {
  fillStore(str, function (e, s) {
    if (e) { t.fail(e); }
    else {
      store = s;
      var d = s.devices[Object.keys(s.devices)[0]]
      http.get({ port : testPort, path : `/x-nmos/query/v1.0/devices`}, function (res) {
        t.equal(res.statusCode, 200, 'has status code 200.');
        t.equal(res.headers['x-streampunk-ledger-pageof'], "1", 'page of header is 1.');
        t.equal(res.headers['x-streampunk-ledger-size'], "1", 'size header is 1.');
        t.equal(res.headers['x-streampunk-ledger-pages'], "1", 'pages header is 1.');
        t.equal(res.headers['x-streampunk-ledger-total'], "1", 'total header is 1.');
        res.on('data', function (chunk) {
          t.deepEqual(JSON.parse(chunk.toString()), [d], 'matches the expected value.');
          done();
        });
      }).on('error', function (e) {
        t.fail(e); done();
      });
    }
  });
});

serverTest('Retrieving a device (with slash)',
    function (t, str, server, done) {
  fillStore(str, function (e, s) {
    if (e) { t.fail(e); }
    else {
      store = s;
      var d = s.devices[Object.keys(s.devices)[0]]
      http.get({ port : testPort, path : `/x-nmos/query/v1.0/devices/${device.id}/`}, function (res) {
        t.equal(res.statusCode, 200, 'has status code 200.');
        res.on('data', function (chunk) {
          t.deepEqual(JSON.parse(chunk.toString()), d, 'matches the expected value.');
          done();
        });
      }).on('error', function (e) {
        t.fail(e); done();
      });
    }
  });
});

serverTest('Retrieving a device (no slash)',
    function (t, str, server, done) {
  fillStore(str, function (e, s) {
    if (e) { t.fail(e); }
    else {
      store = s;
      var d = s.devices[Object.keys(s.devices)[0]]
      http.get({ port : testPort, path : `/x-nmos/query/v1.0/devices/${device.id}`}, function (res) {
        t.equal(res.statusCode, 200, 'has status code 200.');
        res.on('data', function (chunk) {
          t.deepEqual(JSON.parse(chunk.toString()), d, 'matches the expected value.');
          done();
        });
      }).on('error', function (e) {
        t.fail(e); done();
      });
    }
  });
});

serverTest('Retrieving sources (with slash)',
    function (t, str, server, done) {
  fillStore(str, function (e, s) {
    if (e) { t.fail(e); }
    else {
      store = s;
      var srcs = Object.keys(s.sources).map(function (x) { return s.sources[x]; });
      http.get({ port : testPort, path : `/x-nmos/query/v1.0/sources/`}, function (res) {
        t.equal(res.statusCode, 200, 'has status code 200.');
        t.equal(res.headers['x-streampunk-ledger-pageof'], "1", 'page of header is 1.');
        t.equal(res.headers['x-streampunk-ledger-size'], "2", 'size header is 2.');
        t.equal(res.headers['x-streampunk-ledger-pages'], "1", 'pages header is 1.');
        t.equal(res.headers['x-streampunk-ledger-total'], "2", 'total header is 2.');
        res.on('data', function (chunk) {
          t.deepEqual(JSON.parse(chunk.toString()), srcs, 'matches the expected value.');
          done();
        });
      }).on('error', function (e) {
        t.fail(e); done();
      });
    }
  });
});

serverTest('Retrieving sources (no slash)',
    function (t, str, server, done) {
  fillStore(str, function (e, s) {
    if (e) { t.fail(e); }
    else {
      store = s;
      var srcs = Object.keys(s.sources).map(function (x) { return s.sources[x]; });
      http.get({ port : testPort, path : `/x-nmos/query/v1.0/sources`}, function (res) {
        t.equal(res.statusCode, 200, 'has status code 200.');
        res.on('data', function (chunk) {
          t.deepEqual(JSON.parse(chunk.toString()), srcs, 'matches the expected value.');
          done();
        });
      }).on('error', function (e) {
        t.fail(e); done();
      });
    }
  });
});

serverTest('Retrieving the video source (with slash)',
    function (t, str, server, done) {
  fillStore(str, function (e, s) {
    if (e) { t.fail(e); }
    else {
      store = s;
      http.get({ port : testPort, path : `/x-nmos/query/v1.0/sources/${videoSource.id}/`}, function (res) {
        t.equal(res.statusCode, 200, 'has status code 200.');
        res.on('data', function (chunk) {
          t.deepEqual(JSON.parse(chunk.toString()), s.sources[videoSource.id], 'matches the expected value.');
          done();
        });
      }).on('error', function (e) {
        t.fail(e); done();
      });
    }
  });
});

serverTest('Retrieving the video source (no slash)',
    function (t, str, server, done) {
  fillStore(str, function (e, s) {
    if (e) { t.fail(e); }
    else {
      store = s;
      http.get({ port : testPort, path : `/x-nmos/query/v1.0/sources/${videoSource.id}`}, function (res) {
        t.equal(res.statusCode, 200, 'has status code 200.');
        res.on('data', function (chunk) {
          t.deepEqual(JSON.parse(chunk.toString()), s.sources[videoSource.id], 'matches the expected value.');
          done();
        });
      }).on('error', function (e) {
        t.fail(e); done();
      });
    }
  });
});

serverTest('Retrieving the video source by query parameter',
    function (t, str, server, done) {
  fillStore(str, function (e, s) {
    if (e) { t.fail(e); }
    else {
      store = s;
      http.get({ port : testPort, path : `/x-nmos/query/v1.0/sources?label=Garish`}, function (res) {
        t.equal(res.statusCode, 200, 'has status code 200.');
        res.on('data', function (chunk) {
          t.deepEqual(JSON.parse(chunk.toString()), [ s.sources[videoSource.id] ],
            'matches the expected value.');
          done();
        });
      }).on('error', function (e) {
        t.fail(e); done();
      });
    }
  });
});


serverTest('Retrieving flows (with slash)',
    function (t, str, server, done) {
  fillStore(str, function (e, s) {
    if (e) { t.fail(e); }
    else {
      store = s;
      var flws = Object.keys(s.flows).map(function (x) { return s.flows[x]; });
      http.get({ port : testPort, path : `/x-nmos/query/v1.0/flows/`}, function (res) {
        t.equal(res.statusCode, 200, 'has status code 200.');
        res.on('data', function (chunk) {
          t.deepEqual(JSON.parse(chunk.toString()), flws, 'matches the expected value.');
          done();
        });
      }).on('error', function (e) {
        t.fail(e); done();
      });
    }
  });
});

serverTest('Retrieving flows (no slash)',
    function (t, str, server, done) {
  fillStore(store, function (e, s) {
    if (e) { t.fail(e); }
    else {
      store = s;
      var flws = Object.keys(s.flows).map(function (x) { return s.flows[x]; });
      http.get({ port : testPort, path : `/x-nmos/query/v1.0/flows`}, function (res) {
        t.equal(res.statusCode, 200, 'has status code 200.');
        res.on('data', function (chunk) {
          t.deepEqual(JSON.parse(chunk.toString()), flws, 'matches the expected value.');
          done();
        });
      }).on('error', function (e) {
        t.fail(e); done();
      });
    }
  });
});

serverTest('Retrieving the audio flow (with slash)',
    function (t, str, server, done) {
  fillStore(store, function (e, s) {
    if (e) { t.fail(e); }
    else {
      store = s;
      http.get({ port : testPort, path : `/x-nmos/query/v1.0/flows/${audioFlow.id}/`}, function (res) {
        t.equal(res.statusCode, 200, 'has status code 200.');
        res.on('data', function (chunk) {
          t.deepEqual(JSON.parse(chunk.toString()), s.flows[audioFlow.id], 'matches the expected value.');
          done();
        });
      }).on('error', function (e) {
        t.fail(e); done();
      });
    }
  });
});

serverTest('Retrieving the audio flow (with slash)',
    function (t, str, server, done) {
  fillStore(store, function (e, s) {
    if (e) { t.fail(e); }
    else {
      store = s;
      http.get({ port : testPort, path : `/x-nmos/query/v1.0/flows/${audioFlow.id}`}, function (res) {
        t.equal(res.statusCode, 200, 'has status code 200.');
        res.on('data', function (chunk) {
          t.deepEqual(JSON.parse(chunk.toString()), s.flows[audioFlow.id], 'matches the expected value.');
          done();
        });
      }).on('error', function (e) {
        t.fail(e); done();
      });
    }
  });
});

serverTest('Retrieving the audio flow with a query parameter',
    function (t, str, server, done) {
  fillStore(store, function (e, s) {
    if (e) { t.fail(e); }
    else {
      store = s;
      http.get({ port : testPort, path : `/x-nmos/query/v1.0/flows?description=Blas.ing`}, function (res) {
        t.equal(res.statusCode, 200, 'has status code 200.');
        res.on('data', function (chunk) {
          t.deepEqual(JSON.parse(chunk.toString()), [ s.flows[audioFlow.id] ], 'matches the expected value.');
          done();
        });
      }).on('error', function (e) {
        t.fail(e); done();
      });
    }
  });
});

serverTest('Retrieving senders (with slash)',
    function (t, str, server, done) {
  fillStore(str, function (e, s) {
    if (e) { t.fail(e); }
    else {
      store = s;
      var snds = Object.keys(s.senders).map(function (x) { return s.senders[x]; });
      http.get({ port : testPort, path : `/x-nmos/query/v1.0/senders/`}, function (res) {
        t.equal(res.statusCode, 200, 'has status code 200.');
        res.on('data', function (chunk) {
          t.deepEqual(JSON.parse(chunk.toString()), snds, 'matches the expected value.');
          done();
        });
      }).on('error', function (e) {
        t.fail(e); done();
      });
    }
  });
});

serverTest('Retrieving senders (no slash)',
    function (t, str, server, done) {
  fillStore(str, function (e, s) {
    if (e) { t.fail(e); }
    else {
      store = s;
      var snds = Object.keys(s.senders).map(function (x) { return s.senders[x]; });
      http.get({ port : testPort, path : `/x-nmos/query/v1.0/senders`}, function (res) {
        t.equal(res.statusCode, 200, 'has status code 200.');
        res.on('data', function (chunk) {
          t.deepEqual(JSON.parse(chunk.toString()), snds, 'matches the expected value.');
          done();
        });
      }).on('error', function (e) {
        t.fail(e); done();
      });
    }
  });
});

serverTest('Retrieving the video sender (with slash)',
    function (t, str, server, done) {
  fillStore(str, function (e, s) {
    if (e) { t.fail(e); }
    else {
      store = s;
      http.get({ port : testPort, path : `/x-nmos/query/v1.0/senders/${videoSender.id}/`}, function (res) {
        t.equal(res.statusCode, 200, 'has status code 200.');
        res.on('data', function (chunk) {
          t.deepEqual(JSON.parse(chunk.toString()), s.senders[videoSender.id], 'matches the expected value.');
          done();
        });
      }).on('error', function (e) {
        t.fail(e); done();
      });
    }
  });
});

serverTest('Retrieving the video sender (no slash)',
    function (t, str, server, done) {
  fillStore(str, function (e, s) {
    if (e) { t.fail(e); }
    else {
      store = s;
      http.get({ port : testPort, path : `/x-nmos/query/v1.0/senders/${videoSender.id}`}, function (res) {
        t.equal(res.statusCode, 200, 'has status code 200.');
        res.on('data', function (chunk) {
          t.deepEqual(JSON.parse(chunk.toString()), s.senders[videoSender.id], 'matches the expected value.');
          done();
        });
      }).on('error', function (e) {
        t.fail(e); done();
      });
    }
  });
});

serverTest('Retrieving receivers (with slash)',
    function (t, str, server, done) {
  fillStore(str, function (e, s) {
    if (e) { t.fail(e); }
    else {
      store = s;
      var rcvs = Object.keys(s.receivers).map(function (x) { return s.receivers[x]; });
      http.get({ port : testPort, path : `/x-nmos/query/v1.0/receivers/`}, function (res) {
        t.equal(res.statusCode, 200, 'has status code 200.');
        res.on('data', function (chunk) {
          t.deepEqual(JSON.parse(chunk.toString()), rcvs, 'matches the expected value.');
          done();
        });
      }).on('error', function (e) {
        t.fail(e); done();
      });
    }
  });
});

serverTest('Retrieving receivers (no slash)',
    function (t, str, server, done) {
  fillStore(str, function (e, s) {
    if (e) { t.fail(e); }
    else {
      store = s;
      var rcvs = Object.keys(s.receivers).map(function (x) { return s.receivers[x]; });
      http.get({ port : testPort, path : `/x-nmos/query/v1.0/receivers`}, function (res) {
        t.equal(res.statusCode, 200, 'has status code 200.');
        res.on('data', function (chunk) {
          t.deepEqual(JSON.parse(chunk.toString()), rcvs, 'matches the expected value.');
          done();
        });
      }).on('error', function (e) {
        t.fail(e); done();
      });
    }
  });
});

serverTest('Retrieving the audio receiver (with slash)',
    function (t, str, server, done) {
  fillStore(str, function (e, s) {
    if (e) { t.fail(e); }
    else {
      store = s;
      http.get({ port : testPort, path : `/x-nmos/query/v1.0/receivers/${audioReceiver.id}/`}, function (res) {
        t.equal(res.statusCode, 200, 'has status code 200.');
        res.on('data', function (chunk) {
          t.deepEqual(JSON.parse(chunk.toString()), s.receivers[audioReceiver.id], 'matches the expected value.');
          done();
        });
      }).on('error', function (e) {
        t.fail(e); done();
      });
    }
  });
});

serverTest('Retrieving the audio receiver (no slash)',
    function (t, str, server, done) {
  fillStore(str, function (e, s) {
    if (e) { t.fail(e); }
    else {
      store = s;
      http.get({ port : testPort, path : `/x-nmos/query/v1.0/receivers/${audioReceiver.id}`}, function (res) {
        t.equal(res.statusCode, 200, 'has status code 200.');
        res.on('data', function (chunk) {
          t.deepEqual(JSON.parse(chunk.toString()), s.receivers[audioReceiver.id], 'matches the expected value.');
          done();
        });
      }).on('error', function (e) {
        t.fail(e); done();
      });
    }
  });
});

serverTest('Retrieving the audio receiver by query parameters',
    function (t, str, server, done) {
  fillStore(str, function (e, s) {
    if (e) { t.fail(e); }
    else {
      store = s;
      http.get({
          port : testPort,
          path : `/x-nmos/query/v1.0/receivers?device_id=${device.id}&format=audio`
        }, function (res) {
        t.equal(res.statusCode, 200, 'has status code 200.');
        res.on('data', function (chunk) {
          t.deepEqual(JSON.parse(chunk.toString()), [ s.receivers[audioReceiver.id] ], 'matches the expected value.');
          done();
        });
      }).on('error', function (e) {
        t.fail(e); done();
      });
    }
  });
});

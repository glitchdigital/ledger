/* Copyright 2015 Christine S. MacNeill

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

// Run a demonstration registration API

var RegistrationAPI = require('../api/RegistrationAPI.js');
var NodeRAMStore = require('../api/NodeRAMStore.js');
var Node = require('../model/Node.js');

var node = new Node(null, null, "Punkd Up Node", "http://tereshkova.local:3000",
  "tereshkova");
var store = new NodeRAMStore(node);

var registrationAPI = new RegistrationAPI(3002, store);

registrationAPI.init().start();

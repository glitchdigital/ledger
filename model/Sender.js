/* Copyright 2015 Christine S. MacNeill

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

var Versionned = require('./Versionned.js');
var immutable = require('seamless-immutable');

function Sender(id, version, label) {
  this.id = this.generateID(id);
  this.version = this.generateVersion(version);
  this.label = this.generateLabel(label);
  return immutable(this, { prototype : Sender.prototype });
}

Sender.prototype.validID = Versionned.prototype.validID;
Sender.prototype.generateID = Versionned.prototype.generateID;
Sender.prototype.validVersion = Versionned.prototype.validVersion;
Sender.prototype.generateVersion = Versionned.prototype.gnerateVersion;
Sender.prototype.validLabel = Versionned.prototype.validLabel;
Sender.prototype.generateLabel = Versionned.prototype.generateLabel;

Sender.prototype.valid = function() {
  return this.validID(this.id) &&
    this.validVersion(this.version) &&
    this.validLabel(this.label);
}

Sender.prototype.stringify = function() { return JSON.stringify(this); }

module.exports = Sender;
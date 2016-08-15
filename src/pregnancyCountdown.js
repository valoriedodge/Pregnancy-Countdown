/**
    Copyright 2016 Valorie Dodge. All Rights Reserved.

    Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located

    in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

'use strict';
var AlexaSkill = require('./AlexaSkill'),
    eventHandlers = require('./eventHandlers'),
    intentHandlers = require('./intentHandlers');

var APP_ID = "amzn1.ask.skill.bc548160-8bf3-4ee5-9436-593749d0b14c";
var skillContext = {};

/**
 * ScoreKeeper is a child of AlexaSkill.
 * To read more about inheritance in JavaScript, see the link below.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript#Inheritance
 */
var PregnancyCountdown = function () {
    AlexaSkill.call(this, APP_ID);
    skillContext.needMoreHelp = true;
};


// Extend AlexaSkill
PregnancyCountdown.prototype = Object.create(AlexaSkill.prototype);
PregnancyCountdown.prototype.constructor = PregnancyCountdown;

eventHandlers.register(PregnancyCountdown.prototype.eventHandlers, skillContext);
intentHandlers.register(PregnancyCountdown.prototype.intentHandlers, skillContext);

module.exports = PregnancyCountdown;

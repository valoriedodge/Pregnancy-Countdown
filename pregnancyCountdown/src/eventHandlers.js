/**
    Copyright 2016 Valorie Dodge. All Rights Reserved.

    Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located

    in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

'use strict';
var storage = require('./storage'),
    textHelper = require('./textHelper');

var registerEventHandlers = function (eventHandlers, skillContext) {
    eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
        //if user said a one shot command that triggered an intent event,
        //it will start a new session, and then we should avoid speaking too many words.
        skillContext.needMoreHelp = false;
    };

    eventHandlers.onLaunch = function (launchRequest, session, response) {
        //Speak welcome message and ask user questions
        //based on whether there is a due date set or not.
        storage.loadInfo(session, function (currentPregnancy) {
            var speechOutput = '',
                reprompt;
            if (!currentPregnancy.isPregnant) {
                speechOutput += 'Pregnancy Countdown, Congratulations on your pregnancy! When is your baby due?';
                reprompt = "Please tell me what your due date is.";
            } else if (currentPregnancy.isPregnant()) {
                speechOutput += 'You can check when your due date is, ask how big your baby is, or ask how much longer you have in your pregnancy. Which would you like?';
                reprompt = textHelper.nextHelp;
            } else {
                speechOutput += 'PregnancyCountdown, What can I do for you?';
                reprompt = textHelper.completeHelp;
            }
            response.ask(speechOutput, reprompt);
        });
    };
};
exports.register = registerEventHandlers;

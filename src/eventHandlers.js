

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
            if (!currentPregnancy.data.dueDate[0]) {
                speechOutput += 'Pregnancy countdown, congratulations on your pregnancy! When is your baby due?';
                reprompt = "Please tell me what your due date is.";
            } else if (currentPregnancy.data.dueDate[0]) {
                speechOutput += 'You can check when your due date is, ask how big your baby is, or ask how much longer you have in your pregnancy. Which would you like?';
                reprompt = textHelper.nextHelp;
            } else {
                speechOutput += 'Pregnancy countdown, what can I do for you?';
                reprompt = textHelper.completeHelp;
            }
            response.ask(speechOutput, reprompt);
        });
    };
};
exports.register = registerEventHandlers;

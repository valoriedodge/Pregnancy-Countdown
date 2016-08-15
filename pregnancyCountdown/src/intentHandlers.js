/**
    Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.

    Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at

        http://aws.amazon.com/apache2.0/

    or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

'use strict';
var textHelper = require('./textHelper'),
    storage = require('./storage');

var registerIntentHandlers = function (intentHandlers, skillContext) {
    intentHandlers.AddDueDateIntent = function (intent, session, response) {
        //add due date for user
        var dueDate = intent.slots.DueDate.value;
        if (!dueDateIsValid(dueDate)) {
            response.ask('Congratulations on the pregnancy! When is the baby due?');
            return;
        }
        storage.loadInfo(session, function (currentPregnancy) {
            var speechOutput,
                reprompt;
            if (currentPregnancy.data.dueDate[0] === dueDate) {
                speechOutput += dueDate + ' has already been set.';
                if (skillContext.needMoreHelp) {
                    response.ask(speechOutput + ' what would you like to do?', 'What would you like to do?');
                } else {
                    response.tell(speechOutput);
                }
                return;
            }
            speechOutput += dueDate + ' has been set as your due date.';
            currentPregnancy.data.dueDate.push(dueDate);
            if (skillContext.needMoreHelp) {
                speechOutput += 'Would you like to know how many days you have left or would you like to know the size of the baby?';
                reprompt = textHelper.nextHelp;
            }
            currentPregnancy.save(function () {
                if (reprompt) {
                    response.ask(speechOutput, reprompt);
                } else {
                    response.tell(speechOutput);
                }
            });
        });
    };

    intentHandlers.ChangeDueDateIntent = function (intent, session, response) {
        //change the due date of the baby.
        var newDueDate = intent.slots.NewDueDate.value;
        if (!dueDateIsValid(newDueDate)) {
            response.ask('What is the new due date for the baby?', 'Please say the due date again');
            return;
        }
        storage.loadInfo(session, function (currentPregnancy) {
            currentPregnancy.data.dueDate[0] = newDueDate;

            speechOutput += 'The due date for your baby is set to' + newDueDate + '. ';
            currentPregnancy.save(function () {
                response.tell(speechOutput);
            });
        });
    };


    intentHandlers.GiveCountdownIntent = function (intent, session, response) {
        //tells the time left in the pregnancy and sends the result in a card.
        storage.loadGame(session, function (currentPregnancy) {
            var interval = intent.slots.DateFormat.value,
                continueSession,
                speechOutput = '',
                cardOutput = '';
            if (currentPregnancy.data.dueDate.length === 0) {
                response.tell('You have not set your due date.');
                return;
            }
            var currentDueDate = currentPregnancy.data.dueDate[0];
            var todayDate = new Date();
            if (!interval) {
              interval = "days";
            }
            var ans = getCountdownStatus(todayDate, currentDueDate, interval);
            speechOutput += ans + ' ' + interval + ' until the baby arrives!';
            cardOutput += ans + ' ' + interval + ' until the baby arrives!';

            response.tellWithCard(speechOutput, "Time Left", cardOutput);
        });
    };

    intentHandlers.BabyDueDateIntent = function (intent, session, response) {
        //tells the time left in the pregnancy and sends the result in a card.
        storage.loadGame(session, function (currentPregnancy) {
            var continueSession,
                speechOutput = '',
                cardOutput = '';
            if (currentPregnancy.data.dueDate.length === 0) {
                response.tell('You have not set your due date.');
                return;
            }
            var currentDueDate = currentPregnancy.data.dueDate[0];
            speechOutput += 'The baby is due ' + currentDueDate;
            cardOutput += 'The baby is due ' + currentDueDate;

            response.tellWithCard(speechOutput, "Due Date", cardOutput);
        });
    };


    intentHandlers.SizeOfBabyIntent = function (intent, session, response) {
        //tells the size of the baby and sends the result in a card.
        storage.loadGame(session, function (currentPregnancy) {
            var continueSession,
                ans,
                speechOutput = '',
                cardOutput = '';
            if (currentPregnancy.data.dueDate.length === 0) {
                response.tell('You have not set your due date.');
                return;
            }
            var currentDueDate = currentPregnancy.data.dueDate[0];
            var todayDate = new Date();
            var interval = "weeks";
            var weeks = (40 - getCountdownStatus(todayDate, currentDueDate, interval));
            ans = sizes[weeks];
            if (!ans) {
              ans = "I don't know.";
            }

            speechOutput += ans;
            cardOutput += ans;

            response.tellWithCard(speechOutput, "Baby Size", cardOutput);
        });
    };

    intentHandlers.BabyDeliveredIntent = function (intent, session, response) {
        //remove due date
        storage.newPregnancy(session).save(function () {
            response.tell('Congratulations! I hope all is well with the mother and baby.');
        });
    };

    intentHandlers.PregnancyTerminatedIntent = function (intent, session, response) {
        //remove due date
        storage.newPregnancy(session).save(function () {
            response.tell('Due date has been removed. I hope all is well with the mother and baby.');
        });
    };

    intentHandlers['AMAZON.HelpIntent'] = function (intent, session, response) {
        var speechOutput = textHelper.completeHelp;
        if (skillContext.needMoreHelp) {
            response.ask(textHelper.completeHelp + ' So, how can I help?', 'How can I help?');
        } else {
            response.tell(textHelper.completeHelp);
        }
    };

    intentHandlers['AMAZON.CancelIntent'] = function (intent, session, response) {
        if (skillContext.needMoreHelp) {
            response.tell('Okay.  Whenever you\'re ready, you can start giving points to the players in your game.');
        } else {
            response.tell('');
        }
    };

    intentHandlers['AMAZON.StopIntent'] = function (intent, session, response) {
        if (skillContext.needMoreHelp) {
            response.tell('Okay.  Whenever you\'re ready, you can start giving points to the players in your game.');
        } else {
            response.tell('');
        }
    };
};

function dueDateIsValid(date) {
    var currentDate = new Date();
    var days = "days";
    var checkDate = getCountdownStatus(currentDate, date, days);
    if (!checkDate || checkDate === NaN || checkDate < 0 || checkDate > 365) {
      return false;
    }  else {
      return true;
    }
}

var sizes = {
  3: "Microscopic",
  4: "Your baby is about the size of a poppy seed",
  5: "Your baby is about the size of a sesame seed",
  6: "Your baby is about the size of a kernal of corn",
  7: "Your baby is about the size of a blueberry",
  8: "Your baby is about the size of a lima bean",
  9: "Your baby is about the size of a cherry",
  10: "Your baby is about the size of a walnut",
  11: "Your baby is about the size of a apricot",
  12: "Your baby is about the size of a lime",
  13: "Your baby is about the size of a plum",
  14: "Your baby is about the size of a lemon",
  15: "Your baby is about the size of an apple",
  16: "Your baby is about the size of an avocado",
  17: "Your baby is about the size of a pear",
  18: "Your baby is about the size of a bell pepper",
  19: "Your baby is about the size of an sweet potato",
  20: "Your baby is about the size of a artichoke",
  21: "Your baby is about the size of a banana",
  22: "Your baby is about the size of a small spaghetti squash",
  23: "Your baby is about the size of a large mango",
  24: "Your baby is about the size of an ear of corn",
  25: "Your baby is about the size of a large papaya",
  26: "Your baby is about the size of a zucchini",
  27: "Your baby is about the size of a head of cauliflower",
  28: "Your baby is about the size of a large eggplant",
  29: "Your baby is about the size of a butternut squash",
  30: "Your baby is about the size of a coconut",
  31: "Your baby is about the size of a large cabbage",
  32: "Your baby is about the size of a jicama",
  33: "Your baby is about the size of a pineapple",
  34: "Your baby is about the size of a cantaloupe",
  35: "Your baby is about the size of a honeydew melon",
  36: "Your baby is about the size of a head of romaine lettuce",
  37: "Your baby is about the size of a bunch of Swiss chard",
  38: "Your baby is about the length of a stalk of rhubarb",
  39: "Your baby is about the size of a mini-watermelon",
  40: "Your baby is about the size of a small pumpkin",
  41: "Your baby is about the size of a watermelon"
}

function getCountdownStatus(currentDate,dueDate,interval) {
    var second=1000, minute=second*60, hour=minute*60, day=hour*24, week=day*7;
    var timediff = dueDate - currentDate;
    if (isNaN(timediff)) return NaN;
    switch (interval) {
        case "years": return date2.getFullYear() - date1.getFullYear();
        case "months": return (
            ( date2.getFullYear() * 12 + date2.getMonth() )
            -
            ( date1.getFullYear() * 12 + date1.getMonth() )
        );
        case "weeks"  : return Math.floor(timediff / week);
        case "days"   : return Math.floor(timediff / day);
        default: return undefined;
    }
}

exports.register = registerIntentHandlers;

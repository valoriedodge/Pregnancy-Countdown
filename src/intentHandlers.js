/**
    Copyright 2016 Valorie Dodge. All Rights Reserved.

    Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located

    in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

'use strict';
var textHelper = require('./textHelper'),
    storage = require('./storage');
var express = require('express');
var request = require('request');

var app = express();

var GA_TRACKING_ID = 'UA-83204288-1';

var registerIntentHandlers = function (intentHandlers, skillContext) {
    intentHandlers.AddDueDateIntent = function (intent, session, response) {
        //add due date for user
        var dueDate = intent.slots.DueDate.value;


        trackEvent(
          'Intent',
          'AddDueDateIntent',
          'na',
          '100', // Event value must be numeric.
          function(err) {
            if (err) {
                var speechOutput = err;
                response.tell(speechOutput);
            }
          });
        storage.loadInfo(session, function (currentPregnancy) {
            var speechOutput = '',
                reprompt = textHelper.nextHelp;
            if (currentPregnancy.data.dueDate[0]) {
                speechOutput += 'I have the due date set as ' + currentPregnancy.data.dueDate[0] + '.';
                if (skillContext.needMoreHelp) {
                    response.ask(speechOutput + ' What would you like to do?', 'What would you like to do?');
                }
                response.ask(speechOutput + ' What woud you like to do?', 'What would you like to do?');
                return;
            }
            if (!dueDate) {
                response.ask('Congratulations on the pregnancy! When is the baby due?', 'When is the baby due?');
                return;
            }

            if (!dueDateIsValid(dueDate)){
                response.ask('I did not get that date. When is the baby due?', 'When is the baby due?');
                return;
            }
            speechOutput += 'Congratulations! ' + dueDate + ' has been set as the due date. ';
            currentPregnancy.data.dueDate[0] = dueDate;

            currentPregnancy.save(function () {
              response.ask(speechOutput + "Would you like to know anything else?", reprompt);
            });
        });
    };

    intentHandlers.ChangeDueDateIntent = function (intent, session, response) {
        //change the due date of the baby.
        var newDueDate = intent.slots.NewDueDate.value;
        if (!newDueDate || !dueDateIsValid(newDueDate)) {
            response.ask('If you would like to change the due date, please say: change due date to: followed by new due date. ', 'Please say the due date again');
            return;
        }
        trackEvent(
          'Intent',
          'ChangeDueDateIntent',
          'na',
          '100', // Event value must be numeric.
          function(err) {
            if (err) {
                var speechOutput = err;
                response.tell(speechOutput);
            }
          });
        storage.loadInfo(session, function (currentPregnancy) {
            var speechOutput = '',
              reprompt = textHelper.nextHelp;
            currentPregnancy.data.dueDate[0] = newDueDate;

            speechOutput += 'The due date for your baby is set to ' + newDueDate + '. ';
            currentPregnancy.save(function () {
              response.ask(speechOutput + "Anything else?", reprompt);
            });
        });
    };


    intentHandlers.GiveCountdownIntent = function (intent, session, response) {
        //tells the time left in the pregnancy and sends the result in a card.
        storage.loadInfo(session, function (currentPregnancy) {
            var interval = intent.slots.DateFormat.value,
                continueSession,
                speechOutput = '',
                cardOutput = '';
            if (!currentPregnancy.data.dueDate[0]) {
                response.ask('You have not set a due date. When is the baby due?', "What is the due date for the baby?");
                return;
            }
            trackEvent(
              'Intent',
              'GiveCountDownIntent',
              'na',
              '100', // Event value must be numeric.
              function(err) {
                if (err) {
                    var speechOutput = err;
                    response.tell(speechOutput);
                }
              });
            var currentDueDate = new Date(currentPregnancy.data.dueDate[0]);
            var todayDate = new Date();
            if (!interval) {
              interval = "days";
            }
            var ans = getCountdownStatus(todayDate, currentDueDate, interval);
            if (interval === "days") {
              ans += 1;
            }
            if (ans > 1){
              speechOutput += ans + ' ' + interval + ' until the baby arrives!';
              cardOutput += ans + ' ' + interval + ' until the baby arrives!';
            } else if (ans === 1) {
              if (interval == "months") {
                speechOutput += 'Only one month until the baby arrives!';
                cardOutput += 'Only one month until the baby arrives!';
              } else if (interval == "weeks") {
                speechOutput += 'Only one week until the baby should arrive!';
                cardOutput += 'Only one week until the baby should arrive!';
              } else if (interval == "days"){
                speechOutput += 'Just one day until the baby should arrive!';
                cardOutput += 'Just one day until the baby should arrive!';
              }
            } else if (ans === 0) {
              if (interval == "months") {
                speechOutput += 'You are due this month!';
                cardOutput += 'You are due this month!';
              } else if (interval == "weeks") {
                speechOutput += 'You are due this week!';
                cardOutput += 'You are due this week!';
              } else if (interval == "days"){
                speechOutput += 'You are due today!';
                cardOutput += 'You are due today!';
              }
            } else if (ans === -1) {
              if (interval == "weeks") {
                speechOutput += 'You are one week overdue!';
                cardOutput += 'You are one week overdue!';
              } else if (interval == "days"){
                speechOutput += 'You are one day overdue!';
                cardOutput += 'You are one day overdue!';
              }
            } else {
              ans = -ans;
              speechOutput += 'You are ' + ans + ' ' + interval + ' overdue!';
              cardOutput += 'You are ' + ans + ' ' + interval + ' overdue!';
            }

            response.tellWithCard(speechOutput, "Time Left", cardOutput);
        });
    };

    intentHandlers.HowFarIntent = function (intent, session, response) {
        //tells the time left in the pregnancy and sends the result in a card.
        storage.loadInfo(session, function (currentPregnancy) {
            var continueSession,
                speechOutput = '',
                cardOutput = '';
            if (!currentPregnancy.data.dueDate[0]) {
                response.ask('You have not set a due date. When is the baby due?', "What is the due date for the baby?");
                return;
            }
            trackEvent(
              'Intent',
              'HowFarIntent',
              'na',
              '100', // Event value must be numeric.
              function(err) {
                if (err) {
                    var speechOutput = err;
                    response.tell(speechOutput);
                }
              });
            var currentDueDate = new Date(currentPregnancy.data.dueDate[0]);
            var todayDate = new Date();

            var ans = (40 - getCountdownStatus(todayDate, currentDueDate, "weeks"));
            var quip = quips[ans];
            speechOutput += 'You are about ' + ans + ' weeks along. ' + quip;
            cardOutput += 'You are about ' + ans + ' weeks along. ' + quip;

            response.tellWithCard(speechOutput, "Weeks Pregnant", cardOutput);
        });
    };

    intentHandlers.BabyDueDateIntent = function (intent, session, response) {
        //tells the time left in the pregnancy and sends the result in a card.
        storage.loadInfo(session, function (currentPregnancy) {
            var continueSession,
                speechOutput = '',
                cardOutput = '';
            if (!currentPregnancy.data.dueDate[0]) {
                response.ask('You have not set a due date. When is the baby due?', 'When is the baby due?');
                return;
            }
            trackEvent(
              'Intent',
              'BabyDueDateIntent',
              'na',
              '100', // Event value must be numeric.
              function(err) {
                if (err) {
                    var speechOutput = err;
                    response.tell(speechOutput);
                }
              });
            var currentDueDate = currentPregnancy.data.dueDate[0];
            speechOutput += 'The baby is due ' + currentDueDate;
            cardOutput += 'The baby is due ' + currentDueDate;

            response.tellWithCard(speechOutput, "Due Date", cardOutput);
        });
    };


    intentHandlers.SizeOfBabyIntent = function (intent, session, response) {
        //tells the size of the baby and sends the result in a card.
        storage.loadInfo(session, function (currentPregnancy) {
            var continueSession,
                ans,
                speechOutput = '',
                cardOutput = '';
            if (!currentPregnancy.data.dueDate[0]) {
                response.ask('You have not set a due date. When is the baby due?', 'When is the baby due?');
                return;
            }
            trackEvent(
              'Intent',
              'SizeofBabyIntent',
              'na',
              '100', // Event value must be numeric.
              function(err) {
                if (err) {
                    var speechOutput = err;
                    response.tell(speechOutput);
                }
              });
            var currentDueDate = new Date(currentPregnancy.data.dueDate[0]);
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
            trackEvent(
              'Intent',
              'BabyDeliveredIntent',
              'na',
              '100', // Event value must be numeric.
              function(err) {
                if (err) {
                    var speechOutput = err;
                    response.tell(speechOutput);
                }
              });
            response.tell('Congratulations! I hope all is well with the mother and baby.');
        });
    };

    intentHandlers.PregnancyTerminatedIntent = function (intent, session, response) {
        //remove due date
        storage.newPregnancy(session).save(function () {
            trackEvent(
              'Intent',
              'PregnancyTerminatedIntent',
              'na',
              '100', // Event value must be numeric.
              function(err) {
                if (err) {
                    var speechOutput = err;
                    response.tell(speechOutput);
                }
              });
            response.tell('Due date has been removed.');
        });
    };

    intentHandlers['AMAZON.NoIntent'] = function (intent, session, response) {
      if (skillContext.needMoreHelp) {
          response.tell('Okay.  Whenever you\'re ready, you can ask about your baby.');
      } else {
          response.tell('Goodbye');
      }
    };

    intentHandlers['AMAZON.HelpIntent'] = function (intent, session, response) {
        var speechOutput = textHelper.completeHelp;
        if (skillContext.needMoreHelp) {
            response.ask(textHelper.completeHelp + ' So, how can I help?', 'How can I help?');
        } else {
            response.ask(textHelper.nextHelp);
        }
    };

    intentHandlers['AMAZON.CancelIntent'] = function (intent, session, response) {
        if (skillContext.needMoreHelp) {
            response.tell('Okay.  Whenever you\'re ready, you can ask about your baby.');
        } else {
            response.tell('Goodbye');
        }
    };

    intentHandlers['AMAZON.StopIntent'] = function (intent, session, response) {
        if (skillContext.needMoreHelp) {
            response.tell('Okay.  Whenever you\'re ready, you can ask about your baby.');
        } else {
            response.tell('Goodbye');
        }
    };
};

function dueDateIsValid(date) {
    var currentDate = new Date();
    var proposedDate = new Date(date);
    var days = "days";
    var checkDate = getCountdownStatus(currentDate, proposedDate, days) + 5;
    if (!checkDate || isNaN(checkDate) || checkDate < 0 || checkDate > 285) {
      return false;
    }  else {
      return true;
    }
}

var sizes = {
  3: "Microscopic",
  4: "Your baby is about the size of a poppy seed.",
  5: "Your baby is about the size of a sesame seed.",
  6: "Your baby is about the size of a kernal of corn.",
  7: "Your baby is about the size of a blueberry.",
  8: "Your baby is about the size of a lima bean. Weighing about 0.04 ounces, and 0.6 inches long.",
  9: "Your baby is about the size of a cherry. Weighing about 0.07 ounces, and 0.9 inches long.",
  10: "Your baby is about the size of a walnut. Weighing about 0.14 ounces, and 1.2 inches long.",
  11: "Your baby is about the size of an apricot. Weighing about 0.25 ounces, and 1.6 inches long.",
  12: "Your baby is about the size of a lime. Weighing about 0.5 ounces, and 2.1 inches long.",
  13: "Your baby is about the size of a plum. Weighing about 0.81 ounces, and 2.9 inches long.",
  14: "Your baby is about the size of a lemon. Weighing about 1.5 ounces, and 3.4 inches long.",
  15: "Your baby is about the size of an apple. Weighing about 2.5 ounces, and 4 inches long.",
  16: "Your baby is about the size of an avocado. Weighing about 3.5 ounces, and 4.6 inches long.",
  17: "Your baby is about the size of a pear. Weighing about 5 ounces, and 5.1 inches long.",
  18: "Your baby is about the size of a bell pepper. Weighing about 6.7 ounces, and 5.6 inches long.",
  19: "Your baby is about the size of an sweet potato. Weighing about 8.5 ounces, and 6 inches long.",
  20: "Your baby is about the size of an artichoke. Weighing about 10.6 ounces, and 10.1 inches long.",
  21: "Your baby is about the size of a banana. Weighing about 12.7 ounces, and 10.5 inches long.",
  22: "Your baby is about the size of a small spaghetti squash. Weighing about 15.1 ounces, and 10.9 inches long.",
  23: "Your baby is about the size of a large mango. Weighing about 1.1 pounds, and 11.4 inches long.",
  24: "Your baby is about the size of an ear of corn. Weighing about 1.3 pounds, and 11.8 inches long.",
  25: "Your baby is about the size of a large papaya. Weighing about 1.5 pounds, and 13.6 inches long.",
  26: "Your baby is about the size of a zucchini. Weighing about 1.7 pounds, and 14 inches long.",
  27: "Your baby is about the size of a head of cauliflower. Weighing about 1.9 pounds, and 14.4 inches long.",
  28: "Your baby is about the size of a large eggplant. Weighing about 2.2 pounds, and 14.8 inches long.",
  29: "Your baby is about the size of a butternut squash. Weighing about 2.5 pounds, and 15.2 inches long.",
  30: "Your baby is about the size of a coconut. Weighing about 2.9 pounds, and 15.7 inches long.",
  31: "Your baby is about the size of a large cabbage. Weighing about 3.3 pounds, and 16.2 inches long.",
  32: "Your baby is about the size of a jicama. Weighing about 3.7 pounds, and 16.7 inches long.",
  33: "Your baby is about the size of a pineapple. Weighing about 4.2 pounds, and 17.2 inches long.",
  34: "Your baby is about the size of a cantaloupe. Weighing about 4.7 pounds, and 17.7 inches long.",
  35: "Your baby is about the size of a honeydew melon. Weighing about 5.2 pounds, and 18.2 inches long.",
  36: "Your baby is about the size of a head of romaine lettuce. Weighing about 5.8 pounds, and 18.6 inches long.",
  37: "Your baby is about the size of a bunch of Swiss chard. Weighing about 6.3 pounds, and 19.1 inches long.",
  38: "Your baby is about the length of a stalk of rhubarb. Weighing about 6.8 pounds, and 19.6 inches long.",
  39: "Your baby is about the size of a mini-watermelon. Weighing about 7.2 pounds, and 20 inches long.",
  40: "Your baby is about the size of a small pumpkin. Weighing about 7.6 pounds, and 20.1 inches long.",
  41: "Your baby is about the size of a watermelon. Weighing about 8 pounds, and 20.3 inches long.",
  42: "Your baby is still about the size of a watermelon. It's time for your baby to come out!"
}

var quips = {
  3: "You're just starting!",
  4: "Feeling sick yet?",
  5: "Your baby has a heartbeat!",
  6: "Your baby is starting to have a face!",
  7: "Any cravings yet? My mom craved cookies.",
  8: "Time for your first prenatal appointment!",
  9: "Your baby now has eyes!",
  10: "How is your morning sickness?",
  11: "Tired? Growing a baby is hard work.",
  12: "You deserve some chocolate.",
  13: "You made it to the second trimester!",
  14: "Your baby has started urinating. You're probably going to start doing that more too.",
  15: "Are you taking your prenatal vitamin?",
  16: "With a clear view, you could tell if your baby is a boy or girl.",
  17: "Any crazy pregnancy dreams?",
  18: "Have you felt your baby move yet?",
  19: "Almost half way there!",
  20: "Are you going to find out the gender? ",
  21: "Over halfway there!",
  22: "Pregnancy brain is a real thing.",
  23: "It's not you. It's the pregnancy.",
  24: "Try to take extra care of yourself.",
  25: "There is no shame in eating one for the baby too.",
  26: "Don't be ashamed if you lost your keys again.",
  27: "You deserve a foot massage",
  28: "Finally, the third trimester!",
  29: "Getting any sleep at night?",
  30: "How is the name choosing coming? You could always name your baby Alexa, like me.",
  31: "How's your back? You should consider getting a body pillow if you don't have one.",
  32: "Maybe time to start thinking about the nursery for the baby if you haven't already.",
  33: "How are the baby olympics in your stomach?",
  34: "Feeling big yet?",
  35: "Do you remember what it was like to sleep a whole night through?",
  36: "Getting close, do you have everything ready for the hospital?",
  37: "In a few short weeks, you will be able to tie your shoes again.",
  38: "How's your back?",
  39: "Almost there! And bending over will be easy again.",
  40: "It's time to have a baby! Any contractions?",
  41: "Why is the baby still in there?",
  42: "I'm so sorry."
}

function getCountdownStatus(date1,date2,interval) {
    var second=1000, minute=second*60, hour=minute*60, day=hour*24, week=day*7;
    var timediff = date2 - date1;
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



function trackEvent(category, action, label, value, callback) {
  var data = {
    v: '1', // API Version.
    tid: GA_TRACKING_ID, // Tracking ID / Property ID.
    // Anonymous Client Identifier. Ideally, this should be a UUID that
    // is associated with particular user, device, or browser instance.
    cid: '555',
    t: 'event', // Event hit type.
    ec: category, // Event category.
    ea: action, // Event action.
    el: label, // Event label.
    ev: value, // Event value.
  };

  request.post(
    'http://www.google-analytics.com/collect', {
      form: data
    },
    function(err, response) {
      if (err) { return callback(err); }
      if (response.statusCode !== 200) {
        return callback(new Error('Tracking failed'));
      }
      callback();
    }
  );
}

exports.register = registerIntentHandlers;

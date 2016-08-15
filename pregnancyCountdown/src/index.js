
'use strict';
var PregnancyCountdown = require('./pregnancyCountdown');

exports.handler = function (event, context) {
    var pregnancyCountdown = new PregnancyCountdown();
    pregnancyCountdown.execute(event, context);
};

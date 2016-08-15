'use strict';
var AWS = require("aws-sdk");

var storage = (function () {
    var dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

    /*
     * The Pregnancy class stores the pregnancy due date as a hash for the user
     */
    function Pregnancy(session, data) {
        if (data) {
            this.data = data;
        } else {
            this.data = {
                dueDate: []
            };
        }
        this._session = session;
    }

    Pregnancy.prototype = {
        isPregnant: function () {
            //check if there is already data in the table
            //it can be used as an indication of whether the user has already set a due date
            var pregnant = false;
            var pregnancyData = this.data;
            if (pregnancyData.dueDate.length !== 0) {
              pregnant = true;
            }
            return pregnant;
        },
        save: function (callback) {
            //save the pregnancy info in the session,
            //so next time we can save a read from dynamoDB
            this._session.attributes.currentPregnancy = this.data;
            dynamodb.putItem({
                TableName: 'PregnancyCountdownUserData',
                Item: {
                    CustomerId: {
                        S: this._session.user.userId
                    },
                    Data: {
                        S: JSON.stringify(this.data)
                    }
                }
            }, function (err, data) {
                if (err) {
                    console.log(err, err.stack);
                }
                if (callback) {
                    callback();
                }
            });
        }
    };

    return {
        loadInfo: function (session, callback) {
            if (session.attributes.currentPregnancy) {
                console.log('get pregnancy info from session=' + session.attributes.currentPregnancy);
                callback(new Pregnancy(session, session.attributes.currentPregnancy));
                return;
            }
            dynamodb.getItem({
                TableName: 'PregnancyCountdownUserData',
                Key: {
                    CustomerId: {
                        S: session.user.userId
                    }
                }
            }, function (err, data) {
                var currentPregnancy;
                if (err) {
                    console.log(err, err.stack);
                    currentPregnancy = new Pregnancy(session);
                    session.attributes.currentPregnancy = currentPregnancy.data;
                    callback(currentPregnancy);
                } else if (data.Item === undefined) {
                    currentPregnancy = new Pregnancy(session);
                    session.attributes.currentPregnancy = currentPregnancy.data;
                    callback(currentPregnancy);
                } else {
                    console.log('get pregnancy info from dynamodb=' + data.Item.Data.S);
                    currentPregnancy = new Pregnancy(session, JSON.parse(data.Item.Data.S));
                    session.attributes.currentPregnancy = currentPregnancy.data;
                    callback(currentPregnancy);
                }
            });
        },
        newPregnancy: function (session) {
            return new Pregnancy(session);
        }
    };
})();
module.exports = storage;

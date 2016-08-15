/**
    Copyright 2016 Valorie Dodge. All Rights Reserved.

    Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located

    in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/

'use strict';
var textHelper = (function () {
    return {
        completeHelp: 'Here are some things you can say,'
        + ' when is the baby going to be here'
        + ' how big is my baby'
        + ' my baby\'s due date is December 3rd'
        + ' how many days until my due date'
        + ' change my due date to November 26th'
        + ' tell me how many weeks left'
        + ' and exit.',
        nextHelp: 'You can check when your due date is, ask how big your baby is, or ask how much longer you have in your pregnancy. Which would you like?',
    };
})();
module.exports = textHelper;

/* checkCondition:
 *
 * checks if a ticket matches a given set of conditions
 *
 */
var util = {
    version: '.01',

    operators: {
        is: function(value1, value2) {
            return value1 === value2;
        },

        is_not: function(value1, value2) {
            return value1 !== value2;
        },

        any: function(conditions) {
            var result = true;
            conditions.forEach(function(condition) {
                result = result || condition;
            });
            return result;
        },

        all: function(conditions) {
            var result = true;
            conditions.forEach(function(condition) {
                result = result && condition;
            });
            return result;
        }
    },

    attributes: {
        assignee_id: function() {
            var id = util.appFramework.ticket().assignee().user().id();
            return id;
        },

        current_user: function() {
            var id =  util.appFramework.currentUser().id();
            return id;
        },

        role: function() {
            var id =  util.appFramework.currentUser().role();
            return id;
        },

        group_id: function() {
            var id = util.appFramework.ticket().assignee().group().id();
            return id;
        },

        status: function() {
            var status = util.appFramework.ticket().status();
            return status;
        }
    },

    mapCondition: function(conditions) {
        return conditions.map(function(condition) {
            var operator = util.operators[condition.operator];
            var value1 = util.attributes[condition.field]();
            var value2 = condition.value || util.attributes[condition.field2]();
            return operator(value1, value2); 
        }); 
    }  
};

module.exports = {

    factory: function(context) { 
        util.appFramework = context;
        return this.checkCondition;
    },

    checkCondition: function(conditions) { 
        var all = util.operators.all(util.mapCondition(conditions.all));
        var any = util.operators.any(util.mapCondition(conditions.any));
        return all && any;
    }
};

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

        includes: function(ticket, condition) {
            return _.intersection(ticket, condition).length > 0;
        },

        not_includes: function(ticket, condition) {
            return _.intersection(ticket, condition).length == 0;
        },

        includes_all: function(ticket, condition) {
            return _.intersection(ticket, condition) == ticket.length;
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

        user_id: function() {
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
        },

        requester_id: function() {
            return util.appFramework.ticket().requester().id();
        },

        current_tags: function() {
            return util.appFramework.ticket().tags();
        },

        priority: function() {
            return util.appFramework.ticket().priority();
        },

        organization_id: function() {
            return util.appFramework.ticket().organization().id();
        },

        ticket_id: function() {
            return util.appFramework.ticket().id();
        },

        ticket_type: function() {
            return util.appFramework.ticket().type();
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

        var all = conditions.all ? util.operators.all(util.mapCondition(conditions.all)) : true;
        var any = conditions.any ? util.operators.any(util.mapCondition(conditions.any)) : true;
        return all && any;
    }
};

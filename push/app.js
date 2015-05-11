(function() {

  return {
    events: {
      'app.activated':'aggregateEvent',
      'app.deactivated':'aggregateEvent',
      '*.changed':'aggregateEvent',
      'ticket.submit.done':function() {this.aggregateEvent(this.generateEvent('ticket.submit.done'));},
      'ticket.save':function() {this.aggregateEvent(this.generateEvent('ticket.save')); return true;},
      'ticket.submit.always':'aggregateEvent',
    },

    requests: {
        pushData: function(data, ticket, agent) {
            return {
                url: helpers.fmt("http://cat-bus.herokuapp.com/api/events/ticket/%@/agent/%@.json",
                     ticket,
                     agent),
                type: 'POST',
                data: JSON.stringify({data: data})
            }
        }
    },

    maxUpdateRate: 10000,
    eventUpdates: [],
    waiting: false,

    generateEvent(e) {
        return {'propertyName': e, 'timestamp': Date.now()};
    },

    aggregateEvent: function(e) {
        if(!this.waiting) {
            this.waiting = true;
            setTimeout(_.bind(this.postData, this, this.ticket().id(), this.currentUser().id()), this.maxUpdateRate);
        }
        this.eventUpdates.push(e);
    },

    postData: function(ticket, agent) {
        var updates = this.eventUpdates;
        this.eventUpdates = [];
        this.waiting = false;
        this.ajax('pushData', updates, ticket, agent).done(function() {
            console.log('data pushed');
        });
    }
  };

}());

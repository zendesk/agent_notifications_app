(function() {

  return {
    events: {
      'app.activated':'doSomething',
      'app.deactivated':'doSomething',
      '*.changed':'doSomething',
      'ticket.submit.done':function() {this.doSomething(this.generateEvent('ticket.submit.done'));},
      'ticket.save':function() {this.doSomething(this.generateEvent('ticket.save')); return true;},
      'ticket.submit.always':'doSomething',
    },

    maxUpdateRate: 5000,
    eventUpdates: [],
    waiting: false,

    generateEvent(e) {
        return {'propertyName': e, 'timestamp': Date.now()};
    }

    aggregateEvent: function(e) {
        if(!this.waiting) {
            this.waiting = true;
            setTimeout(_.bind(this.postData, this), this.maxUpdateRate);
        }
        this.eventUpdates.push(e);
    },

    doSomething: function(e) {
        this.aggregateEvent(e);
    },

    postData: function() {
        var updates = this.eventUpdates;
        this.eventUpdates = [];
        this.waiting = false;
        console.log(updates);
    }
  };

}());

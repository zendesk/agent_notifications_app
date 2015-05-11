(function() {

  return {
    events: {
      'app.activated':'doSomething',
      'app.deactivated':'doSomething',
      '*.changed':'doSomething',
      'ticket.submit.done':function() {this.doSomething('ticket.submit.done')},
      'ticket.save':function() {this.doSomething('ticket.save'); return true;},
      'ticket.submit.always':'doSomething',
    },

    doSomething: function(e) {
        console.log(e);
    }
  };

}());

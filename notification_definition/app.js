(function() {

  return {
    events: {
      'app.activated':'index',
      'click #newNotification': 'newNotification'
    },

    index: function() {
      var notifications = {
        active: this.activeNotifications,
        inactive: this.inactiveNotifications
      };

      this.switchTo('index', notifications);
    },

    newNotification: function(e) {
      e.preventDefault();
      this.switchTo('new_notification', null);
    },

    activeNotifications: [
      {id: 1, name: "Here", otherStuff: {}},
      {id: 2, name: "Hello", otherStuff: {}},
      {id: 2, name: "Nope", otherStuff: {}},
      {id: 2, name: "Face Punch", otherStuff: {}}
    ],

    inactiveNotifications: [
      {id: 1, name: "I'm inactive", otherStuff: {}},
      {id: 2, name: "No this is boring", otherStuff: {}}
    ]
  };

}());

(function() {

  return {
    operators: [
      {
        html:"<select><option>is</option></select>",
        qualifiers:["assignee_id","organization_id"]
      },
      {
        html:"<select><option>includes</option></select>",
        qualifiers:["current_tags"]
      }
    ],

  	requests: {
      autocompleteRequester: function(name) {
        return {
          url: helpers.fmt('/api/v2/users/autocomplete.json?name=%@', name),
          type: 'GET'
        };
      },
      autocompleteOrganization: function(name) {
        return {
          url: helpers.fmt('/api/v2/organizations/autocomplete.json?name=%@', name),
          type: 'GET'
        };
      }
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

    events: {
      'app.activated':'index',
      'click #newNotification': 'newNotification',
      'change .chosen_dropdown': 'show_operation'
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
      this.autocompleteRequesterName();
      this.autocompleteOrganizationName();
    },

    show_operation: function(e) {
    	e.preventDefault();
      var current_option = e.currentTarget.value;
      console.log(current_option);
    },

    autocompleteRequesterName: function() {
      var self = this;
      this.$('#user_auto').autocomplete({
        minLength: 3,
        source: function(request, response){
          self.ajax('autocompleteRequester', request.term).done(function(data){
            response(_.map(data.users, function(user) {
              return {
                "label": user.name,
                "value": user.id
              };
            }));
          });
        },
        select: function(event, ui) {
          event.preventDefault();
          self.$('#user_auto').val(ui.item.label);
        },
        focus: function(event, ui) {
          event.preventDefault();
          self.$('#user_auto').val(ui.item.label);
        }
      }, this);
    },

    autocompleteOrganizationName: function() {
      var self = this;
      this.$('#org_auto').autocomplete({
        minLength: 3,
        source: function(request, response){
          self.ajax('autocompleteOrganization', request.term).done(function(data){
            response(_.map(data.organizations, function(org) {
              return {
                "label": org.name,
                "value": org.id
              };
            }));
          });
        },
        select: function(event, ui) {
          event.preventDefault();
          self.$('#org_auto').val(ui.item.label);
        },
        focus: function(event, ui) {
          event.preventDefault();
          self.$('#org_auto').val(ui.item.label);
        }
      }, this);
    }
  };

}());

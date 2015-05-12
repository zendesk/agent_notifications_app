(function() {

  return {
    operators: [
      {
        html:"<select><option value='is'>is</option><option value='is_not'>is_not</option></select><input class='opVal' type='text' />",
        qualifiers:["status_id","ticket_type_id","priority_id","requester_id","assignee_id","organization_id"]
      },
      {
        html:"<select><option value='includes'>includes</option><option value='not_includes'>does not include</option></select><input class='opVal' type='text' />",
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
    ],

    events: {
      'app.activated':'index',
      'click #newNotification': 'newNotification',
      'click #cancelCreate': 'index',
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
    },

    show_operation: function(e) {
    	e.preventDefault();
      var selected = e.currentTarget;
      var current_option = e.currentTarget.value;
      var target = this.$(selected)[0];
      var op_obj = _.filter(this.operators, function(item){
        return item.qualifiers.indexOf(current_option) > -1;
      });
      var op_html = op_obj[0].html;
      var inserted = this.$(target).parent().children(".opAndValue").html(op_html);
      if (current_option == 'requester_id' || current_option == 'assignee_id') {
        this.$(inserted).children("input.opVal").addClass('autocomplete_user');
        this.autocompleteRequesterName();
      }
      if (current_option == 'organization_id') {
        this.$(inserted).children("input.opVal").addClass('autocomplete_org');
        this.autocompleteOrganizationName();
      }
    },

    autocompleteRequesterName: function() {
      var self = this;
      this.$('.autocomplete_user').autocomplete({
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
          self.$('.autocomplete_user').val(ui.item.label);
        },
        focus: function(event, ui) {
          event.preventDefault();
          self.$('.autocomplete_user').val(ui.item.label);
        }
      }, this);
    },

    autocompleteOrganizationName: function() {
      var self = this;
      this.$('.autocomplete_org').autocomplete({
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
          self.$('.autocomplete_org').val(ui.item.label);
        },
        focus: function(event, ui) {
          event.preventDefault();
          self.$('.autocomplete_org').val(ui.item.label);
        }
      }, this);
    }
  };

}());

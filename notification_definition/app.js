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
    ],

    events: {
      'app.activated':'index',
      'click #newNotification': 'newNotification',
      'click #cancelCreate': 'index',
      'change .chosen_dropdown': 'show_operation',
      'click #addAllCondition': 'addAllCondition',
      'click #addAnyCondition': 'addAnyCondition',
      'click .remove_condition': 'removeCondition'
    },

    allConditionsCounter: 0,
    anyConditionsCounter: 0,

    index: function() {
      var notifications = {
        active: this.activeNotifications,
        inactive: this.inactiveNotifications
      };
      this.allConditionsCounter = 0;
      this.anyConditionsCounter = 0;

      this.switchTo('index', notifications);
    },

    newNotification: function(e) {
      e.preventDefault();
      this.switchTo('new_notification', null);
      this.autocompleteRequesterName();
      this.autocompleteOrganizationName();
    },

    addAllCondition: function(e) {
      e.preventDefault();
      this.allConditionsCounter += 1;
      var fieldset = this.renderTemplate('all_condition_fieldset', {id: this.allConditionsCounter});
      this.$('#all_conditions').append(fieldset);
    },

    removeCondition: function(e) {
      e.preventDefault();
      this.$(e.currentTarget).parents('fieldset').remove();
    },

    addAnyCondition: function(e) {
      e.preventDefault();
      this.anyConditionsCounter += 1;
      var fieldset = this.renderTemplate('any_condition_fieldset', {id: this.anyConditionsCounter});
      this.$('#any_conditions').append(fieldset);
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

(function() {

  return {
	events: {
	  'app.activated':'init'
	},

	modal: {
				header:  'hello2',
				content: '',
				confirm: 'confirm',
				cancel:  'cancel',
				options: 'options',
	},

	messages: [{
			message: '<p>hello</p>',
			conditions: {
				all: [{
						"field": "assignee_id",
						"operator": "is",
						"field2": "current_user"
					},
					{
						"field": "status",
						"operator": "is_not",
						"value": "solved"
					}],
				any: [{
						"field": "status",
						"operator": "is_not",
						"value": "closed"
				}]
			},
		},{
			message: '<p>world</p>',
			conditions: {
				all: [{
						"field": "assignee_id",
						"operator": "is",
						"field2": "current_user"
					},
					{
						"field": "status",
						"operator": "is_not",
						"value": "solved"
					}],
				any: [{
						"field": "status",
						"operator": "is_not",
						"value": "closed"
				}]
			},
		}
	],

	

	

	init: function() {
		var that = this;
		this.require = require('context_loader')(this);
		var checkConditions = this.require('check_condition');
		this.messages = this.messages.filter(function(message) {
			return checkConditions(message.conditions);
		});
		this.messages.forEach(function(message) {
			that.modal.content += message.message;
		});
		this.require('popmodal')(this.modal, _.bind(this.hideApp, this), _.bind(this.hideApp, this));
	},

	hideApp: function() {
		this.hide();
	}
  };

}());

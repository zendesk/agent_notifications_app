(function() {

  return {
	events: {
	  'app.activated':'doSomething'
	},

	message: {
		header:  'hello',
		content: '<p>world</p>',
		confirm: 'confirm',
		cancel:  'cancel',
		options: 'options',
	},

	conditions {
		all: [{
				"field": "assignee_id",
				"operator": "is_not",
				"value": "current_user"
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

	doSomething: function() {
		this.require = require('context_loader')(this);
		this.require('popmodal')(this.message, _.bind(this.hideApp, this), _.bind(this.hideApp, this));
	},

	hideApp: function() {
		this.hide();
	}
  };

}());

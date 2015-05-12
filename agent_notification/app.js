(function() {

  return {
	events: {
	  'app.activated':'init',
	  'click .btn-modal':'init'
	},

	requests: {
		postTicket: function() {
			var data = {"ticket":{"custom_fields":[{"id":this.agent_dismissal_field,"value":this.ticket().customField(this.agent_dismissal_string)}]}};
            return {
                url: helpers.fmt("/api/v2/tickets/%@.json",this.ticket().id()),
                type: "PUT",
                contentType: 'application/json',
                data: JSON.stringify(data)
            };
		}

	},

	modal: {
				header:  'hello2',
				content: '',
				confirm: 'confirm',
				options: '<p><label><input type="checkbox" name="dismiss_messages" /><span id="foo">Don\'t show these messages again.</span></label></p>',
	},

	init: function() {
		var that = this;
		this.require = require('context_loader')(this);
		this.messages = JSON.parse(this.setting('messages'));
		this.agent_dismissal_field = this.requirement('agent_dismissal').requirement_id;
		this.agent_dismissal_string = 'custom_field_' + this.agent_dismissal_field;
		this.agent_dismissal = this.ticket().customField(this.agent_dismissal_string);
		this.agent_dismissal = this.agent_dismissal ? JSON.parse(this.agent_dismissal) : {}
		this.agent_dismissal = this.agent_dismissal || {};
		this.cleared_notifications = this.agent_dismissal[this.currentUser().id()] || [];
		var filteredMessages = this.filterMessages();
		this.draw(filteredMessages);
		this.require('popmodal')(this.modal, _.bind(this.dismissMessage, this));
	},

	draw: function(filteredMessages) {
		var that = this;
		if(filteredMessages.length > 0) {
			this.switchTo('main',{count: filteredMessages.length})
			this.modal.content = filteredMessages.map(function(message) {
				return message.message;
			}).reduce(function(prev, curr) {
				return prev.concat(curr);
			});
		} else {
			this.hide();
		}
	},

	filterMessages: function() {
		var that = this;
		var checkConditions = this.require('check_condition');
		return this.messages.filter(function(message) {
			return checkConditions(message.conditions) && !_.contains(that.cleared_notifications, message.id);
		});
	},

	dismissMessage: function(input) {
		var filteredMessages = this.filterMessages();
		var hiddenMessages = this.agent_dismissal[this.currentUser().id()] || [];
		var hideMessages = (input.length === 1) ? input[0].checked : false
		if(hideMessages) {
			message_ids = filteredMessages.forEach(function(message) {hiddenMessages.push(message.id)});
			this.agent_dismissal[this.currentUser().id()] = _.uniq(hiddenMessages);
			this.cleared_notifications = _.uniq(hiddenMessages);
		}
		this.draw(this.filterMessages());
		this.ajax('postTicket');
	}
  };
}());

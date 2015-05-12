(function() {

  return {
	events: {
		'app.activated':'init',
		'click .btn-modal':'popModal'
	},

	requests: {
		postTicket: function() {
			var data = {"ticket":{"custom_fields":[{"id":this.agent_dismissal_field,"value":JSON.stringify(this.agent_dismissal)}]}};
			console.log(data);
			console.log(JSON.stringify(data));
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
		options: '<p><input type="checkbox" id="dismiss_messages"/><label for="dismiss_messages">Mark messages as read.</label></p>',
	},

	init: function() {
		var that = this;
		this.require = require('context_loader')(this);
		this.messages = JSON.parse(this.setting('messages'));
		this.agent_dismissal_field = this.requirement('agent_dismissal').requirement_id;
		this.agent_dismissal_string = 'custom_field_' + this.agent_dismissal_field;
		this.ticketFields(this.agent_dismissal_string).hide();
		this.agent_dismissal = this.ticket().customField(this.agent_dismissal_string);
		this.agent_dismissal = this.agent_dismissal ? JSON.parse(this.agent_dismissal) : {};
		this.agent_dismissal = this.agent_dismissal || {};
		this.cleared_notifications = this.agent_dismissal[this.currentUser().id()] || [];
		this.draw();
		if(this.unreadMessages().length > 0)
		{
			this.popModal();
		}
	},

	popModal: function() {
		var ticketMessages = this.ticketMessages();
		if(ticketMessages.length > 0) {
			this.require('popmodal')(this.modal, _.bind(this.dismissMessage, this));
		}
	},

	draw: function() {
		var that = this;
		var filteredMessages = this.unreadMessages();
		var ticketMessages = this.ticketMessages();
		if(ticketMessages.length > 0) {
			this.switchTo('main',{unread: filteredMessages.length, count:ticketMessages.length});
			this.modal.content = ticketMessages.map(function(message) {
				return message.message;
			}).reduce(function(prev, curr) {
				return prev.concat(curr);
			});
		} else {
			this.hide();
		}
	},

	unreadMessages: function() {
		var that = this;
		var checkConditions = this.require('check_condition');
		return this.messages.filter(function(message) {
			return checkConditions(message.conditions) && !_.contains(that.cleared_notifications, message.id);
		});
	},

	ticketMessages: function() {
		var that = this;
		var checkConditions = this.require('check_condition');
		return this.messages.filter(function(message) {
			return checkConditions(message.conditions);
		});
	},

	dismissMessage: function(input) {
		var filteredMessages = this.unreadMessages();
		var hiddenMessages = this.agent_dismissal[this.currentUser().id()] || [];
		var hideMessages = (input.length === 1) ? input[0].checked : false;
		if(hideMessages) {
			filteredMessages.forEach(function(message) {hiddenMessages.push(message.id);});
			this.agent_dismissal[this.currentUser().id()] = _.uniq(hiddenMessages);
			this.cleared_notifications = _.uniq(hiddenMessages);
			this.ajax('postTicket');
		}
		this.draw(this.unreadMessages());
	}
  };
}());

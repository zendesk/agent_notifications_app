(function() {

	return {
		events: {
			'app.activated':'activated',
			'click .btn-modal':'popModal',
			'click #newNotification': 'newNotification',
			'click #cancelCreate': 'index',
			'change .chosen_dropdown': 'show_operation',
			'click #addAllCondition': 'addAllCondition',
			'click #addAnyCondition': 'addAnyCondition',
			'click .remove_condition': 'removeCondition',
			'click #subNotification': 'submitNotification',
			'click .list_action.edit': 'editNotification',
			'click #saveNotification': 'submitNotification'
		},

		allConditionsCounter: 0,
		anyConditionsCounter: 0,

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
			},

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
			},

			saveToAppSettings: function(payload, installID) {
				return {
					url: helpers.fmt('/api/v2/apps/installations/%@.json', installID),
					dataType: 'JSON',
					type: 'PUT',
					contentType: 'application/json',
					data: JSON.stringify(payload)
				};
			}
		},

		operators: [
		{
			html:"<select class='operator'><option value='is'>is</option><option value='is_not'>is not</option></select><input class='op_val' type='text' />",
			qualifiers:["requester_id","assignee_id","organization_id","user_id","ticket_id"]
		},
		{
			html:"<select class='operator'><option value='includes'>includes</option><option value='not_includes'>does not include</option></select><input class='op_val' type='text' />",
			qualifiers:["current_tags"]
		},
		{
			html:"<select class='operator'><option value='is'>is</option><option value='is_not'>is not</option></select><select class='op_val'><option>-</option><option value='question'>Question</option><option value='incident'>Incident</option><option value='problem'>Problem</option><option value='task'>Task</option></select>",
			qualifiers:["ticket_type"]
		},
		{
			html:"<select class='operator'><option value='is'>is</option><option value='is_not'>is not</option></select><select class='op_val'><option value='new'>New</option><option value='open'>Open</option><option value='pending'>Pending</option><option value='solved'>Solved</option><option value='closed'>Closed</option>",
			qualifiers:["status"]
		},
		{
			html:"<select class='operator'><option value='is'>is</option><option value='is_not'>is not</option></select><select class='op_val'><option>-</option><option value='low'>Low</option><option value='normal'>Normal</option><option value='high'>High</option><option value='urgent'>Urgent</option></select>",
			qualifiers:["priority"]
		}
		],

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
		},

		activated: function(e) {
			if(this.currentLocation() == "ticket_sidebar") {
				this.init();
			} else {
				this.index(e);
			}
		},

		index: function(e) {
			e.preventDefault();

			var setting = this.setting('messages');
			var setting_array = setting ? JSON.parse(setting) : [];

			var notifications = {
				active: setting_array,
				inactive: []
			};

			this.switchTo('index', notifications);
		},

		newNotification: function(e) {
			e.preventDefault();

			this.allConditionsCounter = 0;
			this.anyConditionsCounter = 0;

			this.switchTo('new_notification', null);
		},

		editNotification: function(e) {
			e.preventDefault();

			var id = this.$(e.currentTarget).data('id');
			var setting = this.setting('messages');
			var setting_array = setting ? JSON.parse(setting) : [];

			var notification = _.findWhere(setting_array, {id: id});

			this.switchTo('edit_notification', notification);
		},

		addAllCondition: function(e) {
			e.preventDefault();
			this.allConditionsCounter += 1;
			var fieldset = this.renderTemplate('condition_fieldset', {condition_prefix: 'all', id: this.allConditionsCounter});
			this.$('#all_conditions').append(fieldset);
		},

		removeCondition: function(e) {
			e.preventDefault();
			this.$(e.currentTarget).parents('fieldset').remove();
		},

		addAnyCondition: function(e) {
			e.preventDefault();
			this.anyConditionsCounter += 1;
			var fieldset = this.renderTemplate('condition_fieldset', {condition_prefix: 'any', id: this.anyConditionsCounter});
			this.$('#any_conditions').append(fieldset);
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
			var parent_id = this.$(target).parent().attr('id');
			var inserted = this.$(target).parent().children(".op_and_value").html(op_html);
			if (current_option == 'requester_id' || current_option == 'assignee_id' || current_option == 'user_id') {
				this.$(inserted).children("input.op_val").addClass('autocomplete_user');
				this.autocompleteRequesterName(parent_id);
			}
			if (current_option == 'organization_id') {
				this.$(inserted).children("input.op_val").addClass('autocomplete_org');
				this.autocompleteOrganizationName(parent_id);
			}
			this.$(inserted).trigger('opAndValueInserted');
		},

		submitNotification: function() {
			var self = this;
			var title = this.$("#notificationTitle").val();
			var message = this.$("#notificationContent").val();
			var all_conditions_html = this.$("div #all_conditions fieldset");
			var any_conditions_html = this.$("div #any_conditions fieldset");
			var conditions = {
				all: [],
				any: []
			};
			_.each(all_conditions_html, function(item){
				var value;
				var field = self.$(item).find('select.chosen_dropdown').val();
				var operator = self.$(item).find('div.op_and_value .operator').val();
				if(field == 'assignee_id' || field == 'requester_id' || field == 'organization_id') {
					value = self.$(item).find('div.op_and_value input.op_val').next('span').text();
					value = parseInt(value, 10);
				}
				else {
					value = self.$(item).find('div.op_and_value .op_val').val();
				}
				var condition_object = {
					"field": field,
					"operator": operator,
					"value": value
				};
				conditions.all.push(condition_object);
			});
			_.each(any_conditions_html, function(item){
				var value;
				var field = self.$(item).find('select.chosen_dropdown').val();
				var operator = self.$(item).find('div.op_and_value .operator').val();
				if(field == 'assignee_id' || field == 'requester_id' || field == 'organization_id') {
					value = self.$(item).find('div.op_and_value input.op_val').next('span').text();
					value = parseInt(value, 10);
				}
				else {
					value = self.$(item).find('div.op_and_value .op_val').val();
				}
				var condition_object = {
					"field": field,
					"operator": operator,
					"value": value
				};
				conditions.any.push(condition_object);
			});
			var notification = {};
			notification.id = Date.now();
			notification.title = title;
			notification.message = message;
			notification.conditions = conditions;
			this.saveToSettings(notification);
		},

		saveToSettings: function(notification) {
			var self = this;
			var installID = this.installationId();
			var setting = this.setting('messages');
			var setting_array = setting ? JSON.parse(setting) : [];
			setting_array.push(notification);
			var new_settings = JSON.stringify(setting_array);
			var payload = {
				"settings":{
					"messages": new_settings
				}
			};
			this.ajax(
				'saveToAppSettings',
				payload,
				installID
			).done(function(data) {
				services.notify('Successfully saved new notification!', 'notice');
				self.index();
			}).fail(function() {
				services.notify('Failed to save the notification. Please refresh your browser and try again.', 'error');
			});
		},

		autocompleteRequesterName: function(parent_id) {
			var self = this;
			var selector = helpers.fmt('#%@ .autocomplete_user', parent_id);
			this.$(selector).autocomplete({
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
					self.$(selector).val(ui.item.label);
				},
				focus: function(event, ui) {
					event.preventDefault();
					self.$(selector).val(ui.item.label);
				}
			}, this);
		},

		autocompleteOrganizationName: function(parent_id) {
			var self = this;
			var selector = helpers.fmt('#%@ .autocomplete_org', parent_id);
			this.$(selector).autocomplete({
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
					self.$(selector).val(ui.item.label);
				},
				focus: function(event, ui) {
					event.preventDefault();
					self.$(selector).val(ui.item.label);
				}
			}, this);
		}
	};
}());

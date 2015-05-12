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
			'click #saveNotification': 'submitNotification',
			'click .deactivate': 'deactivateNotification',
			'click .activate': 'activateNotification',
			'click .delete': 'deleteNotification',
		},

		allConditionsCounter: 0,
		anyConditionsCounter: 0,

		requests: {
			postTicket: function() {
				var data = {"ticket":{"custom_fields":[{"id":this.agent_dismissal_field,"value":JSON.stringify(this.agent_dismissal)}]}};
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
			},

			getAppSettings: function() {
				return {
					url: helpers.fmt('/api/v2/apps/installations/%@.json', this.installationId()),
				};
			}
		},

		operators: [
		{
			html:"<select class='operator'><option value='is'>is</option><option value='is_not'>is not</option></select><input class='op_val' type='text' />",
			qualifiers:["requester_id","assignee_id","organization_id","user_id","ticket_id"]
		},
		{
			html:"<select class='operator'><option value='includes'>includes one of</option><option value='includes_all'>includes all of</option><option value='not_includes'>includes none of</option></select><input class='op_val' type='text' />",
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
			header:  'Notification',
			content: '',
			confirm: 'confirm',
			options: '<p><label for="dismiss_messages">Mark messages as read: <input type="checkbox" id="dismiss_messages"/></label></p>',
		},

		init: function() {
			var that = this;
			this.require = require('context_loader')(this);
			this.messages = this.setting('messages') ? JSON.parse(this.setting('messages')) : [];
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
					var html_string = helpers.fmt('<p>%@</p>', message.message);
					return html_string;
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
			return this.ticketMessages().filter(function(message) {
				return !_.contains(that.cleared_notifications, message.id);
			});
		},

		ticketMessages: function() {
			var that = this;
			var checkConditions = this.require('check_condition');
			return this.messages.filter(function(message) {
				return checkConditions(message.conditions) && message.active;
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
			e.preventDefault();
			this.messages = this.setting('messages') ? JSON.parse(this.setting('messages')) : [];
			if(this.currentLocation() == "ticket_sidebar") {
				this.init();
			} else if(this.currentUser().role() == "admin") {
				var notifications = {
					active: this.messages.filter(function(setting) { return setting.active; }),
					inactive: this.messages.filter(function(setting) { return !setting.active; })
				};
				this.switchTo('index', notifications);
			} else {
				this.hide();
			}
		},

		index: function() {
			var that = this;
			this.ajax('getAppSettings').done(function(data) {
				that.messages = data.settings.messages ? JSON.parse(data.settings.messages) : [];
				var notifications = {
					active: that.messages.filter(function(setting) { return setting.active; }),
					inactive: that.messages.filter(function(setting) { return !setting.active; })
				};
				that.switchTo('index', notifications);
			});
		},

		deactivateNotification: function(e) {
			e.preventDefault();
			var that = this;
			var id = this.$(e.currentTarget).data('id');
			this.ajax('getAppSettings').done(function(data) {
				var setting_array = JSON.parse(data.settings.messages);
				var index = _.findIndex(setting_array, function(notification) {
					return notification.id == id;
				});
				var notification = setting_array[index];
				notification.active = false;
				that.saveToSettings(notification, data.settings.messages);
			});
		},

		activateNotification: function(e) {
			e.preventDefault();
			var that = this;
			var id = this.$(e.currentTarget).data('id');
			this.ajax('getAppSettings').done(function(data) {
				var setting_array = JSON.parse(data.settings.messages);
				var index = _.findIndex(setting_array, function(notification) {
					return notification.id == id;
				});
				var notification = setting_array[index];
				notification['active'] = true;
				that.saveToSettings(notification, data.settings.messages);
			});
		},

		deleteNotification: function(e) {
			e.preventDefault();
			var that = this;
			var id = this.$(e.currentTarget).data('id');
			this.ajax('getAppSettings').done(function(data) {
				var setting_array = JSON.parse(data.settings.messages);
				var index = _.findIndex(setting_array, function(notification) {
					return notification.id == id;
				});
				var notification = setting_array[index];
				that.deleteFromSettings(notification, data.settings.messages);
			});
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
			this.ajax('getAppSettings').done(function(data) {
				var setting_array = JSON.parse(data.settings.messages);
				var index = _.findIndex(setting_array, function(notification) {
					return notification.id == id;
				});
				var notification = setting_array[index];
				this.switchTo('edit_notification', notification);
			});
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

		submitNotification: function(e) {
			e.preventDefault();
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
				else if(field == 'current_tags') {
					var tags = self.$(item).find('div.op_and_value .op_val').val();
					value = tags.trim();
				}
				else if(field == '-') {
					return false;
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
				else if(field == 'current_tags') {
					var tags = self.$(item).find('div.op_and_value .op_val').val();
					value = tags.trim();
				}
				else if(field == '-') {
					return false;
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
			if(e.currentTarget.dataset.id) {
				notification.id = e.currentTarget.dataset.id;
			}
			else {
				notification.id = Date.now();
			}
			notification.title = title;
			notification.message = message;
			notification.conditions = conditions;
			notification.active = true;
			this.ajax('getAppSettings')
			.done(function(data){
				var setting = data.settings.messages;
				self.saveToSettings(notification, setting);
			})
			.fail(function(data){
				services.notify('There was an error retrieving the latest settings. Please refresh your browser and try again.','error');
			});
		},

		saveToSettings: function(notification, setting) {
			var self = this;
			var installID = this.installationId();
			var setting_array = setting ? JSON.parse(setting) : [];
			var match = _.findIndex(setting_array, function(item){
				return item.id == notification.id;
			});
			if(match > -1) {
				setting_array[match] = notification;
			} else {
				setting_array.push(notification);
			}
			var new_settings = JSON.stringify(setting_array);
			var payload = {
				"settings":{
					"messages": new_settings
				}
			};
			var valid_notification = this.validateNotification(notification);
			if(valid_notification === true) {
				this.ajax(
					'saveToAppSettings',
					payload,
					installID
				).done(function(data) {
					services.notify('Successfully saved notification!', 'notice');
					self.index();
				}).fail(function() {
					services.notify('Failed to save the notification. Please refresh your browser and try again.', 'error');
				});
			}
		},

		deleteFromSettings: function(notification, setting) {
			var self = this;
			var installID = this.installationId();
			var setting_array = setting ? JSON.parse(setting) : [];
			setting_array = _.reject(setting_array, function(item){
				return item.id == notification.id;
			});
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
					services.notify('Successfully deleted notification!', 'notice');
					self.index();
			}).fail(function() {
					services.notify('Failed to save the notification. Please refresh your browser and try again.', 'error');
			});
		},

		validateNotification: function(notification) {

			if (notification.conditions.any.length === 0 && notification.conditions.all.length === 0) {
				services.notify('There must be at least one condition in order to create a notification.', 'error');
				return false;
			}

			if (notification.message === "") {
				services.notify('There must be a message in order to create a notification.', 'error');
				return false;
			}

			if (notification.title === "") {
				services.notify('There must be a title in order to create a notification.', 'error');
				return false;
			}
			var conditions = notification.conditions;
			var all_conditions = conditions.any.concat(conditions.all);

			var null_val = _.filter(all_conditions, function(item){
				return item.value === "" || item.value === "-";
			});

			if (null_val.length > 0) {
				services.notify('A value cannot be blank.','error');
				return false;
			}

			var null_num = _.filter(all_conditions, function(item) {
				if(item.field === 'assignee_id' || item.field === 'requester_id' || item.field === 'organization_id') {
					return isNaN(item.value);
				}
			});

			if (null_num.length > 0) {
				services.notify('A user or organization value cannot be blank.','error');
				return false;
			}

			return true;

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

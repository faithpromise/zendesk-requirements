(function () {

    return {
        events: {
            'app.activated':               'on_app_activated',
            'click .js_edit_requirement':  'edit',
            'submit .js_save_requirement': 'save',
            'click .js_cancel_edit':       'cancel_edit'
        },

        requests: {

            get_requirements: function (ticket_ids) {
                return {
                    url:      'http://admin.faithpromise.192.168.10.10.xip.io/api/requirements',
                    data:     { zendesk_ticket_ids: ticket_ids },
                    dataType: 'json',
                    cors:     true
                };
            },

            get_ticket_requirements: function (ticket_id) {
                return {
                    url:      'http://admin.faithpromise.192.168.10.10.xip.io/api/tickets/' + ticket_id + '/requirements',
                    dataType: 'json',
                    cors:     true
                };
            },

            create: function (ticket_id, data) {
                return {
                    url:      'http://admin.faithpromise.192.168.10.10.xip.io/api/tickets/' + ticket_id + '/requirements',
                    type:     'POST',
                    dataType: 'json',
                    data:     data,
                    cors:     true
                };
            },

            update: function (ticket_id, requirement_id, data) {
                return {
                    url:      'http://admin.faithpromise.192.168.10.10.xip.io/api/tickets/' + ticket_id + '/requirements/' + requirement_id,
                    type:     'PATCH',
                    dataType: 'json',
                    data:     data,
                    cors:     true
                };
            },

            delete: function (ticket_id, requirement_id) {
                return {
                    url:  'http://admin.faithpromise.192.168.10.10.xip.io/api/tickets/' + ticket_id + '/requirements/' + requirement_id,
                    type: 'DELETE',
                    cors: true
                };
            }

        },

        on_app_activated: function (event) {

            if (event.firstLoad) {
                this.load_ticket_sidebar();
            }

        },

        load_ticket_sidebar: function () {

            if (this.currentLocation() !== 'ticket_sidebar')
                return;

            var ticket_id = this.ticket().id();

            this.ajax('get_ticket_requirements', ticket_id).done(function (data) {

                data.no_results = data.requirements.length === 0;

                this.switchTo('ticket_requirements', data);
            });

        },

        delete: function (event) {

            var is_sidebar     = this.currentLocation() === 'ticket_sidebar',
                //is_calendar    = this.currentLocation() === 'nav_bar',
                requirement_id = this.$(event.target).data('requirement-id'),
                ticket_id      = is_sidebar ? this.ticket().id() : this.$(event.target).data('ticket-id');

            this.ajax('delete_requirement', ticket_id, requirement_id).done(function () {

                if (is_sidebar) {
                    this.load_ticket_sidebar();
                }

                //if (is_calendar) {
                //    this.load_calendar();
                //}

            });

        },

        edit: function (event) {

            var $target        = this.$(event.target),
                requirement_id = $target.data('requirement-id'),
                $description   = this.$('#fp_requirement_description_' + requirement_id),
                $textarea      = this.$('#fp_requirement_body_' + requirement_id),
                $form          = this.$('#fp_requirement_form_' + requirement_id);

            $form.removeClass('is-hidden');
            console.log($textarea);
            $textarea.css('height', Math.max(70, $description.outerHeight() + 20) + 'px').focus();
            console.log('$description.outerHeight()', $description.outerHeight());
            $description.addClass('is-hidden');

        },

        cancel_edit: function (event) {

            var $target        = this.$(event.target),
                requirement_id = $target.data('requirement-id'),
                $description   = this.$('#fp_requirement_description_' + requirement_id),
                $body          = this.$('#fp_requirement_body_' + requirement_id),
                $form          = this.$('#fp_requirement_form_' + requirement_id);

            if ($body.val() !== $body.prop('defaultValue')) {

                if (confirm('Are you sure you want to cancel? Your changes will be lost.')) {
                    $body.val($body.prop('defaultValue'));
                } else {
                    return;
                }
            }

            $form.addClass('is-hidden');
            $description.removeClass('is-hidden');

        },

        show_form: function () {

            var ticket_id      = this.ticket().id(),
                title_selector = '#fp_requirement_title_' + ticket_id,
                data           = {
                    ticket_id: this.ticket().id()
                };

            this.switchTo('requirement_form', data);
            this.$(title_selector).focus();

        },

        save: function (event) {

            var self           = this,
                $target        = this.$(event.target),
                ticket_id      = this.ticket().id(),
                requirement_id = $target.data('requirement-id'),
                $title         = this.$($target.find('[name=title]')),
                $body          = this.$($target.find('[name=body]')),
                $sort          = this.$($target.find('[name=sort]')),
                data           = {
                    title:            $title.val(),
                    body:             $body.val(),
                    sort:             $sort.length ? $sort.val() : 99,
                    created_by_email: this.currentUser().email()
                };

            event.preventDefault();

            if (requirement_id) {

                self.ajax('update', ticket_id, requirement_id, data).done(function () {

                    services.notify('Requirement updated', 'notice');
                    self.load_ticket_sidebar();

                });

            } else {

                self.ajax('create', ticket_id, data).done(function () {

                    services.notify('New requirement added', 'notice');
                    self.show_form();

                });

            }

        },

        cancel_form: function () {
            this.load_ticket_sidebar();
        }

    };

}());

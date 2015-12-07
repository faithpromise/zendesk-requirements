(function () {

    var api_url, $head;

    /*
     Zendesk says don't access window, but I can't think of
     another way to conditionally set environment (is_dev)
     than accessing the window object.
     */
    (function () {

        var window = this,
            is_dev = /zat=true/.test(window.location.href),
            style  = window.document.createElement('style'),
            app_id = is_dev ? '0' : '76309';

        api_url = is_dev ? 'http://admin.faithpromise.192.168.10.10.xip.io' : 'http://admin.faithpromise.org';

        style.appendChild(window.document.createTextNode(''));
        window.document.head.appendChild(style);

        style.sheet.insertRule('.app-' + app_id + '.apps_ticket_sidebar { background-color: transparent !important; padding-left: 10px !important; padding-right: 10px !important; clear: both; width: 330px !important; border: none !important; }', 0);
        style.sheet.insertRule('.app-' + app_id + '.apps_nav_bar { margin-top: 0 !important; padding: 0 !important; }', 0);

    })();

    return {
        events: {
            'app.activated':              'on_app_activated',
            'click .js_new':              'new',
            'click .js_cancel_new':       'cancel_new',
            'click .js_edit':             'edit',
            'click .js_edit_body_inline': 'edit_body_inline',
            'submit .js_save':            'save',
            'click .js_cancel_edit':      'cancel_edit',
            'click .js_delete':           'delete'
        },

        requests: {

            requirements: function (ticket_ids) {
                return {
                    url:      api_url + '/api/ticket-requirements',
                    data:     { zendesk_ticket_ids: ticket_ids },
                    dataType: 'json',
                    cors:     true
                };
            },

            requirement: function (requirement_id) {
                return {
                    url:      api_url + '/api/ticket-requirements/' + requirement_id,
                    dataType: 'json',
                    cors:     true
                };
            },

            create: function (data) {
                return {
                    url:      api_url + '/api/ticket-requirements',
                    type:     'POST',
                    dataType: 'json',
                    data:     data,
                    cors:     true
                };
            },

            update: function (data, requirement_id) {
                return {
                    url:      api_url + '/api/ticket-requirements/' + requirement_id,
                    type:     'PATCH',
                    dataType: 'json',
                    data:     data,
                    cors:     true
                };
            },

            delete: function (requirement_id) {
                return {
                    url:  api_url + '/api/ticket-requirements/' + requirement_id,
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

            this.ajax('requirements', ticket_id).done(function (result) {

                var view_data = {
                    no_results:   result.data.length === 0,
                    requirements: result.data
                };

                this.switchTo('ticket_requirements', view_data);
            });

        },

        new: function () {

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
                $target        = this.$(event.currentTarget),
                requirement_id = $target.data('requirement-id'),
                $title         = this.$($target.find('[name=title]')),
                $body          = this.$($target.find('[name=body]')),
                $sort          = this.$($target.find('[name=sort]')),
                mode           = requirement_id ? 'update' : 'create',
                data           = {
                    zendesk_ticket_id: this.ticket().id(),
                    title:             $title.val(),
                    body:              $body.val(),
                    sort:              $sort.length ? $sort.val() : 99,
                    created_by_email:  this.currentUser().email()
                };

            event.preventDefault();

            self.ajax(mode, data, requirement_id).done(function () {

                if (mode === 'create') {
                    services.notify('Requirement updated', 'notice');
                }
                self.load_ticket_sidebar();

            });

        },

        cancel_new: function () {
            this.load_ticket_sidebar();
        },

        edit: function (event) {

            var requirement_id = this.$(event.currentTarget).data('requirement-id');

            this.ajax('requirement', requirement_id).done(function (result) {
                this.switchTo('requirement_form', result.data);
            });

        },

        edit_body_inline: function (event) {

            console.log(event);

            var $target        = this.$(event.currentTarget),
                requirement_id = $target.data('requirement-id'),
                $description   = this.$('#fp_requirement_description_' + requirement_id),
                $textarea      = this.$('#fp_requirement_body_' + requirement_id),
                $form          = this.$('#fp_requirement_form_' + requirement_id);

            $form.removeClass('is-hidden');
            $textarea.css('height', Math.max(70, $description.outerHeight() + 20) + 'px').focus();
            $description.addClass('is-hidden');

        },

        cancel_edit: function (event) {

            var $target        = this.$(event.currentTarget),
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

        delete: function (event) {

            var $target           = this.$(event.currentTarget),
                requirement_id    = $target.data('requirement-id'),
                requirement_title = $target.data('requirement-title');

            if (!confirm('Are you sure you want to delete the requirement,\n"' + requirement_title + '"')) {
                return;
            }

            this.ajax('delete', requirement_id).done(function () {
                this.load_ticket_sidebar();
            });

        }

    };

}());

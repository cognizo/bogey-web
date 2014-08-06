var _ = require('underscore');
var $ = require('jquery');
var async = require('async');
var nprogress = require('nprogress');

Visualizations = function (config) {
    this.$home = $('#home');
    this.config = config;
};

/**
 * Load all visualizations.
 * @param  {Function} callback
 * @public
 */
Visualizations.prototype.load = function (name, callback) {
    var self = this;

    if (_.isFunction(name)) {
        callback = name;
        name = null;
    };

    async.map(this.config.visualizations, function (vis, callback) {
        if (vis.bogey) {
            return callback(null, {
                name: vis.bogey.name,
                module: vis
            });
        }

        $.getScript(vis.src, function () {
            var visModule = require(vis.module);

            callback(null, {
                name: visModule.bogey.name,
                module: visModule
            });
        });
    }, function (err, results) {
        if (name) {
            return callback(_.findWhere(results, { name: name }));
        }

        callback(results);
    });
}

/**
 * Show a visualization.
 * @param  {string} moduleName
 * @param  {object} controller
 * @public
 */
Visualizations.prototype.show = function (name, controller, params) {
    var self = this;

    if (this.config.demo) {
        params.demo = true;
    }

    async.waterfall([
        function (callback) {
            nprogress.start();

            $('#bogey-home').addClass('hidden');

            self.close(true, callback);
        },

        function (callback) {
            var iframeSrc = '#/visualization?name=' + name;

            if (params) {
                iframeSrc += '&' + $.param(params);
            }

            self.$iframe = $('<iframe class="bogey-iframe hidden" />')
                .appendTo('body');

            $('iframe').get(0).contentWindow.location.href = iframeSrc;

            self.$iframe.on('load', function () {
                window.setTimeout(function () {
                    var contentWindow = self.$iframe.get(0).contentWindow;

                    contentWindow.Bogey.on('close', function () {
                        self.close();
                        controller.transitionToRoute('home', 'home');
                    });

                    contentWindow.Bogey.on('resize', function () {
                        self.$home.addClass('hidden');
                        self.show(moduleName, controller, true);
                    });

                    // For key events.
                    $(contentWindow).focus();
                }, 0); // Next tick for Firefox.

                // Give the visualization a little time to start up.
                window.setTimeout(function () {
                    self.$iframe.removeClass('hidden');
                    nprogress.done();
                }, 200);
            });


            callback();
        }
    ], function () {
        self.$home.addClass('hidden');
    });
};

/**
 * Close the active visualization.
 * @param  {Function} callback
 * @public
 */
Visualizations.prototype.close = function (hideHome, callback) {
    var self = this;

    if (_.isFunction(hideHome)) {
        callBack = hideHome;
        hideHome = false;
    }

    if (hideHome) {
        $('#bogey-home').addClass('hidden');
    } else {
        $('#bogey-home').removeClass('hidden');
    }

    if (this.$iframe) {
        var contentWindow = this.$iframe.get(0).contentWindow;

        if (contentWindow && contentWindow.Bogey) {
            contentWindow.Bogey.closeWebSocket();
        }

        if (this.$iframe.hasClass('hidden') && _.isFunction(callback)) {
            this.$iframe.remove();
            this.$iframe = null;
            return callback();
        }

        this.$iframe
            .on('transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd', function () {
                if (self.$iframe) {
                    self.$iframe.remove();
                    self.$iframe = null;
                }

                if (_.isFunction(callback)) {
                    callback();
                }
            })
            .addClass('hidden');
    } else {
        if (_.isFunction(callback)) {
            callback();
        }
    }
};

module.exports = Visualizations;

var $ = require('jquery');
var Ember = require('ember');

module.exports = Ember.ObjectController.extend({
    actions: {
        show: function (moduleName, src) {
            var self = this;

            $('#bogey-home').addClass('hidden');

            window.setTimeout(function () {
                self.transitionToRoute('home', encodeURIComponent(moduleName));
            }, 400);
        }
    }
});

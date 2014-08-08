var Ember = require('../lib/vendor/ember');

module.exports = Ember.Route.extend({
    model: function (params) {
        var self = this;

        return new Ember.RSVP.Promise(function (resolve) {
            self.get('visualizations').load(function (results) {
                resolve({
                    module: decodeURIComponent(params.module),
                    visualizations: results,
                    params: params.queryParams
                });
            });
        });
    }
});

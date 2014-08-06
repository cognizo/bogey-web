var Ember = require('ember');

module.exports = Ember.Route.extend({
    model: function (params) {
        var self = this;

        return new Ember.RSVP.Promise(function (resolve) {
            self.get('visualizations').load(params.queryParams.name, function (vis) {
                resolve({
                    visualization: vis.module,
                    params: params.queryParams
                });
            });
        });
    }
});

var Ember = require('../lib/vendor/ember');

module.exports = Ember.Route.extend({
    redirect: function () {
        this.transitionTo('home', 'home');
    }
});

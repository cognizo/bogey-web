var fs = require('fs');
var Ember = require('../lib/vendor/ember');

module.exports = Ember.View.extend({
    template: Ember.Handlebars.compile(fs.readFileSync(__dirname + '/../templates/home.hbs', 'utf8')),

    didInsertElement: function () {
        var moduleName = this.get('context').get('module');
        var params = this.get('context').get('params');

        if (moduleName !== 'home') {
            this.get('visualizations').show(moduleName, this.controller, params);
            return;
        }

        this.get('visualizations').close();
    }
});

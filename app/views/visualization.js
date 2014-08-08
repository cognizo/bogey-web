var fs = require('fs');
var $ = require('jquery');
var Ember = require('../lib/vendor/ember');
var Bogey = require('../lib/bogey');

module.exports = Ember.View.extend({
    template: Ember.Handlebars.compile(fs.readFileSync(__dirname + '/../templates/visualization.hbs', 'utf8')),

    didInsertElement: function () {
        var vis = this.get('context').get('visualization');
        var container = $('div.bogey-visualization-container').get(0);

        var bogey = new Bogey(container, vis.name, 8008, this.get('context').get('params'));

        vis.bogey.run(bogey);

        window.Bogey = bogey;

        parent.postMessage('bogey loaded', '*');
    }
});

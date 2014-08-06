var _ = require('underscore');
var $ = require('jquery');
var async = require('async');
var Ember = require('ember');
var Visualizations = require('./lib/visualizations');
var Bogey = require('./lib/bogey');

module.exports = function (config) {
    var App = Ember.Application.create({
        rootElement: config.container
    });

    var visualizations = new Visualizations(config);

    App.register('visualizations:main', visualizations, { instantiate: false });
    App.inject('route', 'visualizations', 'visualizations:main');
    App.inject('controller', 'visualizations', 'visualizations:main');
    App.inject('view', 'visualizations', 'visualizations:main');

    App.Router.map(function () {
        this.resource('home', { path: '/:module' });
        this.resource('visualization', { path: '/visualization' });
    });

    // Routes
    App.IndexRoute = require('./routes/index');
    App.HomeRoute = require('./routes/home')
    App.VisualizationRoute = require('./routes/visualization');

    // Controllers
    App.HomeController = require('./controllers/home');

    // Views
    App.HomeView = require('./views/home');
    App.VisualizationView = require('./views/visualization');

    return App;
};

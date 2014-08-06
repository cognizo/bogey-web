var path = require('path');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var _ = require('underscore');
var $ = require('jquery');
var mousetrap = require('mousetrap');
var raf = require('raf');
var io = require('socket.io-client');
var Demo = require('./demo');

/**
 * @class
 * @param {object} container
 * @param {string} visualization
 * @param {number} webSocketPort
 * @param {boolean} demoMode
 */
var Bogey = function (container, visualization, webSocketPort, params) {
    this.container = container;
    this.visualization = visualization;
    this.paused = false;
    this.fps = 0;
    this.rpms = 0;
    this.params = params;

    this.focused = true;
    this._webSocketPort = webSocketPort;
    this._demoOnly = false;
    this._demoMode = false;

    if (params.demo) {
        this._demoOnly = true;
        this._demoMode = true;
    }

    this._requestsSinceLastTime = 0;
    this.registeredKeys = [];

    this._start();
};
util.inherits(Bogey, EventEmitter);

/**
 * Get the current time.
 * @return {number}
 * @public
 */
Bogey.prototype.now = function () {
    return (new Date()).getTime();
};

/**
 * Close the WebSocket.
 * @public
 */
Bogey.prototype.closeWebSocket = function () {
    if (this._socket) {
        this._socket.disconnect();
    }
};

/**
 * Flash a message on the screen.
 * @param {string} message  The message to display.
 * @param {number} duration Duration in milliseconds to leave the message on screen.
 * @param {string} color    CSS hex color string of the message.
 * @param {string} font     CSS font-family string to use for the message.
 * @public
 */
Bogey.prototype.flashMessage = function (message, duration, color, font) {
    if (!this._canAcceptRequest()) {
        return;
    }

    $('div.bogey-message').addClass('hidden');

    var $message = $('<div class="bogey-message" />').html(message);

    if (color) {
        $message.css('color', color);
    } else if (this.messageColor) {
        $message.css('color', this.messageColor);
    }

    if (font) {
        $message.css('font', font);
    } else if (this.messageFont) {
        $message.css('font', this.messageFont);
    }

    $('body').append($message);

    window.setTimeout(function () {
        $message.addClass('hidden');

        window.setTimeout(function () {
            $message.remove();
        }, 1000);
    }, duration || 400);

    this._messageShown = true;
};

/**
 * Set the message color for all future messages.
 * @param {string} color CSS hex color string.
 * @public
 */
Bogey.prototype.setMessageColor = function (color) {
    this.messageColor = color;

    $('div.bogey-message').css('color', color);
};

/**
 * Set the message font for all future messages.
 * @param {string} font Font string for use in the CSS font-family attribute.
 */
Bogey.prototype.setMessageFont = function (font) {
    this.messageFont = font;

    $('div.bogey-message').css('font', font);
};

/**
 * Register a key for use in the visualization.
 * @param {string} key      The key to register.
 * @param {string} helpText Help text to display in Bogey's help screen.
 */
Bogey.prototype.registerKey = function (key, helpText, handler, context) {
    var self = this;

    mousetrap.bind(key, function () {
        if (!self._canAcceptRequest() && !(context instanceof Bogey)) {
            return;
        }

        handler.call(context);
    });

    if (_.isArray(key)) {
        key = key.join(' / ');
    }

    this.registeredKeys.push({
        key: key,
        helpText: helpText
    });
};

/**
 * Start Bogey.
 * @private
 */
Bogey.prototype._start = function () {
    var self = this;
    var startTime;
    var lastFrameTime;
    var requestsLastTime;
    var frames = 0;

    this._keyboard();

    $(window).on('blur', function () {
        self.focused = false;
    });

    $(window).on('focus', function () {
        self.focused = true;
    });

    $(window).on('resize', function () {
        self.emit('resize');
    });

    if (this._demoMode) {
        this._startDemoMode();
    } else {
        this._listen();
    }

    window.setTimeout(function () {
        if (!$('div.bogey-message').length && !self._messageShown) {
            self.flashMessage('Press H for help', 3000);
        }
    }, 3000);

    raf(function frame () {
        if (!startTime) {
            startTime = self.now();
            lastFrameTime = startTime;
            requestsLastTime = startTime;
        }

        var time = self.now(),
            delta = time - lastFrameTime;

        if (!self.paused) {
            frames++;

            if (frames % 10 === 0) {
                self.fps = Math.round(1000 / (delta ? delta : 1));
                self.rpms = Math.ceil(self._requestsSinceLastTime / (time - requestsLastTime) * 1000 * 60);
                self._requestsSinceLastTime = 0;
                requestsLastTime = time;
            }

            self.emit('frame', { count: frames, time: (time - startTime) / 1000, delta: delta / 1000 });
        }

        lastFrameTime = time;

        raf(frame);
    });
};

/**
 * Listen to the websocket.
 * @public
 */
Bogey.prototype._listen = function () {
    var self = this;

    if (this._demo) {
        this._demo.removeListener('req', this._listener);
    }

    if (!this._socket) {
        this._socket = io.connect(
            window.location.protocol + '//' + window.location.hostname + ':' + this._webSocketPort
        );
    }

    this._socket.once('connect_error', function (err) {
        self.flashMessage('Unable to connect to WebSocket', 3000);
    });

    this._listener = this._request();

    this._socket.on('req', this._listener);
};

/**
 * Start demo mode.
 * @private
 */
Bogey.prototype._startDemoMode = function () {
    if (this._socket) {
        this._socket.removeListener('req', this._listener);
    }

    this._demo = new Demo();

    this._listener = this._request();

    this._demo.on('req', this._listener);
};

/**
 * Return a request handler.
 * @return {function}
 */
Bogey.prototype._request = function () {
    var self = this;

    return function (data) {
        if (!self.paused && !self.helpOpen && self.focused) {
            self.emit('request', data);
        }

        self._requestsSinceLastTime++;
    };
};

/**
 * Can a request be accepted?
 */
Bogey.prototype._canAcceptRequest = function () {
    return (!this.paused && !this.helpOpen && this.focused);
}

/**
 * Set up keyboard shortcuts.
 * @private
 */
Bogey.prototype._keyboard = function () {
    var self = this;

    this.registerKey('space', 'Pause', function () {
        if (!this.helpOpen) {
            this.emit(self.paused ? 'play' : 'pause');
            this.paused = !self.paused;

            this.pausedBeforeHelpOpened = false;
        }
    }, this);

    if (!this._demoOnly) {
        this.registerKey('d', 'Toggle demo mode', function () {
            if (!this._canAcceptRequest())  {
                return;
            }

            this._demoMode = !this._demoMode;

            if (this._demoMode) {
                this._startDemoMode();
                this.flashMessage('Demo mode enabled');
            } else {
                this._listen();
                this.flashMessage('Demo mode disabled');
            }
        }, this);
    }

    this.registerKey('+', 'Speed up', function () {
        if (!this._canAcceptRequest())  {
            return;
        }

        this.emit('speedUp');
    }, this);

    this.registerKey('-', 'Slow down', function () {
        if (!this._canAcceptRequest())  {
            return;
        }

        this.emit('slowDown');
    }, this);

    this.registerKey([ 'escape', 'q', ], 'Return to menu', function () {
        if (this.helpOpen) {
            this._hideHelp();
            return;
        }

        this.emit('close');
    }, this);

    this.registerKey('h', 'Show help', function () {
        if (this.helpOpen) {
            this._hideHelp();
            return;
        }

        this._showHelp();
    }, this);
};

/**
 * Show the help screen.
 * @private
 */
Bogey.prototype._showHelp = function () {
    $('div.bogey-message').addClass('hidden');

    if (this.paused) {
        this.pausedBeforeHelpOpened = true;
    }

    this.emit('pause');

    var $help = $('div.bogey-help');
    var $keys = $help.find('ul');
    $keys.html('');

    this.registeredKeys.forEach(function (key) {
        $keys.append('<li><code>' + key.key.toUpperCase() + '</code> ' + key.helpText);
    });

    $help.removeClass('hidden');

    this.helpOpen = true;
};

/**
 * Hide the help screen.
 * @private
 */
Bogey.prototype._hideHelp = function () {
    if (!this.pausedBeforeHelpOpened) {
        this.emit('play');
    }

    $('div.bogey-help').addClass('hidden');

    this.helpOpen = false;
    this.pausedBeforeHelpOpened = false;
};

module.exports = Bogey;

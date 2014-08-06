var util = require('util');
var EventEmitter = require('events').EventEmitter;
var _ = require('underscore');
var faker = require('faker');

Demo = function () {
    this._ips = this._generateIps(50);
    this._lorem = faker.Lorem.words(50);

    this._start();
};
util.inherits(Demo, EventEmitter);

Demo.uriSuffixes = [
    '',
    '/',
    '.html',
    '.php',
    '.asp',
    '.js',
    '.png',
    '.gif',
    '.jpeg',
    '.jpg',
    '.css'
];

Demo.prototype._generateIps = function (num) {
    var ips = [];

    for (var i = 0; i < num; i++) {
        ips.push(faker.Internet.ip());
    }

    return ips;
};

Demo.prototype._normal = function () {
    var sum = 0;
    for (var i = 0; i < 12; i++) {
        sum = sum + Math.random();
    }
    return sum - 6;
}

Demo.prototype._ip = function () {
    return faker.random.array_element(this._ips);
};

Demo.prototype._statusCode = function () {
    var prob = Math.abs(this._normal());
    if (prob <= 1.75) {
        return 200;
    } else if (prob > 1.75 && prob < 2.5) {
        return 400;
    } else {
        return 500;
    }
};

Demo.prototype._uri = function () {
    var result = '/';
    var length = _.random(1, 3);

    for (var i = 0; i < length; i++) {
        result += faker.random.bs_noun().replace(/ /g, '-');

        if (i < length - 1) {
            result += '/';
        }
    }

    result += _.sample(Demo.uriSuffixes);

    return result;
};

Demo.prototype._start = function () {
    var self = this;
    var time = 0;
    var amplitude = 15;
    var period = 30;

    var timer = setInterval(function () {
        time++;
    }, 1000);

    var rate = function () {
        var rps = amplitude / 2 * Math.sin(Math.PI * time / (period / 2)) + amplitude / 2;

        // Add some noise.
        rps += 0.07 * rps * Math.random() + -0.07 * rps * Math.random();

        if (rps <= 1) {
            rps = 1;
        }

        return 1000 / Math.ceil(rps);
    };

    var loop = function() {
        self.emit('req', {
            parsed: {
                'ip': [ self._ip() ],
                'uri': [ self._uri() ],
                'statusCode': [ self._statusCode().toString() ]
            }
        });

        setTimeout(loop, rate());
    };

    loop();
};

module.exports = Demo;

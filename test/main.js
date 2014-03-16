var test = require('tape');
var ChannelCycler = require('../channel-cycler');

test('canvasFromSrc', function(t) {
  t.plan(4);
  var canvas = ChannelCycler.prototype.canvasFromSrc('//placehold.it/64.png', 'some-class', function(img) {
    t.equal(canvas.width, 64, 'Canvas is the right width');
    t.equal(canvas.height, 64, 'Canvas is the right height');
    t.equal(canvas.className, 'some-class', 'Canvas got the right class name');
  });
  t.equal(canvas.nodeName, 'CANVAS', 'Returns a canvas');
});

test('getHue', function(t) {
  t.plan(3);
  t.equal(ChannelCycler.prototype.getHue(0, 3, 0), 0, '0deg for the first of three');
  t.equal(ChannelCycler.prototype.getHue(1, 3, 0), 120, '120deg for the second of three');
  t.equal(ChannelCycler.prototype.getHue(0, 3, 45), 45, 'Starting angle is taken into account');
});

test('getLuma', function(t) {
  t.plan(3);
  t.equal(ChannelCycler.prototype.getLuma('#f00'), 0.2126 * 0xFF, 'Works for red');
  t.equal(ChannelCycler.prototype.getLuma('#0f0'), 0.7152 * 0xFF, 'Works for green');
  t.equal(ChannelCycler.prototype.getLuma('#00f'), 0.0722 * 0xFF, 'Works for blue');
});

test('screenBlend', function(t) {
  t.plan(2);
  t.equal(ChannelCycler.prototype.screenBlend(255, 0), 255, 'White replaces black');
  t.equal(ChannelCycler.prototype.screenBlend(0, 255), 255, 'Black does nothing to white');
});

test('multiplyBlend', function(t) {
  t.plan(2);
  t.equal(ChannelCycler.prototype.multiplyBlend(255, 0), 0, 'Black replaces white');
  t.equal(ChannelCycler.prototype.multiplyBlend(0, 255), 1, 'White does nothing to black');
});

// TODO: Find out when it's safe to exit.
setTimeout(close, 1000);

// TODO: This whole thing is sloppy.

;(function() {
  'use strict';

  function ChannelCycler(sources) {
    this.sources = sources.map(this.canvasFromSrc, this);
    this.channels = sources.map(this.canvasFromSrc, this);

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'channel-cycler';

    this._cycle = this._cycle.bind(this);
  }

  ChannelCycler.prototype.sources = null;
  ChannelCycler.prototype.channels = null;
  ChannelCycler.prototype.canvas = null;

  ChannelCycler.prototype.hueRotate = 0;
  ChannelCycler.prototype.fps = 24;
  ChannelCycler.prototype.period = 400;

  ChannelCycler.prototype._loading = 0;
  ChannelCycler.prototype._cycleTimeout = NaN;

  ChannelCycler.prototype.canvasFromSrc = function(src) {
    var canvas = document.createElement('canvas');
    canvas.className = 'channel-cycler-channel';
    var ctx = canvas.getContext('2d');

    this._loading += 1;

    var img = new Image();
    img.onload = function() {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      this._loading -= 1;
      if (this._loading === 0) {
        this.onLoad();
      }
    }.bind(this);

    img.src = src;
    return canvas;
  };

  ChannelCycler.prototype.onLoad = function() {
    this.render();
  };

  ChannelCycler.prototype.start = function() {
    this._cycle();
  };

  ChannelCycler.prototype._cycle = function() {
    this.hueRotate += 360 / (this.fps * (this.period / 1000));
    this.hueRotate %= 360;
    this.render();
    this._cycleTimeout = setTimeout(this._cycle, 1000 / this.fps);
  };

  ChannelCycler.prototype.render = function() {
    this.sources.forEach(function(source, i, sources) {
      var color = this.getChannelColor(i, sources.length);
      this.colorizeChannel(source, this.channels[i], color);
    }, this);

    this.mergeChannels(this.channels, this.canvas);
  };

  ChannelCycler.prototype.getChannelColor = function(i, channels) {
    var progress = i / channels;
    var hue = 360 * progress;
    var rotatedHue = (hue + this.hueRotate) % 360;
    return 'hsl(' + rotatedHue + ', 100%, 50%)';
  };

  ChannelCycler.prototype.colorizeChannel = function(source, channel, color) {
    channel.width = source.width;
    channel.height = source.height;

    var ctx = channel.getContext('2d');
    ctx.drawImage(source, 0, 0);
    ctx.globalCompositeOperation = 'screen';

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, channel.width, channel.height);
  };

  ChannelCycler.prototype.mergeChannels = function(channels, output) {
    output.width = 0;
    output.height = 0;
    channels.forEach(function(channel) {
      output.width = Math.max(output.width, channel.width);
      output.height = Math.max(output.height, channel.height);
    });

    var context = output.getContext('2d');
    channels.forEach(function(channel) {
      context.globalCompositeOperation = 'multiply';
      context.drawImage(channel, 0, 0);
    });
  };

  ChannelCycler.prototype.stop = function() {
    clearTimeout(this._cycleTimeout);
  };

  ChannelCycler.prototype.destroy = function() {
    this.stop();
    this.canvas.parentNode.removeChild(this.canvas);
  };

  window.ChannelCycler = ChannelCycler;
  if (typeof module !== 'undefined') {
    module.exports = ChannelCycler;
  }
}());

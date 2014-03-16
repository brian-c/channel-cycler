;(function() {
  'use strict';

  var FORCE_MANUAL_BLENDING = !!~location.search.indexOf('blending=0');

  var HAS_BLENDING = !FORCE_MANUAL_BLENDING && (function() {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    ctx.globalCompositeOperation = 'multiply';
    return ctx.globalCompositeOperation === 'multiply';
  }());

  function ChannelCycler(sources) {
    this._waitingFor = [];
    this._cycle = this._cycle.bind(this);

    this.sources = [];
    this.channels = [];

    for (var i = 0; i < sources.length; i++) {
      var source = this.canvasFromSrc(sources[i], 'channel-cycler-source', this._onLoadSrc, this);
      var channel = this.canvasFromSrc(sources[i], 'channel-cycler-channel', this._onLoadSrc, this);
      this.sources.push(source);
      this.channels.push(channel);
      this._waitingFor.push(source, channel);
    }

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'channel-cycler';
  }

  ChannelCycler.prototype.sources = null;
  ChannelCycler.prototype.channels = null;
  ChannelCycler.prototype.canvas = null;

  ChannelCycler.prototype.compensateForLuma = false;
  ChannelCycler.prototype.hueRotate = 0;
  ChannelCycler.prototype.fps = 24;
  ChannelCycler.prototype.period = 400;

  ChannelCycler.prototype._waitingFor = null;
  ChannelCycler.prototype._cycleTimeout = NaN;

  ChannelCycler.prototype.canvasFromSrc = function(src, className, callback, context) {
    var canvas = document.createElement('canvas');
    canvas.className = className;
    var ctx = canvas.getContext('2d');

    var img = new Image();
    img.onload = function() {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      callback.call(context, canvas);
    };

    img.src = src;
    return canvas;
  };

  ChannelCycler.prototype._onLoadSrc = function(canvas) {
    this._waitingFor.splice(this._waitingFor.indexOf(canvas), 1);

    if (this._waitingFor.length === 0) {
      this._onLoad();
    }
  };

  ChannelCycler.prototype._onLoad = function() {
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
    for (var i = 0; i < this.sources.length; i++) {
      var hue = this.getHue(i, this.sources.length, this.hueRotate);
      var saturation = '100%';
      var lightness = '50%';

      var color = this.getColor(hue, saturation, lightness);

      if (this.compensateForLuma) {
        var luma = this.getLuma(color);
        // TODO: This is totally arbitrary.
        var compensation = 1 - Math.sqrt(0.5 * (luma / 0xFF));
        lightness = Math.floor(100 * compensation) + '%';

        color = this.getColor(hue, saturation, lightness);
      }

      this.colorizeChannel(this.sources[i], this.channels[i], color);
    }

    this.mergeChannels(this.channels, this.canvas);
  };

  ChannelCycler.prototype.getHue = function(index, total, start) {
    var progress = index / total;
    var angle = progress * 360;
    return (start + angle) % 360;
  };

  ChannelCycler.prototype.getColor = function(hue, saturation, lightness) {
    return 'hsl(' + hue + ', ' + saturation + ', ' + lightness + ')';
  };

  ChannelCycler.prototype.getLuma = function(color) {
    var lumaCanvas = document.createElement('canvas');
    lumaCanvas.width = 1;
    lumaCanvas.height = 1;

    var lumaCtx = lumaCanvas.getContext('2d');
    lumaCtx.fillStyle = color;
    lumaCtx.fillRect(0, 0, 1, 1);

    var rgba = lumaCtx.getImageData(0, 0, 1, 1).data;

    return (0.2126 * rgba[0]) + (0.7152 * rgba[1]) + (0.0722 * rgba[2]);
  };

  ChannelCycler.prototype.colorizeChannel = function(source, channel, color) {
    channel.width = source.width;
    channel.height = source.height;

    var channelCtx = channel.getContext('2d');
    channelCtx.drawImage(source, 0, 0);

    if (HAS_BLENDING) {
      channelCtx.fillStyle = color;
      channelCtx.globalCompositeOperation = 'screen';
      channelCtx.fillRect(0, 0, channel.width, channel.height);
    } else {
      var colorCanvas = document.createElement('canvas');
      colorCanvas.width = source.width;
      colorCanvas.height = source.height;

      var colorCanvasCtx = colorCanvas.getContext('2d');
      colorCanvasCtx.fillStyle = color;
      colorCanvasCtx.fillRect(0, 0, colorCanvas.width, colorCanvas.height);

      this.blendManually(colorCanvas, channel, this.screenBlend);
    }
  };

  ChannelCycler.prototype.screenBlend = function(top, bottom) {
    return 0xFF * (1 - ((1 - (top / 0xFF)) * (1 - (bottom / 0xFF))));
  };

  ChannelCycler.prototype.mergeChannels = function(channels, output) {
    output.width = 0;
    output.height = 0;
    for (var i = 0; i < channels.length; i++) {
      output.width = Math.max(output.width, channels[i].width);
      output.height = Math.max(output.height, channels[i].height);
    }

    var outputCtx = output.getContext('2d');
    outputCtx.fillStyle = 'white';
    outputCtx.fillRect(0, 0, output.width, output.height);

    if (HAS_BLENDING) {
      outputCtx.globalCompositeOperation = 'multiply';
    }

    for (var j = 0; j < channels.length; j++) {
      if (HAS_BLENDING) {
        outputCtx.drawImage(channels[j], 0, 0);
      } else {
        this.blendManually(channels[j], output, this.multiplyBlend);
      }
    }
  };

  ChannelCycler.prototype.blendManually = function(top, bottom, blendFn) {
    var bottomCtx = bottom.getContext('2d');
    var bottomData = bottomCtx.getImageData(0, 0, bottom.width, bottom.height);
    var bottomPixels = bottomData.data;

    var topCtx = top.getContext('2d');
    var topPixels = topCtx.getImageData(0, 0, bottom.width, bottom.height).data;

    for (var i = 0; i < bottomPixels.length; i++) {
      if ((i + 1) % 4 === 0) continue;
      bottomPixels[i] = blendFn(topPixels[i], bottomPixels[i]);
    }

    bottomCtx.putImageData(bottomData, 0, 0);
  };

  ChannelCycler.prototype.multiplyBlend = function(top, bottom) {
    return (top * bottom) / 0xFF;
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

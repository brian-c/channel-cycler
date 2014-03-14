;(function() {
  'use strict';

  var ChannelCycler = window.ChannelCycler;

  var channelSets = [];
  for (var i = 0; i < 289; i++) {
    var channelFiles = [];
    for (var n = 1; n <= 4; n++) {
      channelFiles.push('./images/01_12DEC02_N04066_000'+ ((n % 4) + 1) + '-' + i + '-scaled.png');
    }
    channelSets.push(channelFiles);
  }

  var blackAndWhiteCheckbox = document.querySelector('[name="black-and-white"]');
  var cycleCheckbox = document.querySelector('[name="cycle"]');
  var lumaCheckbox = document.querySelector('[name="luma"]');
  var periodSlider = document.querySelector('[name="period"]');
  var periodOutput = document.querySelector('[name="for-period"]');

  var filenameContainer = document.getElementById('filename');
  var sourcesContainer = document.getElementById('sources');
  var imageContainer = document.getElementById('image');

  var prevButton = document.querySelector('[name="prev"]');
  var nextButton = document.querySelector('[name="next"]');
  var randomButton = document.querySelector('[name="random"]');

  var overrides = {
    renderBlackAndWhite: function() {
      var sourceIndex = Math.floor((this.hueRotate / 360) * this.sources.length);
      var source = this.sources[sourceIndex];
      this.canvas.width = source.width;
      this.canvas.height = source.height;
      this.canvas.getContext('2d').drawImage(source, 0, 0);
    }
  };

  var currentIndex = NaN;

  function changeImage(index) {
    if (isNaN(index)) {
      index = Math.floor(Math.random() * channelSets.length);
    }

    if (index === currentIndex) {
      return;
    }

    currentIndex = index;
    location.replace('#' + index);

    if (typeof window.cc !== 'undefined') window.cc.destroy();

    window.cc = new ChannelCycler(channelSets[index]);

    window.cc.period = parseFloat(periodSlider.value);
    periodOutput.value = window.cc.period;

    window.cc.compensateForLuma = lumaCheckbox.checked;

    filenameContainer.innerHTML = channelSets[index][0];

    sourcesContainer.innerHTML = '';
    window.cc.sources.forEach(function(source) {
      sourcesContainer.appendChild(source);
    });

    imageContainer.appendChild(window.cc.canvas);

    if (blackAndWhiteCheckbox.checked) {
      window.cc.render = overrides.renderBlackAndWhite;
    }

    if (cycleCheckbox.checked) {
      window.cc.start();
    }
  }

  prevButton.addEventListener('click', function() {
    changeImage(currentIndex - 1);
  });

  nextButton.addEventListener('click', function() {
    changeImage(currentIndex + 1);
  });

  randomButton.addEventListener('click', function() {
    changeImage();
  });

  blackAndWhiteCheckbox.addEventListener('change', function() {
    if (blackAndWhiteCheckbox.checked) {
      window.cc.render = overrides.renderBlackAndWhite;
    } else {
      delete window.cc.render;
    }

    window.cc.render();
  });

  cycleCheckbox.addEventListener('change', function() {
    if (cycleCheckbox.checked) {
      window.cc.start();
    } else {
      window.cc.stop();
    }
  });

  lumaCheckbox.addEventListener('change', function() {
    window.cc.compensateForLuma = lumaCheckbox.checked;
  });

  periodSlider.addEventListener('input', function() {
    window.cc.period = parseFloat(periodSlider.value);
    periodOutput.value = window.cc.period;
  });

  function onHashChange() {
    var hashIndex = parseFloat(location.hash.slice(1));
    changeImage(hashIndex);
  }

  addEventListener('hashchange', onHashChange);

  onHashChange();
}());

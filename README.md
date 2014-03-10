```js
// Create:
var cc = new ChannelCycler(['0.png', '1.png', '2.png', '3.png']);

// Add it to the DOM:
document.body.appendChild(cc.canvas);

// Start cycling colors:
cc.start();

// Change the time it takes to make one color cycle:
cc.period = 100; // Fast!
cc.period = 1000; // Slow!

// Stop cycling:
cc.stop();

// Cleanup when you're done:
cc.destroy();
```

To run the example, throw all those asteroid images into an "images" directory.

**NOTE:** I don't think IE can do screen/multiply canvas blend modes. But I can't imagine it's hard to do this with math.

**ALSO:** Three-channel combinations look worse than four-channel for some reason. Maybe we can compensate for the luminosity of the color?

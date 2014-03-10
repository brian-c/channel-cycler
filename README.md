```js
new ChannelCycler(['0.png', '1.png', '2.png', '3.png']);
```

To run the example, throw all those asteroid images into an "images" directory.

**NOTE:** I don't think IE can do screen/multiply canvas blend modes. But I can't imagine it's hard to do this with math.

**ALSO:** Three-channel combinations look worse than four-channel for some reason. Maybe we can compensate for the luminosity of the color?

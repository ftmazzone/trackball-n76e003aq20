# trackball - N76E003AQ20

Node.js module for reading the [Pimoroni trackball](https://shop.pimoroni.com/products/trackball-breakout) powered by a [Nuvoton N76E003AQ20](https://www.nuvoton.com/products/microcontrollers/8bit-8051-mcus/low-pin-count-8051-series/n76e003/) MCU.

[![pipeline status](https://gitlab.com/ftmazzone/trackball-N76E003AQ20/badges/master/pipeline.svg)](https://gitlab.com/ftmazzone/trackball-N76E003AQ20/-/commits/master)
[![coverage report](https://gitlab.com/ftmazzone/trackball-N76E003AQ20/badges/master/coverage.svg)](https://gitlab.com/ftmazzone/trackball-N76E003AQ20/commits/master)
[![Quality Gate](https://sonarcloud.io/api/project_badges/measure?project=ftmazzone_trackball-n76e003aq20&metric=alert_status&style=flat-square)](https://sonarcloud.io/dashboard?id=ftmazzone_trackball-n76e003aq20)

## Prerequisites
### Wiring

| Device pin    |Raspberry Pi pin|Raspberry Pi GPIO|
|----------------|:---------------|:----------------|
| GND            |   6            |                 |
| INT            |                |                 |
| SCL (SPI_CLK)  |   3            |        2        |
| SDA (SPI_MOSI) |   5            |        3        |
| 3-5V           |   1            |                 |

### Installation

```sh
npm install pim447-trackball
```

## Available Properties

### Colour

Returns the current colour of the trackball using the rgbw colour code.

Usage:
```javascript
trackball.setColour(0,1,2,3);
trackball.Colour // Returns { r: 0, g: 1, b: 2, w: 3 } 
```

### Contrast

Returns the current contrast of the trackball.

Usage:
```javascript
await trackball.setContrast(0x0A);
trackball.Contrast // Returns 10
```

## Available Methods

### convertHexColourToRgb(hexcolour) - static

Converts hexadecimal colour code to a rgb colour code.

Usage:
```javascript
Trackball.convertHexColourToRgb('#FF530D'); // Returns { r: 255, g: 83, b: 13 }
```

### convertHexColourToRgbw(hexcolour) - static

Converts hexadecimal colour code to a rgbw colour code.

Usage:
```javascript
Trackball.convertHexColourToRgbw('#FF530D'); // Returns { r: 242, g: 70, b: 0, w:13 }
```

### convertRgbToRgbw(r,g,b) - static

Converts rgb colour code to a rgbw colour code. The colour range is [0x00,0xFF] for each component.

Usage:
```javascript
Trackball.convertRgbToRgbw(255, 83 ,13); // Returns { r: 242, g: 70, b: 0, w:13 }
```

### setColour(r,g,b,w)

Sets the colour of the trackball. The colour range is [0x00,0xFF] for each component.

Usage:
```javascript
await trackball.setColour(0xF0,0xF1,0xF2,0xF3); //sets the colour to (r:0xF0,g:0xF1,b:0xF2,w:0xF2)
```

### setContrast(value)

Sets the contrast of the trackball . The contrast range is [0x00,0xFF].

Usage:
```javascript
await trackball.setContrast(0xFF); //sets the contrast to (r:0xFF)
```

### turnOn(refreshRate)

Enables the trackball. Status events will be sent per event.
The defaut refresh rate 50 milliseconds

Usage:
```javascript
const trackball = new Trackball();
await trackball.turnOn(100); //sets the refresh rate to 100 milliseconds.
```

### turnOff

Disables the tracking of the cursor position and turn off the lighting of the trackball.

Usage:
```javascript
await trackball.turnOff();
```

## Available Events

### stateUpdate

Returns the cursor movements and the click events.

Event format:
```javascript
    {
        left: 0, //trackball movement
        right: 0, //trackball movement
        up: 0, //trackball movement
        down: 1, //trackball movement
        clicked: false, //current click state
        clickStateUpdate: 1, //the click state changed between this event and the previous one
        stateUpdate: true //a movement or click event occured
    }
```

Usage:
```javascript
function handleStateUpdate(inputs) {
    console.info(inputs);
}

async function initialize() {
    trackball = new Trackball();
    await trackball.turnOn(); 

    trackball.on('stateUpdate', handleStateUpdate); //enable the event listening

    console.info('Click or move the cursor to trigger some events');

    setTimeout(()=>{  trackball.off("stateUpdate", handleStateUpdate);},300000);
}
```


## Credits

* [pimoroni/trackball-python](https://github.com/pimoroni/trackball-python) to understand the i2C communication between the MCU and the controller - [MIT](https://github.com/pimoroni/trackball-python/blob/master/LICENSE)

'use strict';

const { Trackball } = require('../lib/index.js');
let trackball;

function handleStateUpdate(inputs) {
    console.info(inputs);
}

async function initialize() {
    trackball = new Trackball();
    await trackball.turnOn();
    const {
        r,
        g,
        b,
        w
    } = Trackball.convertHexColourToRgbw('#ff00ff');
    await trackball.setColour(r, g, b, w);
    await trackball.setContrast(0xff);
    trackball.on('stateUpdate', handleStateUpdate);
    console.info('Click or move the cursor to trigger some events');
}

(async () => {
    await initialize();
    setTimeout(async () => {
        trackball.off("stateUpdate", handleStateUpdate);
        await trackball.turnOff();
        console.info('Close the listener and stops checking the trackball state');
    }, 60000);
})();
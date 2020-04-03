'use strict';

const EventEmitter = require('events');
const i2c = require('i2c-bus');
const os = require('os');
const osEndianess = os.endianness();

const constants = {
    I2C_ADDR_PRIMARY: 0x0A,
    I2C_ADDR_ALTERNATIVE: 0x0B,
    CHIP_ID: 0xBA11,
    VERSION: 1,
    REG_LED_RED: 0x00,
    REG_LED_GRN: 0x01,
    REG_LED_BLU: 0x02,
    REG_LED_WHT: 0x03,
    REG_LEFT: 0x04,
    REG_RIGHT: 0x05,
    REG_UP: 0x06,
    REG_DOWN: 0x07,
    REG_SWITCH: 0x08,
    MSK_CLICKED: 0x80,
    MSK_CLICK_STATE_UPDATE: 0x01,
    MSK_SWITCH_STATE: 0b10000000,
    REG_USER_FLASH: 0xD0,
    REG_FLASH_PAGE: 0xF0,
    REG_INT: 0xF9,
    MSK_INT_TRIGGERED: 0b00000001,
    MSK_INT_OUT_EN: 0b00000010,
    REG_CHIP_ID_L: 0xFA,
    RED_CHIP_ID_H: 0xFB,
    REG_VERSION: 0xFC,
    REG_I2C_ADDR: 0xFD,
    REG_CTRL: 0xFE,
    MSK_CTRL_SLEEP: 0b00000001,
    MSK_CTRL_RESET: 0b00000010,
    MSK_CTRL_FREAD: 0b00000100,
    MSK_CTRL_FWRITE: 0b00001000
};


class Trackball extends EventEmitter {
    /**
     * Constructor
     * @param {*} device 
     * @param {*} i2cAddress 
     */
    constructor(device, i2cAddress) {
        super();
        if (typeof (device) == 'undefined') {
            this.device = 1;
        }
        else {
            this.device = device;
        }
        if (!i2cAddress) {
            this.i2cAddress = constants.I2C_ADDR_PRIMARY;
        } else {
            this.i2cAddress = i2cAddress
        }
        this.contrast = 0;
    }

    /**
     * Enables the trackball. Status events will be sent per event.
     * The defaut refresh interval is 50 milliseconds
     * @param {*} refreshInterval 
     */
    async turnOn(refreshInterval = 50) {
        this.enabled = true;
        this.wire = await i2c.openPromisified(this.device);
        const chipId = (await this.readByte(constants.REG_CHIP_ID_L, 2)).buffer;
        this.chip_id = ('LE' === osEndianess) ? chipId.readUIntLE(0, 2) : chipId.readUIntBE(0, 2);

        if (this.chip_id !== constants.CHIP_ID) {
            const invalidChipIdError = new Error(`Trackball chip Not Found. Invalid CHIP ID: 0x${chipId.toString('hex')}`);
            throw invalidChipIdError;
        }

        this.RefreshInterval = refreshInterval;
    }


    /**
     * Sets the refresh interval in milliseconds of the cursor and click events.
     * @param {Integer} value
     */
    set RefreshInterval(value) {
        this.refreshInterval = value;
        clearInterval(this.readInputInterval);
        this.readInputInterval = setInterval(this.readInputs.bind(this), this.refreshInterval);
    }

    /**
     * Gets the refresh interval in milliseconds.
     */
    get RefreshInterval() {
        return this.refreshInterval;
    }

    /**
     * Sets the colour of the trackball. The colour range is [0x00,0xFF] for each component.
     * @param {*} r 
     * @param {*} g 
     * @param {*} b 
     * @param {*} w 
     */
    async setColour(r, g, b, w) {
        this.r = r || 0;
        this.g = g || 0;
        this.b = b || 0;
        this.w = w || 0;
        const contrast = (0 !== this.r + this.g + this.b + this.w) ? this.contrast / 0xff : 0x00;
        await this.writeByte(constants.REG_LED_RED, Math.round(this.r * contrast));
        await this.writeByte(constants.REG_LED_GRN, Math.round(this.g * contrast));
        await this.writeByte(constants.REG_LED_BLU, Math.round(this.b * contrast));
        await this.writeByte(constants.REG_LED_WHT, Math.round(this.w * contrast));
    }

    /**
     * Returns the current colour of the trackball using the rgbw colour code.
     */
    get Colour() {
        return {
            r: this.r,
            g: this.g,
            b: this.b,
            w: this.w
        };
    }

    /**
     * Returns the current contrast of the trackball.
     */
    get Contrast() {
        return this.contrast;
    }

    /**
     * Sets the contrast of the trackball . The contrast range is [0x00,0xFF].
     * @param {*} value 
     */
    async setContrast(value) {
        this.contrast = value;
        await this.setColour(this.r, this.g, this.b, this.w);
    }

    /**
     * Disables the tracking of the cursor position and turn off the lighting of the trackball.
     */
    async turnOff() {
        try {
            clearInterval(this.readInputInterval);
            this.readInputInterval = null;
            await this.setContrast(0x00);
        }
        finally {
            this.enabled = false;
        }
    }

    async readInputs() {
        const rawInputs = (await this.readByte(constants.REG_LEFT, 5)).buffer;
        const left = rawInputs[0];
        const right = rawInputs[1];
        const up = rawInputs[2];
        const down = rawInputs[3];
        const clicked = !!(rawInputs[4] & constants.MSK_CLICKED);
        const clickStateUpdate = !!rawInputs[4] & constants.MSK_CLICK_STATE_UPDATE;
        const stateUpdate = !!(left || right || up || down || clickStateUpdate);


        const inputs = {
            left,
            right,
            up,
            down,
            clicked,
            clickStateUpdate,
            stateUpdate
        };

        if (stateUpdate) {
            this.emit('stateUpdate', inputs);
        }

        return inputs;
    }

    async writeByte(cmd, byte) {
        let result;
        if (!this.enabled) {
            console.warn('writeByte warning - trackball is turned off')
            result = false;
        }
        else {
            result = await this.wire.writeByte(this.i2cAddress, cmd, byte);
        }
        return result;
    }

    async readByte(cmd, length) {
        let result;
        if (!this.enabled) {
            console.warn('readByte warning - trackball is turned off')
            result = false;
        }
        else if (!length || length === 1) {
            result = await this.wire.readByte(this.i2cAddress, cmd);
        } else {
            const buffer = Buffer.alloc(length);
            result = await this.wire.readI2cBlock(this.i2cAddress, cmd, length, buffer);
        }
        return result;
    }

    /**
     * Converts hexadecimal colour code to a rgb colour code.
     * @param {*} hexcolour 
     */
    static convertHexColourToRgb(hexcolour) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexcolour);
        if (result) {
            return {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            }
        } else {
            throw new Error(`${hexcolour} is not a valid hexadecimal colour`);
        }
    }

    /**
     * Converts rgb colour code to a rgbw colour code. The colour range is [0x00,0xFF] for each component.
     * @param {*} r 
     * @param {*} g 
     * @param {*} b 
     */
    static convertRgbToRgbw(r, g, b) {

        //Get the maximum between R, G, and B
        const tM = Math.max(r, Math.max(g, b));

        //If the maximum value is 0, immediately return pure black.
        if (tM == 0) {
            return {
                r: 0,
                g: 0,
                b: 0,
                w: 0
            };
        }

        //This section serves to figure out what the color with 100% hue is
        const multiplier = 255 / tM;
        const hR = r * multiplier;
        const hG = g * multiplier;
        const hB = b * multiplier;

        //This calculates the Whiteness (not strictly speaking Luminance) of the color
        const M = Math.max(hR, Math.max(hG, hB));
        const m = Math.min(hR, Math.min(hG, hB));
        const luminance = ((M + m) / 2.0 - 127.5) * (255.0 / 127.5) / multiplier;

        //Calculate the output values
        let w = parseInt(luminance);
        b = parseInt(b - luminance);
        r = parseInt(r - luminance);
        g = parseInt(g - luminance);

        //Trim them so that they are all between 0 and 255
        if (w < 0) w = 0;
        if (b < 0) b = 0;
        if (r < 0) r = 0;
        if (g < 0) g = 0;
        if (w > 255) w = 255;
        if (b > 255) b = 255;
        if (r > 255) r = 255;
        if (g > 255) g = 255;

        return {
            r,
            g,
            b,
            w
        };
    }

    /**
     * Converts hexadecimal colour code to a rgbw colour code.
     * @param {*} hexcolour 
     */
    static convertHexColourToRgbw(hexcolour) {
        let {
            r,
            g,
            b
        } = Trackball.convertHexColourToRgb(hexcolour);


        return Trackball.convertRgbToRgbw(r, g, b);
    }

}

module.exports = { Trackball };
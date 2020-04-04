const rejects = require('assert').rejects;
const assert = require('chai').assert;
const rewire = require("rewire");
let Trackball;

describe('index', function () {

    describe("constructor", function () {

        beforeEach(function () {
            Trackball = require('../lib/index').Trackball;
        });

        it('Check that the class Trackball is initialised', function () {
            //Act
            const trackball = new Trackball(2, 0x77);

            //Assert
            assert.equal(trackball.device, 2);
            assert.equal(trackball.i2cAddress, 0x77);
            assert.equal(trackball.contrast, 0);
        });

        it('Check that the class Trackball is initialised', function () {
            //Act
            const trackball = new Trackball();

            //Assert
            assert.equal(trackball.device, 1);
            assert.equal(trackball.i2cAddress, 0x0A);
            assert.equal(trackball.contrast, 0);
        });
    });

    describe("turnOn", function () {

        beforeEach(function () {
            Trackball = rewire('../lib/index');
        });

        it('default refresh rate', async function () {
            //Prepare
            let openPromisifiedParams, readByteParams, setContrastParams;

            Trackball.__set__('i2c', {
                openPromisified: (...params) => {
                    openPromisifiedParams = params;
                    return {};
                }
            });

            const trackball = new Trackball.Trackball();
            trackball.readByte = (...params) => {
                readByteParams = params;
                return { buffer: Buffer.from([0x11, 0xba]) };
            };

            trackball.setContrast = (...params) => {
                setContrastParams = params;
            };

            //Act
            await trackball.turnOn();
            await trackball.turnOff();

            //Assert
            assert.deepEqual(openPromisifiedParams, [1]);
            assert.deepEqual(readByteParams, [0xFA, 0x02]);
            assert.deepEqual(setContrastParams, [0]);
            assert.equal(trackball.refreshInterval, 50);
        });

        it('custom refresh rate', async function () {
            //Prepare
            let openPromisifiedParams, readByteParams, setContrastParams;

            Trackball.__set__('i2c', {
                openPromisified: (...params) => {
                    openPromisifiedParams = params;
                    return {};
                }
            });

            const trackball = new Trackball.Trackball();
            trackball.readByte = (...params) => {
                readByteParams = params;
                return { buffer: Buffer.from([0x11, 0xba]) };
            };

            trackball.setContrast = (...params) => {
                setContrastParams = params;
            };

            //Act
            await trackball.turnOn(125);
            await trackball.turnOff();

            //Assert
            assert.deepEqual(openPromisifiedParams, [1]);
            assert.deepEqual(readByteParams, [0xFA, 0x02]);
            assert.deepEqual(setContrastParams, [0]);
            assert.equal(trackball.refreshInterval, 125);
        });

        it('invalid chip id - BE', async function () {
            //Prepare
            let openPromisifiedParams, readByteParams;

            Trackball.__set__('i2c', {
                openPromisified: (...params) => {
                    openPromisifiedParams = params;
                    return {};
                }
            });

            const trackball = new Trackball.Trackball();
            trackball.readByte = (...params) => {
                readByteParams = params;
                return { buffer: Buffer.from([0x12, 0x34]) };
            };

            //Act
            await rejects(trackball.turnOn(), {
                message: 'Trackball chip Not Found. Invalid CHIP ID: 0x1234',
                name: 'Error'
            });

            //Assert
            assert.deepEqual(openPromisifiedParams, [1]);
            assert.deepEqual(readByteParams, [0xFA, 0x02]);
            assert.equal(trackball.chip_id, 13330);
        });

        it('invalid chip id - LE', async function () {
            //Prepare
            let openPromisifiedParams, readByteParams;

            Trackball.__set__('i2c', {
                openPromisified: (...params) => {
                    openPromisifiedParams = params;
                    return {};
                }
            });

            Trackball.__set__('osEndianess', 'BE');

            const trackball = new Trackball.Trackball();
            trackball.readByte = (...params) => {
                readByteParams = params;
                return { buffer: Buffer.from([0x12, 0x34]) };
            };

            //Act
            await rejects(trackball.turnOn(), {
                message: 'Trackball chip Not Found. Invalid CHIP ID: 0x1234',
                name: 'Error'
            });

            //Assert
            assert.deepEqual(openPromisifiedParams, [1]);
            assert.deepEqual(readByteParams, [0xFA, 0x02]);
            assert.equal(trackball.chip_id, 4660);
        })
    });

    describe('setColour', function () {

        beforeEach(function () {
            Trackball = require('../lib/index').Trackball;
        });

        it('default colour', async function () {
            //Prepare
            const writeByteParams = [];
            const trackball = new Trackball();
            trackball.writeByte = (...params) => {
                writeByteParams.push(params);
            };

            //Act
            await trackball.setColour();

            //Assert
            assert.deepEqual(writeByteParams, [[0, 0], [1, 0], [2, 0], [3, 0]]);
            assert.deepEqual(trackball.Colour, { r: 0x00, g: 0x00, b: 0x00, w: 0x00 })
        });

        it('custom colour', async function () {
            //Prepare
            const writeByteParams = [];
            const trackball = new Trackball();
            trackball.writeByte = (...params) => {
                writeByteParams.push(params);
            };
            trackball.contrast = 0xA0;

            //Act
            await trackball.setColour(0xF0, 0xF1, 0xF2, 0xFF);

            //Assert
            assert.deepEqual(writeByteParams, [[0, 0x97], [1, 0x97], [2, 0x98], [3, 0xA0]]);
            assert.deepEqual(trackball.Colour, { r: 0xF0, g: 0xF1, b: 0xF2, w: 0xFF })
        });
    });

    describe('setContrast', function () {

        beforeEach(function () {
            Trackball = require('../lib/index').Trackball;
        });

        it('75%', async function () {
            //Prepare
            const writeByteParams = [];
            const trackball = new Trackball();
            trackball.writeByte = (...params) => {
                writeByteParams.push(params);
            };
            trackball.r = 0xFF;
            trackball.g = 0xFF;
            trackball.b = 0xFF;
            trackball.w = 0xFF;

            //Act
            await trackball.setContrast(0x7F);

            //Assert
            assert.deepEqual(writeByteParams, [[0, 0x7F], [1, 0x7F], [2, 0x7F], [3, 0x7F]]);
            assert.deepEqual(trackball.Contrast, 0x7F)
        });

    });

    describe('setRefreshInterval', function () {

        beforeEach(function () {
            Trackball = require('../lib/index').Trackball;
        });

        it('123 ms', async function () {
            //Prepare
            const trackball = new Trackball();

            //Act
            trackball.RefreshInterval = 123;

            //Assert
            assert.equal(trackball.readInputInterval.constructor.name, 'Timeout');
            assert.equal(trackball.readInputInterval._idleTimeout, 123);
            assert.equal(trackball.RefreshInterval, trackball.readInputInterval._idleTimeout);
            assert.equal(trackball.RefreshInterval, trackball.RefreshInterval);
            clearInterval(trackball.readInputInterval);
        });

    });

    describe('readInputs', function () {

        beforeEach(function () {
            Trackball = require('../lib/index').Trackball;
        });

        it('state update (click)', async function () {
            //Prepare
            const readByteParams = [], statusUpdateHandlerParams = [];
            const trackball = new Trackball();
            trackball.readByte = (...params) => {
                readByteParams.push(params);
                return { buffer: new Buffer.from([0x00, 0x00, 0x00, 0x00, 0x80 + 0x01]) };
            };

            const statusUpdateHandler = (...params) => {
                statusUpdateHandlerParams.push(params);
            };

            trackball.once('stateUpdate', statusUpdateHandler);

            //Act
            await trackball.readInputs();

            //Assert
            assert.deepEqual(readByteParams, [[4, 5]]);
            assert.deepEqual(statusUpdateHandlerParams, [[{ clickStateUpdate: 1, clicked: true, down: 0, left: 0, right: 0, stateUpdate: true, up: 0 }]]);
        });

        it('state update (movement)', async function () {
            //Prepare
            const readByteParams = [], statusUpdateHandlerParams = [];
            const trackball = new Trackball();
            trackball.readByte = (...params) => {
                readByteParams.push(params);
                return { buffer: new Buffer.from([0x01, 0x02, 0x03, 0x04, 0x1]) };
            };

            const statusUpdateHandler = (...params) => {
                statusUpdateHandlerParams.push(params);
            };

            trackball.once('stateUpdate', statusUpdateHandler);

            //Act
            await trackball.readInputs();

            //Assert
            assert.deepEqual(readByteParams, [[4, 5]]);
            assert.deepEqual(statusUpdateHandlerParams, [[{ clickStateUpdate: 1, clicked: false, down: 4, left: 1, right: 2, stateUpdate: true, up: 3 }]]);
        });

        it('no state update', async function () {
            //Prepare
            const readByteParams = [];
            const trackball = new Trackball();
            trackball.readByte = (...params) => {
                readByteParams.push(params);
                return { buffer: new Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00]) };
            };


            //Act
            await trackball.readInputs();

            //Assert
            assert.deepEqual(readByteParams, [[4, 5]]);
        });

        it('exception', async function () {
            //Prepare
            const readByteParams = [];
            const myReadInputError = new Error('myReadInputException');
            let errorMessage;

            const trackball = new Trackball();
            trackball.readByte = (...params) => {
                readByteParams.push(params);
                throw myReadInputError;
            };

            console.error = (...message) => errorMessage = message;

            //Act
            await trackball.readInputs();

            //Assert
            assert.deepEqual(readByteParams, [[4, 5]]);
            assert.deepEqual(errorMessage, ['readInputs error', myReadInputError]);
        });

        it('exception - with error handler', async function () {
            //Prepare
            const TrackballError = require('../lib/index').TrackballError;
            const readByteParams = [], errorHandlerParams = [];
            const myReadInputError = new Error('myReadInputException');

            const trackball = new Trackball();
            trackball.readByte = (...params) => {
                readByteParams.push(params);
                throw myReadInputError;
            };

            trackball.once('error', async (params) => {
                errorHandlerParams.push(params);
                await trackball.turnOff();
            });

            //Act
            await trackball.readInputs();

            //Assert
            assert.deepEqual(readByteParams, [[4, 5]]);
            assert.deepEqual(errorHandlerParams.length, 1);
            assert.deepEqual(errorHandlerParams[0].constructor.name, 'TrackballError');
            assert.deepEqual(errorHandlerParams[0].message, 'readInputs error');
            assert.deepEqual(errorHandlerParams[0].code, 'readInputError');
            assert.deepEqual(errorHandlerParams[0].innerError, myReadInputError);
        });
    });

    describe('writeByte', function () {

        beforeEach(function () {
            Trackball = require('../lib/index').Trackball;
        });

        it('ok', async function () {
            //Prepare
            const wireWriteByteParams = [];
            const trackball = new Trackball();
            trackball.enabled = true;
            trackball.wire = {
                writeByte: (...params) => { wireWriteByteParams.push(params); }
            };

            //Act
            await trackball.writeByte(0x01, 0x02);

            //Assert
            assert.deepEqual(wireWriteByteParams, [[0x0A, 0x01, 0x02]]);
        });

        it('turned off', async function () {
            //Prepare
            let warningMessage;
            const trackball = new Trackball();

            console.warn = message => warningMessage = message;

            //Act
            const result = await trackball.writeByte(0x01, 0x02);

            //Assert
            assert.isFalse(result);
            assert.equal(warningMessage, 'writeByte warning - trackball is turned off');
        });
    });

    describe('readByte', function () {

        beforeEach(function () {
            Trackball = require('../lib/index').Trackball;
        });

        it('readByte', async function () {
            //Prepare
            const wireReadByteParams = [];
            const trackball = new Trackball();
            trackball.enabled = true;
            trackball.wire = {
                readByte: (...params) => {
                    wireReadByteParams.push(params);
                    return Buffer.from([0x01]);
                }
            };

            //Act
            const result = await trackball.readByte(0x01, 1);

            //Assert
            assert.deepEqual(result, Buffer.from([0x01]));
            assert.deepEqual(wireReadByteParams, [[0x0A, 0x01]]);
        });

        it('readI2cBlock', async function () {
            //Prepare
            const wirereadI2cBlockParams = [];
            const trackball = new Trackball();
            trackball.enabled = true;
            trackball.wire = {
                readI2cBlock: (...params) => {
                    wirereadI2cBlockParams.push(params);
                    return Buffer.from([0x01, 0x02]);
                }
            };

            //Act
            const result = await trackball.readByte([0x03, 0x04], 2);

            //Assert
            assert.deepEqual(result, Buffer.from([0x01, 0x2]));
            assert.deepEqual(wirereadI2cBlockParams, [[0x0A, [0x03, 0x04], 0x2, Buffer.alloc(2)]]);
        });

        it('turned off', async function () {
            //Prepare
            let warningMessage;
            const trackball = new Trackball();

            console.warn = message => warningMessage = message;

            //Act
            const result = await trackball.readByte(0x01, 1);

            //Assert
            assert.isFalse(result);
            assert.equal(warningMessage, 'readByte warning - trackball is turned off');
        });
    });

    describe('convertHexColourToRgb', function () {

        beforeEach(function () {
            Trackball = require('../lib/index').Trackball;
        });

        it('valid colour', async function () {
            //Prepare
            //Act
            const result = Trackball.convertHexColourToRgb('#F0F1F2');

            //Assert
            assert.deepEqual(result, { r: 0xF0, g: 0xF1, b: 0xF2 });
        });

        it('not a valid colour', function () {
            //Prepare
            let exceptionMessage;

            //Act
            try {
                Trackball.convertHexColourToRgb('#F0F1F2F3');
            }
            catch (err) {
                exceptionMessage = err.message;
            }

            //Assert
            assert.equal(exceptionMessage, '#F0F1F2F3 is not a valid hexadecimal colour');
        });
    });

    describe('convertRgbToRgbw', function () {

        beforeEach(function () {
            Trackball = require('../lib/index').Trackball;
        });

        it('custom', async function () {
            //Prepare
            //Act
            const result = Trackball.convertRgbToRgbw(0x7A, 0x7B, 0x7C);

            //Assert
            assert.deepEqual(result, { r: 0x00, g: 0x00, b: 0x01, w: 0x7A });
        });

        it('black', async function () {
            //Prepare
            //Act
            const result = Trackball.convertRgbToRgbw(0x00, 0x00, 0x00);

            //Assert
            assert.deepEqual(result, { r: 0x00, g: 0x00, b: 0x00, w: 0x00 });
        });

        it('white', async function () {
            //Prepare
            //Act
            const result = Trackball.convertRgbToRgbw(0xFFF, 0xFFF, 0xFFF);

            //Assert
            assert.deepEqual(result, { r: 0x00, g: 0x00, b: 0x00, w: 0xFF });
        });

        it('red', async function () {
            //Prepare
            //Act
            const result = Trackball.convertRgbToRgbw(0xFFF, 0x00, 0x00);

            //Assert
            assert.deepEqual(result, { r: 0xFF, g: 0x00, b: 0x00, w: 0x00 });
        });

        it('green', async function () {
            //Prepare
            //Act
            const result = Trackball.convertRgbToRgbw(0x00, 0xFFF, 0x00);

            //Assert
            assert.deepEqual(result, { r: 0x00, g: 0xFF, b: 0x00, w: 0x00 });
        });

        it('blue', async function () {
            //Prepare
            //Act
            const result = Trackball.convertRgbToRgbw(0x00, 0x00, 0xFFF);

            //Assert
            assert.deepEqual(result, { r: 0x00, g: 0x00, b: 0xFF, w: 0x00 });
        });

        it('no red', async function () {
            //Prepare
            //Act
            const result = Trackball.convertRgbToRgbw(0x01, 0xFFF, 0xFFF);

            //Assert
            assert.deepEqual(result, { r: 0x00, g: 0xFF, b: 0xFF, w: 0x01 });
        });

        it('no green', async function () {
            //Prepare
            //Act
            const result = Trackball.convertRgbToRgbw(0xFFF, 0x01, 0xFFF);

            //Assert
            assert.deepEqual(result, { r: 0xFF, g: 0x00, b: 0xFF, w: 0x01 });
        });

        it('no blue', async function () {
            //Prepare
            //Act
            const result = Trackball.convertRgbToRgbw(0xFFF, 0xFFF, 0x01);

            //Assert
            assert.deepEqual(result, { r: 0xFF, g: 0xFF, b: 0x00, w: 0x01 });
        });

        it('no white', async function () {
            //Prepare
            //Act
            const result = Trackball.convertRgbToRgbw(-0x01, -0x01, -0x01);

            //Assert
            assert.deepEqual(result, { r: 0x00, g: 0x00, b: 0x00, w: 0x00 });
        });
    });

    describe('convertRgbToRgbw', function () {

        beforeEach(function () {
            Trackball = require('../lib/index').Trackball;
        });

        it('white', async function () {
            //Prepare
            //Act
            const result = Trackball.convertHexColourToRgbw('#FFFFFF');

            //Assert
            assert.deepEqual(result, { r: 0x00, g: 0x00, b: 0x00, w: 0xFF });
        });
    });
});
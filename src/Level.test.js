/* global describe, it */
const {expect} = require('chai');
const Memdown = require('memdown');
const uuid = require('uuid');
const Level = require('./Level.js');

let level;

describe('Level', () => {
  it('should open in normal mode by default', async () => {
    level = new Level({
      name: uuid(),
      backend: Memdown,
    });
    await level.open();
    expect(level.mode == Level.NORMAL);
  });

  it('should error on changes in client mode', async () => {
    level = new Level({
      name: uuid(),
      backend: Memdown,
      mode: Level.CLIENT,
    });
    await level.open();
    try {
      await level.changes(123);
      throw new Error('Should have errored');
    } catch (error) {
      expect(error.message).to.contain('Only Allowed');
    }
  });

  it('should error on change in client mode', async () => {
    level = new Level({
      name: uuid(),
      backend: Memdown,
      mode: Level.CLIENT,
    });
    await level.open();
    try {
      await level.change([]);
      throw new Error('Should have errored');
    } catch (error) {
      expect(error.message).to.contain('Only Allowed');
    }
  });

  it('should error on apply in server mode', async () => {
    level = new Level({
      name: uuid(),
      backend: Memdown,
      mode: Level.SERVER,
    });
    await level.open();
    try {
      await level.apply({});
      throw new Error('Should have errored');
    } catch (error) {
      expect(error.message).to.contain('Only Allowed');
    }
  });

  it('should error on dirty in server mode', async () => {
    level = new Level({
      name: uuid(),
      backend: Memdown,
      mode: Level.SERVER,
    });
    await level.open();
    try {
      await level.dirty();
      throw new Error('Should have errored');
    } catch (error) {
      expect(error.message).to.contain('Only Allowed');
    }
  });

  it('should error on clean in server mode', async () => {
    level = new Level({
      name: uuid(),
      backend: Memdown,
      mode: Level.SERVER,
    });
    await level.open();
    try {
      await level.clean(123, []);
      throw new Error('Should have errored');
    } catch (error) {
      expect(error.message).to.contain('Only Allowed');
    }
  });
});

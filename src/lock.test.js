/* global describe, it */
const {expect} = require('chai');
const Memdown = require('memdown');
const uuid = require('uuid');
const Level = require('./Level.js');

let level;

describe('Lock', () => {
  it('should lock on write', async () => {
    level = new Level({
      name: uuid(),
      backend: Memdown,
      mode: Level.SERVER,
    });
    await level.open();

    try {
      level.put('a', '1');
      await level.put('b', '2');
      throw new Error('Should have errored');
    } catch (error) {
      expect(error.message).to.equal('Locked');
    }
  });

  it('should lock on change', async () => {
    level = new Level({
      name: uuid(),
      backend: Memdown,
      mode: Level.SERVER,
    });
    await level.open();

    try {
      level.put('a', '1');
      await level.change(0, [
        {type: 'put', key: 'a', value: '1'},
      ]);
      throw new Error('Should have errored');
    } catch (error) {
      expect(error.message).to.equal('Locked');
    }
  });

  it('should unlock on change error', async () => {
    level = new Level({
      name: uuid(),
      backend: Memdown,
      mode: Level.SERVER,
    });
    await level.open();

    try {
      await level.change(1, [
        {type: 'put', key: 'a', value: '1'},
      ]);
      throw new Error('Should have errored');
    } catch (error) {
      expect(error.message).to.equal('CID Mismatch');
    }

    await level.put('a', '1');
  });
});

/* global describe, beforeEach, it */
const {expect} = require('chai');
const Memdown = require('memdown');
const uuid = require('uuid');
const Level = require('./Level.js');

let level;

describe('Server', () => {
  beforeEach(async () => {
    level = new Level({
      name: uuid(),
      backend: Memdown,
      mode: Level.SERVER,
    });
    await level.open();
  });

  it('should open and close properly', async () => {
    expect(level.CID).to.equal(0);
    await level.close();
  });

  it('should read cid properly on open', async () => {
    await level.put('a', '1');
    await level.put('a', '2');
    await level.put('a', '3');

    let cid = await level.get('!');
    expect(cid).to.equal(3);
    expect(level.CID).to.equal(3);

    await level.close();
    await level.open();

    cid = await level.get('!');
    expect(cid).to.equal(3);
    expect(level.CID).to.equal(3);
  });

  it('should put/get with sync data properly', async () => {
    await level.put('foo', 'bar');

    const value = await level.get('foo');
    const meta = await level.get('!1');

    expect(value).to.equal('bar');
    expect(meta).to.deep.equal(['foo', 'bar']);

    const cid = await level.get('!');
    expect(cid).to.equal(1);
    expect(level.CID).to.equal(1);
  });

  it('should del/get with sync data properly', async () => {
    await level.put('foo', 'bar');
    await level.del('foo');

    const value = await level.get('foo');
    const meta1 = await level.get('!1');
    const meta2 = await level.get('!2');

    expect(value).to.equal(undefined);
    expect(meta1).to.deep.equal(['foo', 'bar']);
    expect(meta2).to.deep.equal(['foo']);
  });

  it('should batch with sync data', async () => {
    await level.batch([
      {type: 'put', key: 'test', value: true},
      {type: 'put', key: 'foo', value: 'bar'},
      {type: 'del', key: 'test'},
    ]);

    // Test foo
    let value = await level.get('foo');
    const meta2 = await level.get('!2');
    expect(value).to.equal('bar');
    expect(meta2).to.deep.equal(['foo', 'bar']);

    // Test test
    value = await level.get('test');
    const meta1 = await level.get('!1');
    const meta3 = await level.get('!3');
    expect(value).to.equal(undefined);
    expect(meta1).to.deep.equal(['test', true]);
    expect(meta3).to.deep.equal(['test']);
  });

  it('should query data', async () => {
    await level.put('a', '1');
    await level.put('b', '2');
    await level.put('c', '3');

    const values = await level.query();

    expect(values).to.deep.equal([
      {key: 'a', value: '1'},
      {key: 'b', value: '2'},
      {key: 'c', value: '3'},
    ]);
  });

  it('should get keys', async () => {
    await level.put('a', '1');
    await level.put('b', '2');
    await level.put('c', '3');

    const values = await level.keys();

    expect(values).to.deep.equal(['a', 'b', 'c']);
  });

  it('should get values', async () => {
    await level.put('a', '1');
    await level.put('b', '2');
    await level.put('c', '3');

    const values = await level.values();

    expect(values).to.deep.equal(['1', '2', '3']);
  });

  it('should return changes records', async () => {
    await level.put('a', '1');
    await level.put('b', '2');
    await level.put('c', '3');

    expect(level.CID).to.equal(3);

    let changes = await level.changes(0);
    expect(changes).to.deep.equal({
        cid: 3,
        changes: [
          ['a', '1'],
          ['b', '2'],
          ['c', '3'],
        ],
      });

    changes = await level.changes(0, 2);
    expect(changes).to.deep.equal({
        cid: 2,
        changes: [
          ['a', '1'],
          ['b', '2'],
        ],
      });

    changes = await level.changes(2);
    expect(changes).to.deep.equal({
        cid: 3,
        changes: [
          ['c', '3'],
        ],
      });
  });

  it('should record changes and set cid', async () => {
    const cid = await level.change(0, [
      {type: 'put', key: 'a', value: '1'},
      {type: 'put', key: 'b', value: '2'},
      {type: 'del', key: 'c'},
    ]);

    expect(cid).to.equal(3);
  });

  it('should verify cid on change', async () => {
    try {
      await level.change(1, []);
      throw new Error('Should have errored');
    } catch (error) {
      expect(error.message).to.contain('CID Mismatch');
    }
  });
});

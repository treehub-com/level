/* global describe, beforeEach, it */
const {expect} = require('chai');
const Memdown = require('memdown');
const uuid = require('uuid');
const Level = require('./Level.js');

let level;

describe('Client', () => {
  beforeEach(async () => {
    level = new Level({
      name: uuid(),
      backend: Memdown,
      mode: Level.CLIENT,
    });
    await level.open();
  });

  it('should open and close properly', async () => {
    await level.close();
  });

  it('should put/get with sync data properly', async () => {
    await level.put('foo', 'bar');

    const value = await level.get('foo');
    const meta = await level.get('!foo');

    expect(value).to.equal('bar');
    expect(meta).to.deep.equal(['foo', 'bar']);

    expect(level.CID).to.equal(0);
  });

  it('should del/get with sync data properly', async () => {
    await level.put('foo', 'bar');
    await level.del('foo');

    const value = await level.get('foo');
    const meta = await level.get('!foo');

    expect(value).to.equal(undefined);
    expect(meta).to.deep.equal(['foo']);

    expect(level.CID).to.equal(0);
  });

  it('should batch with sync data', async () => {
    await level.batch([
      {type: 'put', key: 'test', value: true},
      {type: 'put', key: 'foo', value: 'bar'},
      {type: 'del', key: 'test'},
    ]);

    // Test foo
    let value = await level.get('foo');
    let meta = await level.get('!foo');
    expect(value).to.equal('bar');
    expect(meta).to.deep.equal(['foo', 'bar']);

    // Test test
    value = await level.get('test');
    meta = await level.get('!test');
    expect(value).to.equal(undefined);
    expect(meta).to.deep.equal(['test']);

    expect(level.CID).to.equal(0);
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

  it('should apply server changes', async () => {
    await level.put('a', '1');
    await level.put('b', '2');
    await level.del('c');

    await level.apply(123, [
      ['b'],
      ['c', true],
    ]);

    const dirty = await level.dirty();
    expect(dirty).to.deep.equal([
      ['a', '1'],
    ]);

    const b = await level.get('b');
    expect(b).to.equal(undefined);

    const c = await level.get('c');
    expect(c).to.equal(true);

    const cid = await level.get('!');
    expect(cid).to.equal(123);
    expect(level.CID).to.equal(123);
  });

  it('should return dirty records', async () => {
    await level.put('a', '1');
    await level.put('b', '2');
    await level.put('c', '3');
    await level.del('c');

    let dirty = await level.dirty();
    expect(dirty).to.deep.equal([
      ['a', '1'],
      ['b', '2'],
      ['c'],
    ]);

    dirty = await level.dirty(1);
    expect(dirty).to.deep.equal([
      ['a', '1'],
    ]);
  });

  it('should clean records and set cid', async () => {
    await level.put('a', '1');
    await level.put('b', '2');
    await level.put('c', '3');

    await level.clean(123, ['a', 'b']);

    let meta = await level.get('!a');
    expect(meta).to.equal(undefined);
    meta = await level.get('!b');
    expect(meta).to.equal(undefined);
    meta = await level.get('!c');
    expect(meta).to.not.equal(undefined);

    const cid = await level.get('!');
    expect(cid).to.equal(123);
    expect(level.CID).to.equal(123);
  });
});

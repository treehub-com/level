/* global describe, beforeEach, it */
const {expect} = require('chai');
const Memdown = require('memdown');
const uuid = require('uuid');
const Level = require('./Level.js');

let level;

describe('Level', () => {
  beforeEach(async () => {
    level = new Level({name: uuid(), backend: Memdown});
    await level.open();
  });

  it('should open and close properly', async () => {
    await level.close();
  });

  it('should error on double open', async () => {
    try {
      await level.open();
    } catch (error) {
      expect(error.message).to.equal('db not closed');
    }
  });

  it('should error on closed when not open', async () => {
    await level.close();
    try {
      await level.close();
    } catch (error) {
      expect(error.message).to.equal('db not open');
    }
  });

  it('should put and get', async () => {
    await level.put('test', 'foo');
    const test = await level.get('test');
    expect(test).to.equal('foo');

    await level.put('obj', {foo: 'bar'});
    const obj = await level.get('obj');
    expect(obj).to.deep.equal({foo: 'bar'});
  });

  it('should resolve to undefined when not found', async () => {
    const test = await level.get('test');
    expect(test).to.equal(undefined);
  });

  it('should delete keys', async () => {
    await level.put('test', 'foo');
    let test = await level.get('test');
    expect(test).to.equal('foo');

    await level.del('test');
    test = await level.get('test');
    expect(test).to.equal(undefined);
  });

  it('should batch edit', async () => {
    await level.batch([
      {type: 'put', key: 'test', value: 'foo'},
      {type: 'put', key: 'obj', value: {foo: 'bar'}},
    ]);

    const test = await level.get('test');
    expect(test).to.equal('foo');

    const obj = await level.get('obj');
    expect(obj).to.deep.equal({foo: 'bar'});
  });

  it('should query properly', async () => {
    await level.put('1', 'a');
    await level.put('2', 'b');
    await level.put('3', 'c');
    await level.put('4', 'd');
    await level.put('5', 'e');

    let obj = await level.query();
    expect(obj).to.deep.equal([
      {key: '1', value: 'a'},
      {key: '2', value: 'b'},
      {key: '3', value: 'c'},
      {key: '4', value: 'd'},
      {key: '5', value: 'e'},
    ]);

    obj = await level.query({gte: '3', lt: '5'});
    expect(obj).to.deep.equal([
      {key: '3', value: 'c'},
      {key: '4', value: 'd'},
    ]);

    obj = await level.query({}, (key) => key == '2');
    expect(obj).to.deep.equal([
      {key: '2', value: 'b'},
    ]);
  });

  it('should return keys properly', async () => {
    await level.put('1', 'a');
    await level.put('2', 'b');
    await level.put('3', 'c');
    await level.put('4', 'd');
    await level.put('5', 'e');

    let obj = await level.keys();
    expect(obj).to.deep.equal(['1', '2', '3', '4', '5']);

    obj = await level.keys({gte: '3', lt: '5'});
    expect(obj).to.deep.equal(['3', '4']);

    obj = await level.keys({}, (key) => key == '2');
    expect(obj).to.deep.equal(['2']);
  });

  it('should return values properly', async () => {
    await level.put('1', 'a');
    await level.put('2', 'b');
    await level.put('3', 'c');
    await level.put('4', 'd');
    await level.put('5', 'e');

    let obj = await level.values();
    expect(obj).to.deep.equal(['a', 'b', 'c', 'd', 'e']);

    obj = await level.values({gte: '3', lt: '5'});
    expect(obj).to.deep.equal(['c', 'd']);

    obj = await level.values({}, (value) => value == 'b');
    expect(obj).to.deep.equal(['b']);
  });
});

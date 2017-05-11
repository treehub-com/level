const Base = require('./Base.js');

/**
 * A Client side Level Database.
 * @type {Client}
 */
class Client {
  /**
   * Construct LevelD
   *
   * @param  {String} name The name of the level database
   * @param  {LevelDOWN} backend A LevelDOWN compatible constructor
   * @param  {String} [prefix='!'}] The metadata prefix to use.
   *                                Don't change this :)
   */
  constructor({name, backend, prefix = '!'}) {
    this.base = new Base({name, backend});
    this.prefix = prefix;
    this._CID = null;
  }

  /**
   * The current Change ID
   */
  get CID() {
    return this._CID;
  }

  /**
   * Open the LevelD database
   *
   * @param  {Object}  [options={}] Options to pass to the LevelDOWN database
   */
  async open(options = {}) {
    await this.base.open(options);
    // Get CID
    this._CID = await this.base.get(this.prefix) || 0;
  }

  /**
   * Close the database
   */
  async close() {
    await this.base.close();
  }

  /**
   * Get a value
   * @param  {String} key The key
   * @return {Any}
   */
  get(key) {
    return this.base.get(key);
  }

  /**
   * Put a key/value
   * @param  {String} key The key
   * @param  {Any} value The value
   */
  async put(key, value) {
    await this.batch([{type: 'put', key, value}]);
  }

  /**
   * Delete a value
   * @param  {String} key The key
   */
  async del(key) {
    await this.batch([{type: 'del', key}]);
  }

  /**
   * Apply a batch of changes.
   * @param  {Object} array An array of changes
   */
  async batch(array) {
    const changes = [];

    for (let i = 1; i <= array.length; i++) {
      const elem = array[i-1];
      changes.push(elem);
      if (elem.type === 'put') {
        changes.push({
          type: 'put',
          key: `${this.prefix}${elem.key}`,
          value: [elem.key, elem.value],
        });
      } else {
        changes.push({
          type: 'put',
          key: `${this.prefix}${elem.key}`,
          value: [elem.key],
        });
      }
    }
    await this.base.batch(changes);
  }

  /**
   * Get a list of key/value objects
   * @param  {Object} [options={}] Level Query options
   * @param  {Function} [filter=null] A Level filter function
   * @return {Array<Object>}
   */
  query(options = {}, filter = null) {
    if (options.gt === undefined && options.gte === undefined) {
      options.gt = `${this.prefix}\uffff`;
    }
    return this.base.query(options, filter);
  }

  /**
   * Get a list of keys
   * @param  {Object} [options={}] Level Query options
   * @param  {Function} [filter=null] A Level filter function
   * @return {Array<String>}
   */
  keys(options = {}, filter = null) {
    if (options.gt === undefined && options.gte === undefined) {
      options.gt = `${this.prefix}\uffff`;
    }
    return this.base.keys(options, filter);
  }

  /**
   * Get a list of values
   * @param  {Object} [options={}] Level Query options
   * @param  {Function} [filter=null] A Level filter function
   * @return {Array<Any>}
   */
  values(options = {}, filter = null) {
    if (options.gt === undefined && options.gte === undefined) {
      options.gt = `${this.prefix}\uffff`;
    }
    return this.base.values(options, filter);
  }

  /**
   * Apply server changes to the client and update the CID
   *
   * @param  {Int} CID The last CID in the set of changes
   * @param  {Object} changes The changes from the server
   * @return {Promise<Int>} The new CID
   */
  async apply(CID, changes) {
    const batch = [{
      type: 'put',
      key: this.prefix,
      value: CID,
    }];

    for (const change of changes) {
      batch.push({
        type: 'del',
        key: `${this.prefix}${change[0]}`,
      });
      if (change.length === 1) {
        batch.push({
          type: 'del',
          key: change[0],
        });
      } else {
        batch.push({
          type: 'put',
          key: change[0],
          value: change[1],
        });
      }
    }

    await this.base.batch(batch);
    this._CID = CID;
    return CID;
  }

  /**
   * Get a list of changes from the client
   *
   * @param  {Int}  [limit=100] The limit
   * @return {Promise<Array>} The changes
   */
  async dirty(limit = 100) {
    return this.base.values({
      gt: this.prefix,
      lt: `${this.prefix}\uffff`,
      limit,
    });
  }

  /**
   * Mark a list of keys as clean and set the new CID
   *
   * @param  {Int} CID The new CID
   * @param  {Array<String>} keys The clean keys
   * @return {Promise<Int>} The new CID
   */
  async clean(CID, keys) {
    const changes = [];
    changes.push({
      type: 'put',
      key: `${this.prefix}`,
      value: CID,
    });

    for (const key of keys) {
      changes.push({
        type: 'del',
        key: `${this.prefix}${key}`,
      });
    }

    await this.base.batch(changes);
    this._CID = CID;
    return CID;
  }

}

module.exports = Client;

const Base = require('./Base.js');

/**
 * A Syncable Level database.
 * @type {LevelD}
 */
class Server {
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
    this._locked = false;
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
    if (this._locked) {
      throw new Error('Locked');
    }
    this._locked = true;

    try {
      const changes = [];

      for (let i = 1; i <= array.length; i++) {
        const elem = array[i-1];
        changes.push(elem);
        if (elem.type === 'put') {
          changes.push({
            type: 'put',
            key: `${this.prefix}${this._CID + i}`,
            value: [elem.key, elem.value],
          });
        } else {
          changes.push({
            type: 'put',
            key: `${this.prefix}${this._CID + i}`,
            value: [elem.key],
          });
        }
      }
      changes.push({
        type: 'put',
        key: this.prefix,
        value: this._CID + array.length,
      });
      await this.base.batch(changes);
      this._CID += array.length;
    } finally {
      this._locked = false;
    }
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
   * Get changes from the server AFTER CID
   *
   * @param  {Int} CID The CID to start after
   * @param  {Int} [limit=100] The limit
   * @return {Promise<Object>} The cid and the changes ){cid, changes}
   */
  async changes(CID, limit = 100) {
    // NOTE: We get keys and values to guard against missing CIDs
    // (which should never happen, but...)
    const data = await this.base.query({
      gt: `${this.prefix}${CID}`,
      lt: `${this.prefix}\uffff`,
      limit,
    });
    const changes = [];
    let cid = CID;
    for (const elem of data) {
      changes.push(elem.value);
    }
    if (data.length > 0) {
      cid = parseInt(data[data.length - 1].key.split(this.prefix)[1]);
    }

    return {cid, changes};
  }

  /**
   * Apply changes on the server and return the new CID
   *
   * @param  {Int} CID The current CID
   * @param  {Array} changes The changes
   * @return {Promise<Int>} The new CID
   */
  async change(CID, changes) {
    if (this._locked) {
      throw new Error('Locked');
    }
    this._locked = true;
    try {
      if (this._CID !== CID) {
        throw new Error('CID Mismatch');
      }
      const batch = [];
      batch.push({
        type: 'put',
        key: `${this.prefix}`,
        value: this._CID + changes.length,
      });

      for (let i = 1; i <= changes.length; i++) {
        const change = changes[i-1];
        if (change.length === 2) {
          batch.push({
            type: 'put',
            key: change[0],
            value: change[1],
          });
          batch.push({
            type: 'put',
            key: `${this.prefix}${this._CID + i}`,
            value: change,
          });
        } else {
          batch.push({
            type: 'del',
            key: change[0],
          });
          batch.push({
            type: 'put',
            key: `${this.prefix}${this._CID + i}`,
            value: change,
          });
        }
      }
      await this.base.batch(batch);
      this._CID += changes.length;
    } finally {
      this._locked = false;
    }
    return this._CID;
  }
}

module.exports = Server;

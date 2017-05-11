const Base = require('./Base.js');
const Client = require('./Client.js');
const Server = require('./Server.js');

/**
 * A Promise-based wrapper for LevelDOWN compatible constructors
 * @type {Level}
 */
class Level {
  /**
   * Construct Level
   *
   * @param  {String} name The name of the LevelDB database
   * @param  {LevelDOWN} backend A LevelDOWN compatble constructor
   * @param  {STRING} mode The database mode (SERVER || CLIENT)
   * @param  {String} [prefix='!'}] The metadata prefix to use.
   *                                Don't change this :)
   */
  constructor({name, backend, mode = Level.NORMAL, prefix = '!'}) {
    this.mode = mode;
    switch(mode) {
      case Level.CLIENT:
        this.level = new Client({name, backend, mode, prefix});
        break;
      case Level.SERVER:
        this.level = new Server({name, backend, mode, prefix});
        break;
      default:
        this.mode = Level.NORMAL; // Any other value defaults to normal
        this.level = new Base({name, backend});
    }
  }

  /**
   * Normal Mode
   * @type {String}
   */
  static get NORMAL() {
    return 'NORMAL';
  }

  /**
   * Client Mode
   * @type {String}
   */
  static get CLIENT() {
    return 'CLIENT';
  }

  /**
   * Server Mode
   * @type {String}
   */
  static get SERVER() {
    return 'SERVER';
  }

  /**
   * The current Change ID
   */
  get CID() {
    // TODO error in normal mode?
    return this.level.CID;
  }

  /**
   * Open the database
   *
   * @param  {Object} [options] Options to pass to open
   */
  async open(options = {}) {
    await this.level.open(options);
  }

  /**
   * Close the database
   */
  async close() {
    await this.level.close();
  }

  /**
   * Put a value to the database
   *
   * @param  {String} key The key
   * @param  {Any} value The value. Will be JSON stringified
   * @return {Promise}
   */
  put(key, value) {
    return this.level.put(key, value);
  }

  /**
   * Get a value from the database, or null if it does not exist
   *
   * @param  {String} key The key
   * @return {Promise<Any>} The JSON.parsed value
   */
  get(key) {
    return this.level.get(key);
  }

  /**
   * Delete a value from the database
   *
   * @param  {String} key The key
   * @return {Promise}
   */
  del(key) {
    return this.level.del(key);
  }

  /**
   * Perform a batch of operations.
   *
   * The format is [{type, key, value}, ...].
   * Type is put or del. Value is ignored for del.
   *
   * @param  {Array<Object>} array An array of operations
   * @return {Promise}
   */
  batch(array) {
    return this.level.batch(array);
  }

  /**
   * Query the database.
   *
   * @param  {Object} [options] The options to pass to LevelDOWN.
   *                            Options are described in https://github.com/Level/leveldown#leveldown_iterator
   * @param  {Function} [filter] A filter function.
   *                             Signature is (key, value) => boolean.
   *                             Return true to include the key/value pair.
   * @return {Promise<Array>} A list of objects {key, value}
   */
  query(options = {}, filter = null) {
    return this.level.query(options, filter);
  }

  /**
   * Get a list of keys from the database
   *
   * @param  {Object} [options] The options to pass to LevelDOWN
   *                            Options are described in https://github.com/Level/leveldown#leveldown_iterator
   * @param  {Function} [filter] A filter function.
   *                             Signature is (key) => boolean.
   *                             Return true to include the key.
   * @return {Promise<Array>} A list of keys
   */
  keys(options = {}, filter = null) {
    return this.level.keys(options, filter);
  }

  /**
   * Get a list of values from the database
   *
   * @param  {Object} [options] The options to pass to LevelDOWN
   *                            Options are described in https://github.com/Level/leveldown#leveldown_iterator
   * @param  {Function} [filter] A filter function.
   *                             Signature is (value) => boolean.
   *                             Return true to include the value.
   * @return {Promise<Array>} A list of values
   */
  values(options = {}, filter = null) {
    return this.level.values(options, filter);
  }

  /**
   * Apply server changes to the client and update the CID
   *
   * @param  {Int} CID The last CID in the set of changes
   * @param  {Object} changes The changes from the server
   * @return {Promise<Int>} The new CID
   */
  async apply(CID, changes) {
    if (this.mode !== Level.CLIENT) {
      throw new Error('Only Allowed in Client Mode');
    }
    return this.level.apply(CID, changes);
  }

  /**
   * Get a list of changes from the client
   *
   * @param  {Int}  [limit=100] The limit
   * @return {Promise<Array>} The changes
   */
  async dirty(limit = 100) {
    if (this.mode !== Level.CLIENT) {
      throw new Error('Only Allowed in Client Mode');
    }
    return this.level.dirty(limit);
  }

  /**
   * Mark a list of keys as clean and set the new CID
   *
   * @param  {Int} CID The new CID
   * @param  {Array<String>} keys The clean keys
   * @return {Promise<Int>} The new CID
   */
  async clean(CID, keys) {
    if (this.mode !== Level.CLIENT) {
      throw new Error('Only Allowed in Client Mode');
    }
    return this.level.clean(CID, keys);
  }

  /**
   * Get changes from the server AFTER CID
   *
   * @param  {Int} CID The CID to start after
   * @param  {Int} [limit=100] The limit
   * @return {Promise<Object>} The cid and the changes ){cid, changes}
   */
  async changes(CID, limit = 100) {
    if (this.mode !== Level.SERVER) {
      throw new Error('Only Allowed in Server Mode');
    }
    return this.level.changes(CID, limit);
  }

  /**
   * Apply changes on the server and return the new CID
   *
   * @param  {Int} CID The current CID
   * @param  {Array} changes The changes
   * @return {Promise<Int>} The new CID
   */
  async change(CID, changes) {
    if (this.mode !== Level.SERVER) {
      throw new Error('Only Allowed in Server Mode');
    }
    return this.level.change(CID, changes);
  }
}

module.exports = Level;

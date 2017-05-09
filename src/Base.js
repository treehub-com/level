/**
 * A Promise-based wrapper for LevelDOWN compatible constructors
 * @type {Base}
 */
class Base {
  /**
   * Construct Level
   *
   * @param  {String} name The name of the LevelDB database
   * @param  {LevelDOWN} backend A LevelDOWN compatble constructor
   */
  constructor({name, backend}) {
    this.db = backend(name);
    this._state = 'closed'; // opening, opened, closing, closed
  }

  /**
   * Open the database
   *
   * @param  {Object} [options] Options to pass to open
   * @return {Promise}
   */
  open(options = {}) {
    if (this._state !== 'closed') {
      return Promise.reject(new Error('db not closed'));
    }
    this._state = 'opening';
    return new Promise((resolve, reject) => {
      this.db.open(options, (error) => {
        if (error) {
          this._state = 'closed';
          reject(error);
        } else {
          this._state = 'opened';
          resolve();
        }
      });
    });
  }

  /**
   * Close the database
   *
   * @return {Promise}
   */
  close() {
    if (this._state !== 'opened') {
      return Promise.reject(new Error('db not open'));
    }
    this._state = 'closing';
    return new Promise((resolve, reject) => {
      this.db.close((error) => {
        if (error) {
          this._state = 'opened';
          reject(error);
        } else {
          this._state = 'closed';
          resolve();
        }
      });
    });
  }

  /**
   * Put a value to the database
   *
   * @param  {String} key The key
   * @param  {Any} value The value. Will be JSON stringified
   * @return {Promise}
   */
  put(key, value) {
    return new Promise((resolve, reject) => {
      this.db.put(key, JSON.stringify(value), (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Get a value from the database, or null if it does not exist
   *
   * @param  {String} key The key
   * @return {Promise<Any>} The JSON.parsed value
   */
  get(key) {
    return new Promise((resolve, reject) => {
      this.db.get(key, (error, value) => {
        if (error) {
          if ((/notfound/i).test(error)) {
            resolve();
          } else {
            reject(error);
          }
        } else {
          resolve(JSON.parse(value));
        }
      });
    });
  }

  /**
   * Delete a value from the database
   *
   * @param  {String} key The key
   * @return {Promise}
   */
  del(key) {
    return new Promise((resolve, reject) => {
      this.db.del(key, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
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
    // Serialize values
    for (const elem of array) {
      if (elem.type === 'put') {
        elem.value = JSON.stringify(elem.value);
      }
    }
    return new Promise((resolve, reject) => {
      this.db.batch(array, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
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
    return new Promise((resolve, reject) => {
      const results = [];
      const opts = Object.assign({
        keyAsBuffer: false,
        valueAsBuffer: false,
      }, options);

      const itr = this.db.iterator(opts);
      const cb = (error, key, val) => {
        if (error) {
          return itr.end(() => {
            reject(error);
          });
        }
        if (!key) {
          return itr.end((error) => {
            if (error) {
              reject(error);
            } else {
              resolve(results);
            }
          });
        }
        const value = JSON.parse(val);
        if (filter === null || filter(key, value)) {
          results.push({key, value});
        }
        itr.next(cb);
      };

      itr.next(cb);
    });
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
    return new Promise((resolve, reject) => {
      const results = [];
      const opts = Object.assign({
        values: false,
        keyAsBuffer: false,
        valueAsBuffer: false,
      }, options);

      const itr = this.db.iterator(opts);
      const cb = (error, key, val) => {
        if (error) {
          return itr.end(() => {
            reject(error);
          });
        }
        if (!key) {
          return itr.end((error) => {
            if (error) {
              reject(error);
            } else {
              resolve(results);
            }
          });
        }
        if (filter === null || filter(key)) {
          results.push(key);
        }
        itr.next(cb);
      };

      itr.next(cb);
    });
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
    return new Promise((resolve, reject) => {
      const results = [];
      const opts = Object.assign({
        keys: false,
        keyAsBuffer: false,
        valueAsBuffer: false,
      }, options);

      const itr = this.db.iterator(opts);
      const cb = (error, key, val) => {
        if (error) {
          return itr.end(() => {
            reject(error);
          });
        }
        if (!val) {
          return itr.end((error) => {
            if (error) {
              reject(error);
            } else {
              resolve(results);
            }
          });
        }
        const value = JSON.parse(val);
        if (filter === null || filter(value)) {
          results.push(value);
        }
        itr.next(cb);
      };

      itr.next(cb);
    });
  }
}

module.exports = Base;

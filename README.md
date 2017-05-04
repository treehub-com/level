# @treehub/level
A Promise based wrapper for LevelDOWN compatible databases.

## Install

`npm install @treehub/level`

## Usage

````javascript

// Create and open the database
const level = new Level({name: 'testing', backend: MemDOWN});
await level.open();

// Put foo, obj, and deleteMe
await level.put('foo', 'bar');
await level.put('obj', {foo: 'bar'});
await level.put('deleteMe', 'Never!');

// Put bool and array, delete deleteMe
await level.batch([
  {type: 'put', key: 'bool', value: true},
  {type: 'put', key: 'array', value: [1,2,3,4]},
  {type: 'del', key: 'deleteMe'},
]);

// Get foo. Will be 'bar'
const foo = await level.get('foo');

// Get obj. Will be {foo: 'bar'}
const foo = await level.get('obj');

// Get deleteMe. Will be undefined
const deleteMe = await level.get('deleteMe');

// Get all values greater than baz
const data = await level.query({gt: 'baz'});

// Get all of the keys that match a regex
const keys = await level.keys({}, (key) => /world/.test(key));

// Get all of the values that are objects
const objects = await level.values({}, (value) => typeof value === 'object');

// Close the database
await level.close();
````

## Testing

`npm test`

## License
[MIT](LICENSE)

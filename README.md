# @treehub/level
A Syncable Promise based wrapper for LevelDOWN compatible databases.

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

## Sync

````javascript
const server = new Level({name: 'server', backend: MemDOWN, mode: Level.SERVER});
await server.open();

...

const client = new Level({name: 'server', backend: MemDOWN, mode: Level.CLIENT});
await client.open();

...

Perform some changes on the server and client

...

const serverChanges = await server.changes(client.CID);
...
await client.apply(serverChanges);
const clientChanges = await client.dirty();
const clientKeys = [];
for (const change of clientChanges) {
  clientKeys.push(change.key);
}
...
const serverCID = await server.change(client.CID, clientChanges);
...
await client.clean(serverCID, clientKeys);
````

## Testing

`npm test`

## Sync Design
All metadata is kept in a prefixed namespace (typically `!`). Do NOT use keys smaller than the prefix (in unicode order) to avoid pulling in the sync metadata in queries.

A server always wins on conflict is implemented. Try to keep the database as append-only/insert-only

## Server Mode
The current CID (Change Id) is kept as the value of `!`.
Server Changes are kept as `!<CID>` => `[<key>,<value>]` for put and `[<key>]` for del


## Client Mode
The last synced CID (Change Id) is kept as the value of `!`.
Client Changes are kept as `!<key>` => `[<key>,<value>]` for put and `[<key>]` for del

## Sync

1. Client gets the last synced CID and asks the Server for all Changes after the CID. (May happen in batches of N until complete)
    For each batch of changes the Client (done in one large batch):
    1. Puts/Deletes the change
    1. Deletes any Dirty Changes for those keys (resolving any conflict, server wins)
    1. Updates the CID
1. Client gets all Dirty Changes and sends them to the Server along with the current CID
    For each set of change the Server (done in one large batch)
    1. Ensures the passed in CID and the current CID match
    1. Makes the Puts/Deletes
    1. Increments the CID
    1. Stores the new Server Changes
    1. Returns the new CID
    When server responds successfully, the Client (done in one large batch)
    1. Deletes any Dirty Change for those keys
    1. Updates the CID to the returned value

## Inspiration
Inspired in part by [this](http://havrl.blogspot.in/2013/08/synchronization-algorithm-for.html?m=1)

## License
[MIT](LICENSE)

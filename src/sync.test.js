/* global describe, beforeEach, it */
const {expect} = require('chai');
const Memdown = require('memdown');
const uuid = require('uuid');
const Level = require('./Level.js');

let server;
let client1;
let client2;

// eslint-disable-next-line require-jsdoc
async function performSync(server, client) {
  const serverChanges = await server.changes(client.CID);
  await client.apply(serverChanges.cid, serverChanges.changes);
  const clientChanges = await client.dirty();
  const clientKeys = [];
  for (const change of clientChanges) {
    clientKeys.push(change[0]);
  }
  const serverCID = await server.change(client.CID, clientChanges);
  await client.clean(serverCID, clientKeys);
}

describe('Sync', () => {
  beforeEach(async () => {
    server = new Level({
      name: uuid(),
      backend: Memdown,
      mode: Level.SERVER,
    });
    await server.open();
    client1 = new Level({
      name: uuid(),
      backend: Memdown,
      mode: Level.CLIENT,
    });
    await client1.open();
    client2 = new Level({
      name: uuid(),
      backend: Memdown,
      mode: Level.CLIENT,
    });
    await client2.open();
  });

  it('should sync between clients', async () => {
    let serverData;
    let client1Data;
    let client2Data;

    await server.put('s1', true);
    await client1.put('c1', 'bar');

    // Sync client1 with the server
    await performSync(server, client1);
    serverData = await server.query();
    client1Data = await client1.query();
    expect(serverData).to.deep.equal(client1Data);
    expect(server.CID).to.equal(client1.CID);

    // Sync client2 with the server
    await performSync(server, client2);
    serverData = await server.query();
    client2Data = await client2.query();
    expect(serverData).to.deep.equal(client2Data);
    expect(server.CID).to.equal(client2.CID);

    // Ensure client1 and client2 match
    client1Data = await client1.query();
    client2Data = await client2.query();
    expect(client1Data).to.deep.equal(client2Data);
    expect(client1.CID).to.equal(client2.CID);

    await server.del('s1');
    await server.put('s2', 'bar');
    await client2.put('c2', 'foo');

    // Sync client1 with the server
    await performSync(server, client1);
    serverData = await server.query();
    client1Data = await client1.query();
    expect(serverData).to.deep.equal(client1Data);
    expect(server.CID).to.equal(client1.CID);

    // Sync client2 with the server
    await performSync(server, client2);
    serverData = await server.query();
    client2Data = await client2.query();
    expect(serverData).to.deep.equal(client2Data);
    expect(server.CID).to.equal(client2.CID);

    // Sync client1 with the server
    await performSync(server, client1);
    serverData = await server.query();
    client1Data = await client1.query();
    expect(serverData).to.deep.equal(client1Data);
    expect(server.CID).to.equal(client1.CID);

    // Ensure client1 and client2 match
    client1Data = await client1.query();
    client2Data = await client2.query();
    expect(client1Data).to.deep.equal(client2Data);
    expect(client1.CID).to.equal(client2.CID);
  });

  it('should overwrite client changes with server changes', async () => {
    let serverData;
    let client1Data;
    let client2Data;

    await server.put('s1', true);

    // Sync client1 with the server
    await performSync(server, client1);
    serverData = await server.query();
    client1Data = await client1.query();
    expect(serverData).to.deep.equal(client1Data);
    expect(server.CID).to.equal(client1.CID);

    // Sync client2 with the server
    await performSync(server, client2);
    serverData = await server.query();
    client2Data = await client2.query();
    expect(serverData).to.deep.equal(client2Data);
    expect(server.CID).to.equal(client2.CID);

    // Ensure client1 and client2 match
    client1Data = await client1.query();
    client2Data = await client2.query();
    expect(client1Data).to.deep.equal(client2Data);
    expect(client1.CID).to.equal(client2.CID);

    await client1.put('s1', 'Client1');
    await client2.put('s1', 'Client2');

    // Sync client1 with the server
    await performSync(server, client1);
    serverData = await server.query();
    client1Data = await client1.query();
    expect(serverData).to.deep.equal(client1Data);
    expect(server.CID).to.equal(client1.CID);

    // Sync client2 with the server
    await performSync(server, client2);
    serverData = await server.query();
    client2Data = await client2.query();
    expect(serverData).to.deep.equal(client2Data);
    expect(server.CID).to.equal(client2.CID);

    // Ensure client1 and client2 match
    client1Data = await client1.query();
    client2Data = await client2.query();
    expect(client1Data).to.deep.equal(client2Data);
    expect(client1.CID).to.equal(client2.CID);

    // Ensure s1 is Client1
    const s1 = await client1.get('s1');
    expect(s1).to.equal('Client1');
  });
});

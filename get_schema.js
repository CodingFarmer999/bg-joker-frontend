import pg from 'pg'
const { Client } = pg
const client = new Client({ user: 'yaochilee', host: 'localhost', database: 'postgres', port: 5432 })

async function run() {
  await client.connect()
  const res = await client.query(`
    select conname, pg_get_constraintdef(c.oid)
    from pg_constraint c
    join pg_namespace n on n.oid = c.connamespace
    where conrelid = 'joker.user_device_tokens'::regclass;
  `)
  console.log(res.rows)

  // Query actual sequence ID to see if it failed inserts.
  const seq = await client.query("SELECT last_value FROM joker.user_device_tokens_id_seq;")
  console.log(seq.rows)
  await client.end()
}
run()

import fetch from 'node-fetch'
import pg from 'pg'
const { Client } = pg

async function run() {
  const client = new Client({ user: 'yaochilee', host: 'localhost', database: 'postgres', port: 5432 })
  await client.connect()
  const users = await client.query("SELECT * FROM joker.users WHERE id = 3")
  const user3 = users.rows[0]

  console.log("Found User 3:", user3.username)

  const res = await fetch('http://localhost:8080/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ username: user3.username, password: '111' }) // assuming some password, wait, what password? 
  })
}
run()

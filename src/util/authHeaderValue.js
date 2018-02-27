export default function authHeaderValue(username, password) {
  const encodedAuth = new Buffer(`${username}:${password}`).toString('base64')
  return `Basic ${encodedAuth}`
}
export default function authHeaderValue(username, password) {
  return `Basic ${username}:${password}`;
}
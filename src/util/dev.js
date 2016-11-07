
// devMsg is a developer message, not intended for the end user
export function exception(devMsg) {
  // TODO: find a way to pop the top frame off this trace
  return {'devMsg': `${devMsg}`, 'stack': new Error().stack};
}

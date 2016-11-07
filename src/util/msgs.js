// tries to guarantee well-formed user presentable messages
export function userError(segment, fieldName, msg) {
  return {'msg': `${msg}`, 'segment': `${segment}`, 'field': `${fieldName}`};
}

// important that the value can by any type
// input is the original input; value is always set even if it's just a copy of the input
export function validationResult(obj) {
  const {errorMsg, notificationMsg, segment, fieldName, input, value} = obj;

  return {'isError': () => { return !!errorMsg }, 'errorMsg': errorMsg, 'notificationMsg': notificationMsg, 'segment': `${segment}`, 'fieldName': `${fieldName}`, 'input': input, 'value': (value === undefined ? input : value)};
}

export function error(response, msg) {
  return {'response': response, 'msg': msg};
}

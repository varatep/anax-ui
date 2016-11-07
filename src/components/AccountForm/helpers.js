import * as validator from '../../util/validation';
import * as note from '../../util/notificationManagement';
import {fieldSplit} from '../../util/names';

export function doValidation(segment, fieldName, text) {
  // could chain multiple validators, all that's required is we return a promise; could do more inbetween if desired
  switch (fieldName) {
    case 'email':
      return validator.validEmail(segment, fieldName, text);
    case 'username':
      return validator.validText(segment, fieldName, text);
    case 'devicename':
      return validator.validText(segment, fieldName, text);
    default:
      console.log('noop validation / type coercion for fieldName', fieldName);
      return validator.noop(segment, fieldName, text);
  }
}

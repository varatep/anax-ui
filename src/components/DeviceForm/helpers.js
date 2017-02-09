import * as validator from '../../util/validation';
import * as note from '../../util/notificationManagement';
import {fieldSplit} from '../../util/names';

export function doValidation(segment, fieldName, text) {
  // could chain multiple validators, all that's required is we return a promise; could do more inbetween if desired
  switch (fieldName) {
    case 'latitude':
      return validator.validCoord(segment, fieldName, text, -90, 90);
    case 'longitude':
      return validator.validCoord(segment, fieldName, text, -180, 180);
    default:
      console.log('noop validation / type coercion for fieldName', fieldName);
      return validator.noop(segment, fieldName, text);
  }
}

export function referrerDomain() {
  const reg = /https?:\/\/([^:\/]+)(:\d+)?/g;
  const match = reg.exec(window.location.href);

  if (match === null || match.length < 2) {
    console.log('failed to determine referrer domain, got', match);
    return '{hostname}';
  } else {
    return match[1];
  }
}

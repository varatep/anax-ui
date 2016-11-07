import * as msgs from './msgs';

const RE_INPUT_CHAR_ILLEGAL = /[^-() _\w\d.@,:/\\]/g;

const RE_COORD_CHAR_REQUIRED = /^-?\d+[\d.]*(?!\.)$/;

const RE_EMAIL_VALID = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

const RE_HOSTNAME_VALID = /^(([-\w\d])+.){3}([-\w\d])+$/;

// N.B.: These are not only for validation but do type coercion / conversion too

export function validCoord(segment, field, input, min, max) {
  return new Promise((resolve, reject) => {
    const matches = input.match(RE_COORD_CHAR_REQUIRED);

    if (matches !== null) {
      const num = parseFloat(matches[0]);
      if (num !== Number.NaN && num >= min && num <= max) {
        resolve(msgs.validationResult({segment: segment, fieldName: field, input: input, value: num}));
      }
    }
    resolve(msgs.validationResult({segment: segment, fieldName: field, input: input, value: null, errorMsg: `Invalid coordinate. A valid value is in the range (${min},${max}).`}));
  });
}

export function validText(segment, field, input) {
  return new Promise((resolve, reject) => {
    if (input && input.match(RE_INPUT_CHAR_ILLEGAL) === null) {
      resolve(msgs.validationResult({segment: segment, fieldName: field, input: input}));
    } else {
      resolve(msgs.validationResult({segment: segment, fieldName: field, input: input, errorMsg: 'Illegal character in input.'}));
    }
  });
}

export function validEmail(segment, field, input) {
  return new Promise((resolve, reject) => {
    if (input.match(RE_EMAIL_VALID) !== null) {
      resolve(msgs.validationResult({segment: segment, fieldName: field, input: input}));
    } else {
      resolve(msgs.validationResult({segment: segment, fieldName: field, input: input, errorMsg: 'Invalid email.'}));
    }
  });
}

export function validHostname(segment, field, input, reqDomain = '') {
  return new Promise((resolve, reject) => {

		if (input) {
      const matches = input.match(RE_HOSTNAME_VALID);
      if (matches !== null && matches.length > 1 && (reqDomain === '' || matches[matches.length-1] === reqDomain)) {
        resolve(msgs.validationResult({segment: segment, fieldName: field, input: input}));
			}
		}

    resolve(msgs.validationResult({segment: segment, fieldName: field, input: input, errorMsg: 'Invalid hostname.'}));
  });
}

export function validNonNull(segment, field, input) {
  return new Promise((resolve, reject) => {
    if (input !== null || input !== undefined || input !== "") {
      resolve(msgs.validationResult({segment: segment, fieldName: field, input: input}));
    } else {
      resolve(msgs.validationResult({segment: segment, fieldName: field, input: input, errorMsg: 'Missing required input.'}));
    }
  });
}

export function noop(segment, field, input) {
  return new Promise((resolve, reject) => {
    resolve(msgs.validationResult({segment: segment, fieldName: field, input: input}));
  });
}

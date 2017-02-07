
export function normalize(url) {
  if (url.endsWith('/')) {
    return url.substring(0, url.length-1);
  } else {
    return url;
  }
}

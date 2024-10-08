/* Copyright (c) 2017 Environmental Systems Research Institute, Inc.
 * Apache-2.0 */
var DEFAULT_VERSION = "4.17";
var NEXT = "next";
export function parseVersion(version) {
  if (version.toLowerCase() === NEXT) {
    return NEXT;
  }
  var match = version && version.match(/^(\d)\.(\d+)/);
  return (
    match && {
      major: parseInt(match[1], 10),
      minor: parseInt(match[2], 10),
    }
  );
}
/**
 * Get the CDN url for a given version
 *
 * @param version Ex: '4.17' or '3.34'. Defaults to the latest 4.x version.
 */
export function getCdnUrl(version) {
  if (version === void 0) {
    version = DEFAULT_VERSION;
  }
  return "https://js.arcgis.com/" + version; // MODIFIED
}
/**
 * Get the CDN url for a the CSS for a given version and/or theme
 *
 * @param version Ex: '4.17', '3.34', or 'next'. Defaults to the latest 4.x version.
 */
export function getCdnCssUrl(version) {
  if (version === void 0) {
    version = DEFAULT_VERSION;
  }
  var baseUrl = getCdnUrl(version);
  var parsedVersion = parseVersion(version);
  if (parsedVersion !== NEXT && parsedVersion.major === 3) {
    // NOTE: at 3.11 the CSS moved from the /js folder to the root
    var path = parsedVersion.minor <= 10 ? "js/" : "";
    return "" + baseUrl + path + "/esri/css/esri.css"; // MODIFIED
  } else {
    // assume 4.x
    return baseUrl + "/esri/themes/light/main.css"; // MODIFIED
  }
}

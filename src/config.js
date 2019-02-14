export default {
  MIN_DESKTOP_WIDTH: 768,
  WEB_MERCATOR_WKID: 3857,
  MARKER_FILL_COLOR: [130, 65, 47, 0.5],
  MARKER_OUTLINE_COLOR: [230, 126, 21, 0.7],
  MAP_SERVICE_OPACITY: 0.8,
  PROPOSED_LAYER_IDS: [1, 3, 6, 9, 12, 15, 18],
  urls: {
    WEBAPI: 'https://api.mapserv.utah.gov/api/v1/search',
    MAP_SERVICE: `${document.location.protocol}//${document.location.hostname}/arcgis/rest/services/Vista/MapServer`
  },
  featureClassNames: {
    ZIP: 'SGID10.Boundaries.ZipCodes',
    VISTA_BALLOT_AREAS: 'SGID10.Political.VistaBallotAreas',
    VISTA_BALLOT_AREAS_PROPOSED: 'SGID10.Political.VistaBallotAreas_Proposed',
    COUNTIES: 'SGID10.Boundaries.Counties',
    UTAH_HOUSE: 'SGID10.Political.UtahHouseDistricts2012',
    UTAH_SENATE: 'SGID10.Political.UtahSenateDistricts2012',
    US_CONGRESS: 'SGID10.Political.USCongressDistricts2012'
  },
  fieldNames: {
    ZIP5: 'ZIP5',
    PrecinctID: 'PrecinctID',
    CountyID: 'CountyID',
    COUNTYNBR: 'COUNTYNBR',
    DIST: 'DIST',
    DISTRICT: 'DISTRICT'
  },
  symbols: {
    IDENTIFY: {
      type: 'simple-marker',
      size: 11,
      color: [255, 255, 0, 0.75],
      outline: {
        color: 'black',
        width: 1
      }
    }
  }
}

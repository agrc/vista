export default {
  MIN_DESKTOP_WIDTH: 768,
  WEB_MERCATOR_WKID: 3857,
  UTM_WKID: 26912,
  WEB_MERCATOR_WKT: 'EPSG:3857',
  UTM_WKT: 'PROJCS["NAD83 / UTM zone 12N",GEOGCS["NAD83",DATUM["North_American_Datum_1983",SPHEROID["GRS 1980",6378137,298.257222101,AUTHORITY["EPSG","7019"]],TOWGS84[0,0,0,0,0,0,0],AUTHORITY["EPSG","6269"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4269"]],PROJECTION["Transverse_Mercator"],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",-111],PARAMETER["scale_factor",0.9996],PARAMETER["false_easting",500000],PARAMETER["false_northing",0],UNIT["metre",1,AUTHORITY["EPSG","9001"]],AXIS["Easting",EAST],AXIS["Northing",NORTH],AUTHORITY["EPSG","26912"]]',
  MARKER_FILL_COLOR: [130, 65, 47, 0.5],
  MARKER_OUTLINE_COLOR: [230, 126, 21, 0.7],
  MAP_SERVICE_OPACITY: 0.8,
  PROPOSED_LAYER_IDS: [2, 5, 8, 11, 14, 17],
  urls: {
    WEBAPI: 'https://api.mapserv.utah.gov/api/v1/search',
    MAP_SERVICE: `${document.location.protocol}//${document.location.hostname}/arcgis/rest/services/Vista/MapServer`,
    VISTA_SERVICE: 'https://vistaservice.utah.gov/Residence/GetResidencesInfoFromQueries/'
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
    VistaID: 'VistaID',
    CountyID: 'CountyID',
    COUNTYNBR: 'COUNTYNBR',
    DIST: 'DIST',
    DISTRICT: 'DISTRICT',
    Address: 'Address',
    ResidenceID: 'ResidenceID'
  },
  symbols: {
    IDENTIFY: {
      type: 'simple-marker',
      size: 12,
      color: [255, 255, 0, 0.75]
    },
    RESIDENCE: {
      type: 'simple-marker',
      size: 10,
      color: 'white'
    },
    HIGHLIGHT: {
      type: 'simple-marker',
      size: 10,
      color: 'red'
    },
    CURRENT: {
      type: 'simple-marker',
      size: 12,
      color: [0, 0, 255, 0.75],
      outline: {
        color: 'white'
      }
    }
  }
}

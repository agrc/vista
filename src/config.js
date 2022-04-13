const OPACITY = 0.75;
export default {
  MIN_DESKTOP_WIDTH: 768,
  WEB_MERCATOR_WKID: 3857,
  UTM_WKID: 26912,
  WEB_MERCATOR_WKT: 'EPSG:3857',
  UTM_WKT: 'PROJCS["NAD83 / UTM zone 12N",GEOGCS["NAD83",DATUM["North_American_Datum_1983",SPHEROID["GRS 1980",6378137,298.257222101,AUTHORITY["EPSG","7019"]],TOWGS84[0,0,0,0,0,0,0],AUTHORITY["EPSG","6269"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4269"]],PROJECTION["Transverse_Mercator"],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",-111],PARAMETER["scale_factor",0.9996],PARAMETER["false_easting",500000],PARAMETER["false_northing",0],UNIT["metre",1,AUTHORITY["EPSG","9001"]],AXIS["Easting",EAST],AXIS["Northing",NORTH],AUTHORITY["EPSG","26912"]]',
  MARKER_FILL_COLOR: [130, 65, 47, 0.5],
  MARKER_OUTLINE_COLOR: [230, 126, 21, 0.7],
  LABELS_MIN_SCALE: 5000,
  GRID_MIN_SCALE: 100000,
  GRID_COLOR: [165, 83, 183, 255],
  ESRI_LOADER_OPTIONS: { version: '4.10' },
  urls: {
    WEBAPI: 'https://api.mapserv.utah.gov/api/v1/search',
    MAP_SERVICE: `${process.env.REACT_APP_GIS_SERVER}/arcgis/rest/services/Vista/MapServer`,
    VISTA_SERVICE: 'https://vistaservice.utah.gov/Residence/GetResidencesInfoFromQueries/',
    ADDRESS_POINTS: 'https://services1.arcgis.com/99lidPhWCzftIe9K/arcgis/rest/services/UtahAddressPoints/FeatureServer/0',
    ROADS: 'https://services1.arcgis.com/99lidPhWCzftIe9K/arcgis/rest/services/UtahRoads/FeatureServer/0',
    PARCELS: 'http://tiles.arcgis.com/tiles/99lidPhWCzftIe9K/arcgis/rest/services/StatewideParcels/VectorTileServer',
    SANPETE_ADDRESS_GRID: 'https://services8.arcgis.com/4HViMZMD64noZWcJ/ArcGIS/rest/services/Sanpete_Addrss_Grid/FeatureServer/1'
  },
  featureClassNames: {
    ZIP: 'boundaries.zip_code_areas',
    VISTA_BALLOT_AREAS: 'political.vista_ballot_areas',
    VISTA_BALLOT_AREAS_PROPOSED: 'political.vista_ballot_areas_proposed',
    COUNTIES: 'boundaries.county_boundaries',
    UTAH_HOUSE: 'political.house_districts_2022_to_2032',
    UTAH_SENATE: 'political.senate_districts_2022_to_2032',
    US_CONGRESS: 'political.us_congress_districts_2022_to_2032',
  },
  fieldNames: {
    ZIP5: 'ZIP5',
    VistaID: 'VistaID',
    CountyID: 'CountyID',
    COUNTYNBR: 'COUNTYNBR',
    DIST: 'DIST',
    DISTRICT: 'DISTRICT',
    Address: 'Address',
    ResidenceID: 'ResidenceID',
    AddNum: 'AddNum', // address points
    FULLNAME: 'FULLNAME' // roads
  },
  symbols: {
    IDENTIFY: {
      type: 'simple-marker',
      size: 12,
      color: [255, 255, 0, OPACITY]
    },
    RESIDENCE: {
      type: 'simple-marker',
      size: 10,
      color: [255, 255, 255, OPACITY]
    },
    HIGHLIGHT: {
      type: 'simple-marker',
      size: 10,
      color: 'red'
    },
    CURRENT: {
      type: 'simple-marker',
      size: 12,
      color: [0, 0, 255, OPACITY],
      outline: {
        color: [255, 255, 255, OPACITY]
      }
    }
  }
}

define([
    'dojo/has',
    'dojo/request/xhr'
], function (
    has,
    xhr
) {
    var apiKey;
    var quadWord;
    if (has('agrc-build') === 'prod') {
        // mapserv.utah.gov
        apiKey = 'AGRC-1B07B497348512';
        // mapserv.utah.gov
        quadWord = 'alfred-plaster-crystal-dexter';
    } else if (has('agrc-build') === 'stage') {
        // test.mapserv.utah.gov
        apiKey = 'AGRC-AC122FA9671436';
        quadWord = 'opera-event-little-pinball';
    } else {
        // localhost
        xhr(require.baseUrl + 'secrets.json', {
            handleAs: 'json',
            sync: true
        }).then(function (secrets) {
            quadWord = secrets.quadWord;
            apiKey = secrets.apiKey;
        }, function () {
            throw 'Error getting secrets!';
        });
    }
    return {
        // utm12wkt: String
        //      The well known text for utm zone 12 nad83 for use with proj4
        wkt26912: 'PROJCS["NAD83 / UTM zone 12N",GEOGCS["NAD83",DATUM["North_American_Datum_1983",SPHEROID["GRS 1980",6378137,298.257222101,AUTHORITY["EPSG","7019"]],AUTHORITY["EPSG","6269"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4269"]],UNIT["metre",1,AUTHORITY["EPSG","9001"]],PROJECTION["Transverse_Mercator"],PARAMETER["latitude_of_origin",0],PARAMETER["central_meridian",-111],PARAMETER["scale_factor",0.9996],PARAMETER["false_easting",500000],PARAMETER["false_northing",0],AUTHORITY["EPSG","26912"],AXIS["Easting",EAST],AXIS["Northing",NORTH]]',

        // wkt3857: String
        //      The well known text for wgs 84 for use with proj4
        wkt3857: 'PROJCS["WGS_1984_Web_Mercator_Auxiliary_Sphere",GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Mercator_Auxiliary_Sphere"],PARAMETER["False_Easting",0.0],PARAMETER["False_Northing",0.0],PARAMETER["Central_Meridian",0.0],PARAMETER["Standard_Parallel_1",0.0],PARAMETER["Auxiliary_Sphere_Type",0.0],UNIT["Meter",1.0]]',

        apiKey: apiKey,
        quadWord: quadWord,
        map: null, // map reference
        iParams: null, // identify parameters
        iTask: null, // identify task
        urlParams: {
            currentX: 'currentX',
            currentY: 'currentY',
            precinct: 'precinct',
            districts: 'districts',
            db: 'db',
            query: 'query',
            map: 'map',
            zip: 'zip',
            precinctID: 'precinctID',
            county: 'county'
        },
        fields: {
            PrecinctID: 'VistaID',
            DIST: 'DIST',
            DISTRICT: 'DISTRICT',
            ZIP5: 'ZIP5',
            CountyID: 'CountyID',
            ResidenceID: 'ResidenceID',
            Address: 'Address',
            COUNTYNBR: 'COUNTYNBR'
        },
        districts: true, // show the political districts
        precinct: true, // show precinct
        identifySymbol: null, // point symbol used when user clicks on the map
        currentSymbol: null, // point symbol used for the current address
        vistaSymbol: null, // point symbol used for vista graphics
        highlightedVistaSymbol: null, // point symbol used to highlight the vista graphics on mouse over
        identifyGraphicsLayer: null, // the graphics layer holding returned point from the identify query
        havaMapServiceUrl: '/ArcGIS/rest/services/Vista/MapServer',
        vistaWebServiceUrl: 'http://vistaservice.utah.gov/Residence/GetResidencesInfoFromQueries/',
        lastGraphic: null, // the last graphic that was clicked on
        windowHeight: null, // the height of the infoWindow for the identify results
        precinctLyrIndex: 6, // used in onIdentifyComplete - needs to be switch to 7 if map=p
        houseLyrIndex: 0,
        senateLyrIndex: 1,
        usCongressLyrIndex: 2,
        zipLyrIndex: 3,
        countyLyrIndex: 4,
        proposedPrecinctLyrs: [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 37, 39, 41, 43, 45],
        precinctLyrs: [6, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 38, 40, 42, 44]
    };
});

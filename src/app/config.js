define([

], function (

) {
    return {
        map: null, // map reference
        iParams: null, // identify parameters
        iTask: null, // identify task
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

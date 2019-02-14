/* eslint-disable */
var g = {
    map: null, // map reference
    iParams: null, // identify parameters
    iTask: null, // identify task
    fields: {
        PrecinctID: 'VistaID',
        DIST: 'DIST',
        DISTRICT: 'DISTRICT',
        ZIP5: 'ZIP5',
        CountyID: 'CountyID',
        ResidenceID: "ResidenceID",
        Address: "Address",
        COUNTYNBR: "COUNTYNBR"
    },
    districts: true, // show the political districts
    precinct: true, // show precinct
    identifySymbol: null, // point symbol used when user clicks on the map
    currentSymbol: null, // point symbol used for the current address
    vistaSymbol: null, // point symbol used for vista graphics
    highlightedVistaSymbol: null, // point symbol used to highlight the vista graphics on mouse over
    identifyGraphicsLayer: null, // the graphics layer holding returned point from the identify query
    havaMapServiceUrl: '/ArcGIS/rest/services/Hava/MapServer',
    vistaWebServiceUrl: "http://vistaservice.utah.gov/Residence/GetResidencesInfoFromQueries/",
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

function displayCurrentPoint(x, y) {
    console.log("displayCurrentPoint", arguments);

    // create new point geometry
    var point = new esri.geometry.Point(x, y, g.map.SpatialReference);

    // create new graphic
    var graphic = new esri.Graphic(point, g.currentSymbol);

    // create new graphics layer so that this graphic doesn't get cleared.
    var gLayer = new esri.layers.GraphicsLayer();
    g.map.addLayer(gLayer);

    gLayer.add(graphic);
}
function showGraphic() {
    console.log("showGrahic", arguments);
    g.identifyGraphicsLayer.add(g.graphic);

    g.skipMouseOut = true;

    g.map.infoWindow.resize(230, g.windowHeight);

    g.map.infoWindow.setTitle(g.graphic.getTitle());
    g.map.infoWindow.setContent(g.graphic.getContent());
    g.map.infoWindow.show(g.graphic.attributes.screenPoint, g.map.getInfoWindowAnchor(g.graphic.attributes.screenPoint));
}

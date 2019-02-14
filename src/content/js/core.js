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
function onVistaGraphicsLayerClick(evt) {
    // summary:
    //      Fires when user clicks on a graphics layer
    console.log("onVistaGraphicsLayerClick", arguments);

    dojo.stopEvent(evt);

    g.identifyGraphicsLayer.clear();
    g.map.infoWindow.hide();

    if (g.lastGraphic) {
        g.lastGraphic.setSymbol(g.vistaSymbol);
    }

    dojo.byId("selectedID").value = evt.graphic.attributes[g.fields.ResidenceID];
    dojo.byId("Address").value = evt.graphic.attributes[g.fields.Address];
    document.title = evt.graphic.attributes[g.fields.ResidenceID];

    evt.graphic.setSymbol(g.currentSymbol);

    g.lastGraphic = evt.graphic;
}
function onVistaGraphicsMouseOver(evt) {
    // summary:
    //      Fires when the users mouse first enters into a graphic
    // evt: Event
    console.log("onVistaGraphicsMouseOver", arguments);

    g.map.infoWindow.resize(275, 37);

    var graphic = evt.graphic;
    if (evt.graphic.symbol != g.currentSymbol) {
        graphic.setSymbol(g.highlightedVistaSymbol);
    }
    g.map.infoWindow.setTitle(graphic.getTitle());
    g.map.infoWindow.setContent(graphic.getContent());
    g.map.infoWindow.show(evt.screenPoint, g.map.getInfoWindowAnchor(evt.screenPoint));
}
function onVistaGraphicsMouseOut(evt) {
    // summary:
    //      Fires when the users mouse leaves a graphic
    console.log("onVistaGraphicsMouseOut", arguments);

    if (g.skipMouseOut) {
        g.skipMouseOut = false;
        return;
    }

    if (evt.graphic.symbol != g.currentSymbol) {
        evt.graphic.setSymbol(g.vistaSymbol);
    }

    g.map.infoWindow.hide();

    g.map.infoWindow.resize(230, g.windowHeight);
}
function addToMap(data) {
    // summary:
    //      Adds the data returned from the Vista query to the map as graphics
    console.log("addToMap", arguments);

    g.map.graphics.clear();

    var title = "${" + g.fields.Address + "}";
    var infoTemplate = new esri.InfoTemplate(title, " ");

    var i = 0;
    dojo.some(data.VResidences, function(res) {
        var pnt = new esri.geometry.Point(res.X, res.Y, g.map.spatialReference);
        var graphic = new esri.Graphic(pnt, g.vistaSymbol, res, infoTemplate);
        g.map.graphics.add(graphic);

        i = i + 1;

        if (i > 1300) {
            alert("Maximum number of addresses reached! There may be some addresses that are not displayed.");
            return true;
        } else {
            return false;
        }
    });
}
function displayVistaQuery(queryNumber) {
    // summary:
    //      Sends a request to the Vista web service and displays the resulting addresses
    // queryNumber: Number
    //      The id number of the query in the Vista database.
    console.log("displayVistaQuery", arguments);

    dojo.connect(g.map.graphics, "onClick", onVistaGraphicsLayerClick);
    dojo.connect(g.map.graphics, "onMouseOver", onVistaGraphicsMouseOver);
    dojo.connect(g.map.graphics, "onMouseOut", onVistaGraphicsMouseOut);

    var getParams = {
        callbackParamName: "jsonp",
        checkString: "Total",
        url: g.vistaWebServiceUrl + queryNumber + "/?jsonp&db=" + getURLParameter("db"),
        load: addToMap,
        error: function(error) {
            alert("There was an error getting the address data from the Vista database.\n" + error.message);
        }
    };
    dojo.io.script.get(getParams);
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
function onMapClick(event) {
    console.log("onMapClick", arguments);

    g.map.graphics.disableMouseEvents();

    if (g.lastGraphic) {
        g.lastGraphic.setGeometry(g.graphic.geometry);
        g.lastGraphic.setSymbol(g.vistaSymbol);
    }
}
function onIdentifyComplete(iResults) {
    console.log("onIdentifyComplete", arguments);

    showGraphic();

    g.map.graphics.enableMouseEvents();
}
function initMap(extentGraphic) {
    if (getURLParameter('map') === "p"){
        console.log('switching to proposed layers');
        g.precinctLyrIndex = 7;
    }
}
function wrapWithQuotes(fld) {
    return '"' + fld + '"';
}
function init() {
    // create symbols
    g.currentSymbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, 11,
        new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,
        new dojo.Color('white'), 1), new dojo.Color([0, 0, 255, 0.75]));
    g.vistaSymbol = new esri.symbol.SimpleMarkerSymbol().setSize(10).setColor(new dojo.Color("white"));
    g.highlightedVistaSymbol = new esri.symbol.SimpleMarkerSymbol().setSize(10).setColor(new dojo.Color("red"));
}

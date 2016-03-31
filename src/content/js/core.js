/*global dojo, console, window, agrc, esri, alert, document*/
dojo.provide("js.core");

dojo.require('agrc.widgets.map.BaseMap');
dojo.require("dojo.io.script");
dojo.require("agrc.modules.String");
dojo.require("agrc.widgets.map.BaseMapSelector");

// global object
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

function getURLParameter(name) {
    console.log("getURLParameter", arguments);

    name = name.replace(/(\[|\])/g,"\\$1");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(window.location.href);
    if (results === null) {
        return "";
    } else {
        return results[1];
    }
}
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

    g.identifyGraphicsLayer.clear();
    g.map.infoWindow.hide();
    g.map.showLoader();

    // store point as a graphic
    g.graphic = new esri.Graphic(event.mapPoint, g.identifySymbol, {
        XCoord: Math.round(event.mapPoint.x * 100)/100,
        YCoord: Math.round(event.mapPoint.y * 100)/100,
        screenPoint: event.screenPoint
    }, g.iTemplate);

    // update coord values
    dojo.byId('XCoord').value = Math.round(event.mapPoint.x * 100)/100;
    dojo.byId('YCoord').value = Math.round(event.mapPoint.y * 100)/100;

    if (g.precinct || g.districts) {
        g.iParams.geometry = event.mapPoint;
        g.iParams.mapExtent = g.map.extent;
        g.iTask.execute(g.iParams);
    } else {
        showGraphic();
    }

    if (g.lastGraphic) {
        g.lastGraphic.setGeometry(g.graphic.geometry);
        g.lastGraphic.setSymbol(g.vistaSymbol);
    }
}
function onIdentifyComplete(iResults) {
    console.log("onIdentifyComplete", arguments);

    dojo.forEach(iResults, function(result) {
        var atts = result.feature.attributes;

        switch (result.layerId) {
            case g.precinctLyrIndex:
                //precincts
                dojo.byId('Precinct').value = atts[g.fields.PrecinctID];
                g.graphic.attributes.Precinct = atts[g.fields.PrecinctID];
                dojo.byId('CountyID').value = atts[g.fields.CountyID];
                g.graphic.attributes.CountyID = atts[g.fields.CountyID];
                break;
            case g.houseLyrIndex:
                // utah house districts
                dojo.byId('House').value = atts[g.fields.DIST];
                g.graphic.attributes.House = atts[g.fields.DIST];
                break;
            case g.senateLyrIndex:
                // utah senate
                dojo.byId('Senate').value = atts[g.fields.DIST];
                g.graphic.attributes.Senate = atts[g.fields.DIST];
                break;
            case g.usCongressLyrIndex:
                // us congress
                dojo.byId('FedHouse').value = atts[g.fields.DISTRICT];
                g.graphic.attributes.FedHouse = atts[g.fields.DISTRICT];
                break;
        }
    });
    showGraphic();

    g.map.graphics.enableMouseEvents();

    g.map.hideLoader();
}
function initIdentifyTask() {
    console.log("initIdentifyTask", arguments);

    g.iParams = new esri.tasks.IdentifyParameters();
    g.iParams.tolerance = 0;
    g.iParams.layerIds = [];
    g.iParams.returnGeometry = true;
    g.iParams.layerOption = esri.tasks.IdentifyParameters.LAYER_OPTION_ALL;
    g.iParams.width = g.map.width;
    g.iParams.height = g.map.height;

    g.iTask = new esri.tasks.IdentifyTask('/ArcGIS/rest/services/Hava/MapServer');

    g.windowHeight = 95;

    g.identifyGraphicsLayer = new esri.layers.GraphicsLayer();
    g.map.addLayer(g.identifyGraphicsLayer);

    // build template string
    var templateString = "<table><tr><td class='field-name'>X:</td><td>${XCoord}</td></tr>";
    templateString += "<tr><td class='field-name'>Y:</td><td>${YCoord}</td></tr>";
    if (g.precinct) {
        templateString += "<tr><td class='field-name'>Precinct ID:</td><td>${Precinct}</td></tr>";
        g.windowHeight += 18;
        g.iParams.layerIds.push(g.precinctLyrIndex);
    }
    if (g.districts) {
        templateString += "<tr><td class='field-name'>State House:</td><td>${House}</td></tr>";
        templateString += "<tr><td class='field-name'>State Senate:</td><td>${Senate}</td></tr>";
        templateString += "<tr><td class='field-name'>U.S. House:</td><td>${FedHouse}</td></tr>";
        templateString += "<tr><td class='field-name'>County ID:</td><td>${CountyID}</td></tr>";
        g.windowHeight += 55;
        g.iParams.layerIds = g.iParams.layerIds.concat([g.houseLyrIndex, g.senateLyrIndex, g.usCongressLyrIndex]);
    }
    templateString += '</table>';

    g.iTemplate = new esri.InfoTemplate('Voter Location Information', templateString);

    dojo.connect(g.map, 'onClick', onMapClick);
    dojo.connect(g.iTask, 'onComplete', onIdentifyComplete);
    dojo.connect(g.iTask, 'onError', function(e) {
        console.error(e);
    });
}
function initMap(extentGraphic) {
    console.log("initMap", arguments);

    var mapOptions = {
        useDefaultBaseMap: false,
        useDefaultExtent: false,
        displayGraphicsOnPan: false
    };

    if (extentGraphic) {
        mapOptions.extent = extentGraphic.geometry.getExtent();
        mapOptions.fitExtent = false;
    }

    // create new agrc BaseMap
    g.map = new agrc.widgets.map.BaseMap('map', mapOptions);
    var data = [{
            "label": "Hybrid",
            "layers": [
                {
                    "url": "http://mapserv.utah.gov/ArcGIS/rest/services/UtahBaseMap-Hybrid/MapServer",
                    "opacity": 1
                }
            ]
        },{
            "label": "Streets",
            "layers": [
                {
                    "url": "http://mapserv.utah.gov/ArcGIS/rest/services/UtahBaseMap-Vector/MapServer",
                    "opacity": 1
                }
            ]
        }
    ];
    var selector = new agrc.widgets.map.BaseMapSelector({
        map: g.map, 
        id: "claro", 
        position: "TR", 
        data: data,
        defaultThemeLabel: "Hybrid"
    });

    // disable mouse wheel zooming
    dojo.connect(g.map, 'onLoad', function() {
        g.map.disableScrollWheelZoom();

        // add current point
        var currentX = getURLParameter('currentX');
        var currentY = getURLParameter('currentY');
        if (currentX && currentY) {
            displayCurrentPoint(currentX, currentY);
        }

        // load vista query
        var queryNumber = getURLParameter("query");
        if (queryNumber) {
            displayVistaQuery(queryNumber);
        }
    });
    // Add imagery layer
    // var imagery = new esri.layers.ArcGISTiledMapServiceLayer('http://mapserv.utah.gov/arcgis/rest/services/UtahBaseMap-Hybrid/MapServer');
    // g.map.addLayer(imagery);
    
    if (getURLParameter('map') === "p"){
        console.log('switching to proposed layers');
        g.precinctLyrIndex = 7;
    }
    if (g.precinct) {
        // Add HAVA Layer
        var hava = new esri.layers.ArcGISDynamicMapServiceLayer(g.havaMapServiceUrl, {
            opacity: 0.8
        });
        g.map.addLayer(hava);
        dojo.connect(hava, "onLoad", function(){
             if (getURLParameter('map') === "p"){
                hava.setVisibleLayers(g.proposedPrecinctLyrs);
            }
        });
    }
    initIdentifyTask();
}
function getExtent() {
    // summary:
    //      gets the graphic that will set the initial extent of the map
    console.log("getExtent", arguments);
    
    function getCountyId(str){
        var id = parseInt(getURLParameter("county"), 10);
        if (str) {
            if (id < 10){
             id = "0" + id;
            }
            id = "'" + id + "'";
        }
        return id;
    }
    
    var where, lyrIndex;
    if (getURLParameter('zip')){
        where = wrapWithQuotes(g.fields.ZIP5) + " = '" + getURLParameter('zip') + "'";
        lyrIndex = g.zipLyrIndex;
    } else if (agrc.modules.String.ReplaceAll(getURLParameter('precinctID'), "_", " ")){
        where = wrapWithQuotes(g.fields.PrecinctID) + " = '" + getURLParameter('precinctID') + "' AND " + wrapWithQuotes(g.fields.CountyID) + " = " + getCountyId();
        lyrIndex = g.precinctLyrIndex;
    } else if (getURLParameter('county')){
        where = wrapWithQuotes(g.fields.COUNTYNBR) + " = " + getCountyId(true);
        lyrIndex = g.countyLyrIndex;
    } else {
        console.error("No zip or precinctID found!");
        return;
    }

    // create query task
    var params = new esri.tasks.Query();
    params.returnGeometry = true;
    params.where = where;

    var qTask = new esri.tasks.QueryTask('/ArcGIS/rest/services/Hava/MapServer/' + lyrIndex);
    qTask.execute(params, function(featureSet) {
        if (featureSet.features.length === 0) {
            // try just the county
            where = wrapWithQuotes(g.fields.COUNTYNBR) + " = " + getCountyId(true);
            lyrIndex = g.countyLyrIndex;
            params.where = where;
            var qTask2 = new esri.tasks.QueryTask('/ArcGIS/rest/services/Hava/MapServer/' + lyrIndex);
            qTask2.execute(params, function(fSet){
                if (fSet.features.length === 0){
                    initMap();
                }
                else {
                    initMap(fSet.features[0]);
                }
            });
        } else {
            initMap(featureSet.features[0]);
        }
    }, function(e){
        console.error("There was an error with the extent query.\n" + e.message);
    });
}
function wrapWithQuotes(fld) {
    return '"' + fld + '"';
}
function init() {
    console.log("init", arguments);

    getExtent();

    // get other url parameters
    var districtsParam = getURLParameter('districts');
    g.districts = (districtsParam === 'no') ? false : true;

    var precinctParam = getURLParameter('precinct');
    g.precinct = (precinctParam === 'no') ? false : true;

    // create symbols
    g.currentSymbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, 11,
        new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,
        new dojo.Color('white'), 1), new dojo.Color([0, 0, 255, 0.75]));
    g.identifySymbol = new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_CIRCLE, 11,
        new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,
        new dojo.Color('black'), 1), new dojo.Color([255, 255, 0, 0.75]));
    g.vistaSymbol = new esri.symbol.SimpleMarkerSymbol().setSize(10).setColor(new dojo.Color("white"));
    g.highlightedVistaSymbol = new esri.symbol.SimpleMarkerSymbol().setSize(10).setColor(new dojo.Color("red"));
}

dojo.ready(init);
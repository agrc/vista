define([
    'agrc/modules/String',
    'agrc/widgets/map/BaseMap',

    'app/config',

    'dijit/_TemplatedMixin',
    'dijit/_WidgetBase',

    'dojo/dom',
    'dojo/request/script',
    'dojo/text!app/templates/App.html',
    'dojo/_base/Color',
    'dojo/_base/connect',
    'dojo/_base/declare',

    'esri/geometry/Point',
    'esri/graphic',
    'esri/InfoTemplate',
    'esri/layers/ArcGISDynamicMapServiceLayer',
    'esri/layers/GraphicsLayer',
    'esri/symbols/SimpleLineSymbol',
    'esri/symbols/SimpleMarkerSymbol',
    'esri/tasks/IdentifyParameters',
    'esri/tasks/IdentifyTask',
    'esri/tasks/query',
    'esri/tasks/QueryTask'
], function (
    agrcString,
    BaseMap,

    config,

    _TemplatedMixin,
    _WidgetBase,

    dom,
    script,
    template,
    Color,
    connect,
    declare,

    Point,
    Graphic,
    InfoTemplate,
    ArcGISDynamicMapServiceLayer,
    GraphicsLayer,
    SimpleLineSymbol,
    SimpleMarkerSymbol,
    IdentifyParameters,
    IdentifyTask,
    Query,
    QueryTask
) {
    function getURLParameter(name) {
        console.log('getURLParameter', arguments);

        name = name.replace(/(\[|\])/g,'\\$1');
        var regexS = '[\\?&]' + name + '=([^&#]*)';
        var regex = new RegExp(regexS);
        var results = regex.exec(window.location.href);
        if (results === null) {
            return '';
        } else {
            return results[1];
        }
    }
    function displayCurrentPoint(x, y) {
        console.log('displayCurrentPoint', arguments);

        // create new point geometry
        var point = new Point(x, y, config.map.SpatialReference);

        // create new graphic
        var graphic = new Graphic(point, config.currentSymbol);

        // create new graphics layer so that this graphic doesn't get cleared.
        var gLayer = new GraphicsLayer();
        config.map.addLayer(gLayer);

        gLayer.add(graphic);
    }
    function onVistaGraphicsLayerClick(evt) {
        // summary:
        //      Fires when user clicks on a graphics layer
        console.log('onVistaGraphicsLayerClick', arguments);

        evt.preventDefault();
        evt.stopPropagation();

        config.identifyGraphicsLayer.clear();
        config.map.infoWindow.hide();

        if (config.lastGraphic) {
            config.lastGraphic.setSymbol(config.vistaSymbol);
        }

        dom.byId('selectedID').value = evt.graphic.attributes[config.fields.ResidenceID];
        dom.byId('Address').value = evt.graphic.attributes[config.fields.Address];
        document.title = evt.graphic.attributes[config.fields.ResidenceID];

        evt.graphic.setSymbol(config.currentSymbol);

        config.lastGraphic = evt.graphic;
    }
    function onVistaGraphicsMouseOver(evt) {
        // summary:
        //      Fires when the users mouse first enters into a graphic
        // evt: Event
        console.log('onVistaGraphicsMouseOver', arguments);

        config.map.infoWindow.resize(275, 37);

        var graphic = evt.graphic;
        if (evt.graphic.symbol !== config.currentSymbol) {
            graphic.setSymbol(config.highlightedVistaSymbol);
        }
        config.map.infoWindow.setTitle(graphic.getTitle());
        config.map.infoWindow.setContent(graphic.getContent());
        config.map.infoWindow.show(evt.screenPoint, config.map.getInfoWindowAnchor(evt.screenPoint));
    }
    function onVistaGraphicsMouseOut(evt) {
        // summary:
        //      Fires when the users mouse leaves a graphic
        console.log('onVistaGraphicsMouseOut', arguments);

        if (config.skipMouseOut) {
            config.skipMouseOut = false;
            return;
        }

        if (evt.graphic.symbol !== config.currentSymbol) {
            evt.graphic.setSymbol(config.vistaSymbol);
        }

        config.map.infoWindow.hide();

        config.map.infoWindow.resize(230, config.windowHeight);
    }
    function addToMap(data) {
        // summary:
        //      Adds the data returned from the Vista query to the map as graphics
        console.log('addToMap', arguments);

        config.map.graphics.clear();

        var title = '${' + config.fields.Address + '}';
        var infoTemplate = new InfoTemplate(title, ' ');

        var i = 0;
        data.VResidences.some(function (res) {
            var pnt = new Point(res.X, res.Y, config.map.spatialReference);
            var graphic = new Graphic(pnt, config.vistaSymbol, res, infoTemplate);
            config.map.graphics.add(graphic);

            i = i + 1;

            if (i > 1300) {
                alert('Maximum number of addresses reached! There may be some addresses that are not displayed.');
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
        console.log('displayVistaQuery', arguments);

        connect(config.map.graphics, 'onClick', onVistaGraphicsLayerClick);
        connect(config.map.graphics, 'onMouseOver', onVistaGraphicsMouseOver);
        connect(config.map.graphics, 'onMouseOut', onVistaGraphicsMouseOut);

        var getParams = {
            callbackParamName: 'jsonp',
            checkString: 'Total',
            url: config.vistaWebServiceUrl + queryNumber + '/?jsonp&db=' + getURLParameter('db'),
            load: addToMap,
            error: function (error) {
                alert('There was an error getting the address data from the Vista database.\n' + error.message);
            }
        };
        script.get(getParams);
    }
    function showGraphic() {
        console.log('showGrahic', arguments);
        config.identifyGraphicsLayer.add(config.graphic);

        config.skipMouseOut = true;

        config.map.infoWindow.resize(230, config.windowHeight);

        config.map.infoWindow.setTitle(config.graphic.getTitle());
        config.map.infoWindow.setContent(config.graphic.getContent());
        config.map.infoWindow.show(config.graphic.attributes.screenPoint, config.map.getInfoWindowAnchor(config.graphic.attributes.screenPoint));
    }
    function onMapClick(event) {
        console.log('onMapClick', arguments);

        config.map.graphics.disableMouseEvents();

        config.identifyGraphicsLayer.clear();
        config.map.infoWindow.hide();
        config.map.showLoader();

        // store point as a graphic
        config.graphic = new Graphic(event.mapPoint, config.identifySymbol, {
            XCoord: Math.round(event.mapPoint.x * 100) / 100,
            YCoord: Math.round(event.mapPoint.y * 100) / 100,
            screenPoint: event.screenPoint
        }, config.iTemplate);

        // update coord values
        dom.byId('XCoord').value = Math.round(event.mapPoint.x * 100) / 100;
        dom.byId('YCoord').value = Math.round(event.mapPoint.y * 100) / 100;

        if (config.precinct || config.districts) {
            config.iParams.geometry = event.mapPoint;
            config.iParams.mapExtent = config.map.extent;
            config.iTask.execute(config.iParams);
        } else {
            showGraphic();
        }

        if (config.lastGraphic) {
            config.lastGraphic.setGeometry(config.graphic.geometry);
            config.lastGraphic.setSymbol(config.vistaSymbol);
        }
    }
    function onIdentifyComplete(iResults) {
        console.log('onIdentifyComplete', arguments);

        iResults.forEach(function (result) {
            var atts = result.feature.attributes;

            switch (result.layerId) {
                case config.precinctLyrIndex:
                    //precincts
                    dom.byId('Precinct').value = atts[config.fields.PrecinctID];
                    config.graphic.attributes.Precinct = atts[config.fields.PrecinctID];
                    dom.byId('CountyID').value = atts[config.fields.CountyID];
                    config.graphic.attributes.CountyID = atts[config.fields.CountyID];
                    break;
                case config.houseLyrIndex:
                    // utah house districts
                    dom.byId('House').value = atts[config.fields.DIST];
                    config.graphic.attributes.House = atts[config.fields.DIST];
                    break;
                case config.senateLyrIndex:
                    // utah senate
                    dom.byId('Senate').value = atts[config.fields.DIST];
                    config.graphic.attributes.Senate = atts[config.fields.DIST];
                    break;
                case config.usCongressLyrIndex:
                    // us congress
                    dom.byId('FedHouse').value = atts[config.fields.DISTRICT];
                    config.graphic.attributes.FedHouse = atts[config.fields.DISTRICT];
                    break;
            }
        });
        showGraphic();

        config.map.graphics.enableMouseEvents();

        config.map.hideLoader();
    }
    function initIdentifyTask() {
        console.log('initIdentifyTask', arguments);

        config.iParams = new IdentifyParameters();
        config.iParams.tolerance = 0;
        config.iParams.layerIds = [];
        config.iParams.returnGeometry = true;
        config.iParams.layerOption = IdentifyParameters.LAYER_OPTION_ALL;
        config.iParams.width = config.map.width;
        config.iParams.height = config.map.height;

        config.iTask = new IdentifyTask('/ArcGIS/rest/services/Hava/MapServer');

        config.windowHeight = 95;

        config.identifyGraphicsLayer = new GraphicsLayer();
        config.map.addLayer(config.identifyGraphicsLayer);

        // build template string
        var templateString = '<table><tr><td class="field-name">X:</td><td>${XCoord}</td></tr>';
        templateString += '<tr><td class="field-name">Y:</td><td>${YCoord}</td></tr>';
        if (config.precinct) {
            templateString += '<tr><td class="field-name">Precinct ID:</td><td>${Precinct}</td></tr>';
            config.windowHeight += 18;
            config.iParams.layerIds.push(config.precinctLyrIndex);
        }
        if (config.districts) {
            templateString += '<tr><td class="field-name">State House:</td><td>${House}</td></tr>';
            templateString += '<tr><td class="field-name">State Senate:</td><td>${Senate}</td></tr>';
            templateString += '<tr><td class="field-name">U.S. House:</td><td>${FedHouse}</td></tr>';
            templateString += '<tr><td class="field-name">County ID:</td><td>${CountyID}</td></tr>';
            config.windowHeight += 55;
            config.iParams.layerIds = config.iParams.layerIds.concat([config.houseLyrIndex, config.senateLyrIndex, config.usCongressLyrIndex]);
        }
        templateString += '</table>';

        config.iTemplate = new InfoTemplate('Voter Location Information', templateString);

        connect(config.map, 'onClick', onMapClick);
        connect(config.iTask, 'onComplete', onIdentifyComplete);
        connect(config.iTask, 'onError', function (e) {
            console.error(e);
        });
    }
    function initMap(extentGraphic) {
        console.log('initMap', arguments);

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
        config.map = new BaseMap('map', mapOptions);
        // var data = [
        //     {
        //         label: 'Hybrid',
        //         layers: [
        //             {
        //                 'url': 'http://mapserv.utah.gov/ArcGIS/rest/services/UtahBaseMap-Hybrid/MapServer',
        //                 'opacity': 1
        //             }
        //         ]
        //     },{
        //         'label': 'Streets',
        //         'layers': [
        //             {
        //                 'url': 'http://mapserv.utah.gov/ArcGIS/rest/services/UtahBaseMap-Vector/MapServer',
        //                 'opacity': 1
        //             }
        //         ]
        //     }
        // ];
        // var selector = new agrc.widgets.map.BaseMapSelector({
        //     map: config.map,
        //     id: 'claro',
        //     position: 'TR',
        //     data: data,
        //     defaultThemeLabel: 'Hybrid'
        // });

        // disable mouse wheel zooming
        connect(config.map, 'onLoad', function () {
            config.map.disableScrollWheelZoom();

            // add current point
            var currentX = getURLParameter('currentX');
            var currentY = getURLParameter('currentY');
            if (currentX && currentY) {
                displayCurrentPoint(currentX, currentY);
            }

            // load vista query
            var queryNumber = getURLParameter('query');
            if (queryNumber) {
                displayVistaQuery(queryNumber);
            }
        });
        // Add imagery layer
        // var imagery = new ArcGISTiledMapServiceLayer('http://mapserv.utah.gov/arcgis/rest/services/UtahBaseMap-Hybrid/MapServer');
        // config.map.addLayer(imagery);

        if (getURLParameter('map') === 'p') {
            console.log('switching to proposed layers');
            config.precinctLyrIndex = 7;
        }
        if (config.precinct) {
            // Add HAVA Layer
            var hava = new ArcGISDynamicMapServiceLayer(config.havaMapServiceUrl, {
                opacity: 0.8
            });
            config.map.addLayer(hava);
            connect(hava, 'onLoad', function () {
                if (getURLParameter('map') === 'p') {
                    hava.setVisibleLayers(config.proposedPrecinctLyrs);
                }
            });
        }
        initIdentifyTask();
    }
    function wrapWithQuotes(fld) {
        return '\'' + fld + '\'';
    }
    function getExtent() {
        // summary:
        //      gets the graphic that will set the initial extent of the map
        console.log('getExtent', arguments);

        function getCountyId(str) {
            var id = parseInt(getURLParameter('county'), 10);
            if (str) {
                if (id < 10) {
                    id = '0' + id;
                }
                id = '\'' + id + '\'';
            }
            return id;
        }

        var where;
        var lyrIndex;
        if (getURLParameter('zip')) {
            where = wrapWithQuotes(config.fields.ZIP5) + ' = \'' + getURLParameter('zip') + '\'';
            lyrIndex = config.zipLyrIndex;
        } else if (agrcString.replaceAll(getURLParameter('precinctID'), '_', ' ')) {
            where = wrapWithQuotes(config.fields.PrecinctID) + ' = \'' + getURLParameter('precinctID') + '\' AND ' + wrapWithQuotes(config.fields.CountyID) + ' = ' + getCountyId();
            lyrIndex = config.precinctLyrIndex;
        } else if (getURLParameter('county')) {
            where = wrapWithQuotes(config.fields.COUNTYNBR) + ' = ' + getCountyId(true);
            lyrIndex = config.countyLyrIndex;
        } else {
            console.error('No zip or precinctID found!');
            return;
        }

        // create query task
        var params = new Query();
        params.returnGeometry = true;
        params.where = where;

        var qTask = new QueryTask('/ArcGIS/rest/services/Hava/MapServer/' + lyrIndex);
        qTask.execute(params, function (featureSet) {
            if (featureSet.features.length === 0) {
                // try just the county
                where = wrapWithQuotes(config.fields.COUNTYNBR) + ' = ' + getCountyId(true);
                lyrIndex = config.countyLyrIndex;
                params.where = where;
                var qTask2 = new QueryTask('/ArcGIS/rest/services/Hava/MapServer/' + lyrIndex);
                qTask2.execute(params, function (fSet) {
                    if (fSet.features.length === 0) {
                        initMap();
                    } else {
                        initMap(fSet.features[0]);
                    }
                });
            } else {
                initMap(featureSet.features[0]);
            }
        }, function (e) {
            console.error('There was an error with the extent query.\n' + e.message);
        });
    }

    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        postCreate: function () {
            // summary:
            //      description
            console.log('app.App:postCreate', arguments);

            getExtent();

            // get other url parameters
            var districtsParam = getURLParameter('districts');
            config.districts = (districtsParam === 'no') ? false : true;

            var precinctParam = getURLParameter('precinct');
            config.precinct = (precinctParam === 'no') ? false : true;

            // create symbols
            config.currentSymbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 11,
                new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                new Color('white'), 1), new Color([0, 0, 255, 0.75]));
            config.identifySymbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 11,
                new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                new Color('black'), 1), new Color([255, 255, 0, 0.75]));
            config.vistaSymbol = new SimpleMarkerSymbol().setSize(10).setColor(new Color('white'));
            config.highlightedVistaSymbol = new SimpleMarkerSymbol().setSize(10).setColor(new Color('red'));
        }
    });
});

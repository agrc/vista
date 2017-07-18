define([
    'agrc/modules/String',
    'agrc/widgets/map/BaseMap',

    'app/config',
    'app/urlParameters',

    'dijit/_TemplatedMixin',
    'dijit/_WidgetBase',

    'dojo/Deferred',
    'dojo/dom',
    'dojo/request/script',
    'dojo/text!app/templates/App.html',
    'dojo/_base/Color',
    'dojo/_base/declare',
    'dojo/_base/lang',

    'esri/geometry/Extent',
    'esri/geometry/Point',
    'esri/graphic',
    'esri/InfoTemplate',
    'esri/layers/ArcGISDynamicMapServiceLayer',
    'esri/layers/GraphicsLayer',
    'esri/layers/VectorTileLayer',
    'esri/SpatialReference',
    'esri/symbols/SimpleLineSymbol',
    'esri/symbols/SimpleMarkerSymbol',
    'esri/tasks/IdentifyParameters',
    'esri/tasks/IdentifyTask',
    'esri/tasks/query',
    'esri/tasks/QueryTask',

    'layer-selector/LayerSelector',

    'proj4'
], function (
    agrcString,
    BaseMap,

    config,
    urlParameters,

    _TemplatedMixin,
    _WidgetBase,

    Deferred,
    dom,
    script,
    template,
    Color,
    declare,
    lang,

    Extent,
    Point,
    Graphic,
    InfoTemplate,
    ArcGISDynamicMapServiceLayer,
    GraphicsLayer,
    VectorTileLayer,
    SpatialReference,
    SimpleLineSymbol,
    SimpleMarkerSymbol,
    IdentifyParameters,
    IdentifyTask,
    Query,
    QueryTask,

    LayerSelector,

    proj4
) {
    return declare([_WidgetBase, _TemplatedMixin], {
        baseClass: 'app',
        templateString: template,
        postCreate: function () {
            // summary:
            //      description
            console.log('app/App:postCreate', arguments);

            urlParameters.init(window.location.href, this);

            // create symbols
            config.currentSymbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 11,
                new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                new Color('white'), 1), new Color([0, 0, 255, 0.75]));
            config.identifySymbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 11,
                new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                new Color('black'), 1), new Color([255, 255, 0, 0.75]));
            config.vistaSymbol = new SimpleMarkerSymbol().setSize(10).setColor(new Color('white'));
            config.highlightedVistaSymbol = new SimpleMarkerSymbol().setSize(10).setColor(new Color('red'));
        },
        initMap: function (extent) {
            console.log('app/App:initMap', arguments);

            var mapOptions = {
                useDefaultBaseMap: false,
                useDefaultExtent: false,
                displayGraphicsOnPan: false,
                extent: new Extent({
                    xmax: -11762120.612131765,
                    xmin: -13074391.513731329,
                    ymax: 5225035.106177688,
                    ymin: 4373832.359194187,
                    spatialReference: {
                        wkid: 3857
                    }
                })
            };

            if (extent) {
                mapOptions.extent = extent;
                mapOptions.fitExtent = false;
            }

            this.map = new BaseMap('map', mapOptions);
            var layerSelector = new LayerSelector({
                map: this.map,
                quadWord: config.quadWord,
                baseLayers: ['Hybrid', 'Lite']
            });
            layerSelector.startup();

            const parcelsLayer = new VectorTileLayer(config.parcelsVectorTilesServiceUrl);
            this.map.addLayer(parcelsLayer);

            this.map.disableScrollWheelZoom();

            if (urlParameters[config.urlParams.map] === 'p') {
                console.log('app/App:switching to proposed layers');
                config.precinctLyrIndex = 7;
            }
            this.initIdentifyTask();

            var def = new Deferred();

            if (this.map.loaded) {
                def.resolve();
            } else {
                this.map.on('load', def.resolve);
            }

            return def.promise;
        },
        initIdentifyTask: function () {
            console.log('app/App:initIdentifyTask', arguments);

            config.iParams = new IdentifyParameters();
            config.iParams.tolerance = 0;
            config.iParams.layerIds = [];
            config.iParams.returnGeometry = true;
            config.iParams.layerOption = IdentifyParameters.LAYER_OPTION_ALL;
            config.iParams.width = this.map.width;
            config.iParams.height = this.map.height;

            config.iTask = new IdentifyTask(config.havaMapServiceUrl);

            config.windowHeight = 95;

            config.identifyGraphicsLayer = new GraphicsLayer();
            this.map.addLayer(config.identifyGraphicsLayer);

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

            this.map.on('click', this.onMapClick);
            config.iTask.on('complete', this.onIdentifyComplete);
            config.iTask.on('error', function (e) {
                console.error(e);
            });
        },
        onIdentifyComplete: function (response) {
            console.log('app/App:onIdentifyComplete', arguments);
            var iResults = response.results;

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
            this.showGraphic();

            this.map.graphics.enableMouseEvents();

            this.map.hideLoader();
        },
        displayVistaPoints: function (features) {
            // summary:
            //      adds all features to graphics layer
            // features: Graphics[]
            console.log('app/App:displayVistaPoints', arguments);

            features.forEach(feature => this.map.graphics.add(feature));
        },
        displayCurrentPoint: function (x, y) {
            console.log('app/App:displayCurrentPoint', arguments);

            // create new point geometry
            var projectedPoint = proj4(config.wkt26912, config.wkt3857, [x, y]);
            var point = new Point(projectedPoint, this.map.spatialReference);

            // create new graphic
            var graphic = new Graphic(point, config.currentSymbol);

            // create new graphics layer so that this graphic doesn't get cleared.
            var gLayer = new GraphicsLayer();
            this.map.addLayer(gLayer);

            gLayer.add(graphic);
        },
        showPrecinctLayer: function () {
            // summary:
            //      shows the precinct layer in the map service
            console.log('app/App:showPrecinctLayer', arguments);

            // Add HAVA Layer
            var hava = new ArcGISDynamicMapServiceLayer(config.havaMapServiceUrl, {
                opacity: 0.8
            });
            this.map.addLayer(hava);
            hava.on('load', function () {
                if (urlParameters[config.urlParams.map] === 'p') {
                    hava.setVisibleLayers(config.proposedPrecinctLyrs);
                }
            });
        },
        onVistaGraphicsLayerClick: function (evt) {
            // summary:
            //      Fires when user clicks on a graphics layer
            console.log('app/App:onVistaGraphicsLayerClick', arguments);

            evt.preventDefault();
            evt.stopPropagation();

            config.identifyGraphicsLayer.clear();
            this.map.infoWindow.hide();

            if (config.lastGraphic) {
                config.lastGraphic.setSymbol(config.vistaSymbol);
            }

            dom.byId('selectedID').value = evt.graphic.attributes[config.fields.ResidenceID];
            dom.byId('Address').value = evt.graphic.attributes[config.fields.Address];
            document.title = evt.graphic.attributes[config.fields.ResidenceID];

            evt.graphic.setSymbol(config.currentSymbol);

            config.lastGraphic = evt.graphic;
        },
        onVistaGraphicsMouseOver: function (evt) {
            // summary:
            //      Fires when the users mouse first enters into a graphic
            // evt: Event
            console.log('app/App:onVistaGraphicsMouseOver', arguments);

            this.map.infoWindow.resize(275, 37);

            var graphic = evt.graphic;
            if (evt.graphic.symbol !== config.currentSymbol) {
                graphic.setSymbol(config.highlightedVistaSymbol);
            }
            this.map.infoWindow.setTitle(graphic.getTitle());
            this.map.infoWindow.setContent(graphic.getContent());
            this.map.infoWindow.show(evt.screenPoint, this.map.getInfoWindowAnchor(evt.screenPoint));
        },
        onVistaGraphicsMouseOut: function (evt) {
            // summary:
            //      Fires when the users mouse leaves a graphic
            console.log('app/App:onVistaGraphicsMouseOut', arguments);

            if (config.skipMouseOut) {
                config.skipMouseOut = false;
                return;
            }

            if (evt.graphic.symbol !== config.currentSymbol) {
                evt.graphic.setSymbol(config.vistaSymbol);
            }

            this.map.infoWindow.hide();

            this.map.infoWindow.resize(230, config.windowHeight);
        },
        showGraphic: function () {
            console.log('app/App:showGrahic', arguments);
            config.identifyGraphicsLayer.add(config.graphic);

            config.skipMouseOut = true;

            this.map.infoWindow.resize(230, config.windowHeight);

            this.map.infoWindow.setTitle(config.graphic.getTitle());
            this.map.infoWindow.setContent(config.graphic.getContent());
            this.map.infoWindow.show(config.graphic.attributes.screenPoint, this.map.getInfoWindowAnchor(config.graphic.attributes.screenPoint));
        },
        onMapClick: function (event) {
            console.log('app/App:onMapClick', arguments);

            this.map.graphics.disableMouseEvents();

            config.identifyGraphicsLayer.clear();
            this.map.infoWindow.hide();
            this.map.showLoader();

            // store point as a graphic
            var projectedPoint = proj4(config.wkt3857, config.wkt26912, lang.clone(event.mapPoint));
            config.graphic = new Graphic(event.mapPoint, config.identifySymbol, {
                XCoord: projectedPoint.x,
                YCoord: projectedPoint.y,
                screenPoint: event.screenPoint
            }, config.iTemplate);

            // update coord values
            dom.byId('XCoord').value = projectedPoint.x;
            dom.byId('YCoord').value = projectedPoint.y;

            if (config.precinct || config.districts) {
                config.iParams.geometry = event.mapPoint;
                config.iParams.mapExtent = this.map.extent;
                config.iTask.execute(config.iParams);
            } else {
                this.showGraphic();
            }

            if (config.lastGraphic) {
                config.lastGraphic.setGeometry(config.graphic.geometry);
                config.lastGraphic.setSymbol(config.vistaSymbol);
            }
        }
    });
});

define([
    'agrc/modules/WebAPI',

    'app/config',

    'dojo/io-query',
    'dojo/request/xhr',
    'dojo/_base/lang',

    'esri/geometry/Point',
    'esri/graphic',
    'esri/InfoTemplate',

    'proj4'
], function (
    WebAPI,

    config,

    ioQuery,
    xhr,
    lang,

    Point,
    Graphic,
    InfoTemplate,

    proj4
) {
    return {
        init: function (url, app) {
            // summary:
            //      description
            // url: string
            // app: reference to App widget
            console.log('app/UrlParameters:init', arguments);

            lang.mixin(this, ioQuery.queryToObject(url.split('?')[1]));

            this.app = app;

            // post process some parameters
            this.districts = (this.districts === 'no') ? false : true;
            this.precinct = (this.precinct === 'no') ? false : true;

            this.zoom().then(function () {
                if (this.currentX && this.currentY) {
                    app.displayCurrentPoint(this.currentX, this.currentY);
                }

                if (this.precinct) {
                    app.showPrecinctLayer();
                }

                if (this.county && (this.streetid || this.precinctID)) {
                    this.showVistaPoints();
                }
            }.bind(this));
        },
        zoom: function () {
            // summary:
            //      zooms to zip, precinct or county
            console.log('app/UrlParameters:zoom', arguments);

            // zoom priority: zip -> precinct -> county
            var api = new WebAPI({
                apiKey: config.apiKey
            });
            var fcName;
            var predicate;
            if (this.zip) {
                fcName = config.fcNames.zips;
                predicate = config.fields.ZIP5 + ' = \'' + this.zip + '\'';
            } else if (this.precinctID) {
                fcName = config.fcNames.precincts;
                var id = this.precinctID.replace(/_/g, ' ');
                predicate = config.fields.PrecinctID + ' = \'' + id + '\'';
            } else if (this.county) {
                fcName = config.fcNames.counties;
                var num = (parseInt(this.county) < 10) ? '0' + this.county : this.county;
                predicate = config.fields.COUNTYNBR + ' = \'' + num + '\'';
            }

            if (fcName) {
                return api.search(fcName, ['shape@envelope'], {
                    spatialReference: 3857,
                    predicate: predicate
                }).then(lang.hitch(this, this.onSearchReturn));
            } else {
                return this.app.initMap();
            }
        },
        onSearchReturn: function (results) {
            // summary:
            //      description
            // results: Object[]
            console.log('app/urlParameters:onSearchReturn', arguments);

            return this.app.initMap(new Graphic(results[0]).geometry.getExtent());
        },
        showVistaPoints: function () {
            // summary:
            //      queries points from vista web service and shows them on the map
            console.log('app/UrlParameters:showVistaPoints', arguments);

            var project = proj4(config.wkt26912, config.wkt3857).forward;
            var title = '${' + config.fields.Address + '}';
            var infoTemplate = new InfoTemplate(title, ' ');
            var url = '';
            xhr(url, {

            }).then(function (response) {
                var projectedFeatures = response.features.map(function (row) {
                    var webMercator = project([row.X, row.Y]);
                    return new Graphic(new Point(webMercator), config.vistaSymbol, row, infoTemplate);
                });
                this.app.displayVistaPoints(projectedFeatures);
            }.bind(this), function (er) {
                alert(er.message);
            });
        }
    };
});

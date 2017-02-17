require([
    'agrc/modules/WebAPI',

    'app/config',
    'app/DynamicLayer',
    'app/urlParameters',

    'dojo/Deferred',
    'dojo/_base/declare',

    'stubmodule'
], function (
    WebAPI,

    config,
    DynamicLayer,
    urlParameters,

    Deferred,
    declare,

    stubmodule
) {
    describe('app/UrlParameters', function () {
        var app;
        var mapLoadedDef;
        var clear = function (obj) {
            obj.currentX = null;
            obj.currentY = null;
            obj.precincts = null;
            obj.districts = null;
            obj.map = null;
            obj.zip = null;
            obj.precinctID = null;
            obj.county = null;
            obj.db = null;
            obj.displayMode = null;
            obj.residenceID = null;
        };
        beforeEach(function () {
            mapLoadedDef = new Deferred();
            app = {
                displayCurrentPoint: jasmine.createSpy(),
                showPrecinctLayer: jasmine.createSpy(),
                initMap: function () {
                    return mapLoadedDef.promise;
                }
            };
            clear(urlParameters);
        });
        it('defines properties', function () {
            var url = 'http://somedomain.com/?db=t&map=c&districts=no&precincts=yes';
            urlParameters.init(url, app);

            expect(urlParameters.db).toEqual('t');
            expect(urlParameters.map).toEqual('c');
            expect(urlParameters.districts).toEqual(false);
            expect(urlParameters.precincts).toEqual(true);
        });
        it('calls displayCurrentPoint if proper params are passed', function () {
            var url = 'http://test.com/?currentX=1&currentY=2';
            urlParameters.init(url, app);
            mapLoadedDef.resolve();

            expect(app.displayCurrentPoint).toHaveBeenCalledWith('1', '2');
        });
        it('calls showLayer if appropriate', function () {
            var url = 'http://test.com/?precincts=yes';
            urlParameters.init(url, app);
            mapLoadedDef.resolve();

            expect(app.showPrecinctLayer).toHaveBeenCalled();
        });
        describe('zoom', function () {
            it('zooms to the correct feature', function (done) {
                var searchDef = new Deferred();
                var searchSpy = jasmine.createSpy('searchSpy').and.returnValue(searchDef.promise);
                stubmodule('app/urlParameters', {
                    'agrc/modules/WebAPI': declare([WebAPI], {
                        search: searchSpy
                    })
                }).then(function (stubbedModule) {
                    var url = 'http://test.com/?zip=84111&precinctID=p_id&county=1';
                    stubbedModule.init(url, app);
                    searchDef.resolve();
                    mapLoadedDef.resolve();
                    expect(searchSpy).toHaveBeenCalledWith(config.fcNames.zips, ['shape@envelope'], {
                        spatialReference: 3857,
                        predicate: 'ZIP5 = \'84111\''
                    });

                    url = 'http://test.com/?precinctID=p_id&county=1';
                    clear(stubbedModule);
                    stubbedModule.init(url, app);
                    searchDef.resolve();
                    mapLoadedDef.resolve();
                    expect(searchSpy).toHaveBeenCalledWith(config.fcNames.precincts, ['shape@envelope'], {
                        spatialReference: 3857,
                        predicate: 'VistaID = \'p id\''
                    });

                    url = 'http://test.com/?county=1';
                    clear(stubbedModule);
                    stubbedModule.init(url, app);
                    searchDef.resolve();
                    mapLoadedDef.resolve();
                    expect(searchSpy).toHaveBeenCalledWith(config.fcNames.counties, ['shape@envelope'], {
                        spatialReference: 3857,
                        predicate: 'COUNTYNBR = \'01\''
                    });

                    done();
                });
            });
        });
        describe('showVistaPoints', function () {
            it('makes the request if required parameter is present', function () {
                expect(true).toBe(false);
            });
        });
    });
});

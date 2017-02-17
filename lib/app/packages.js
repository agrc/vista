require({
    packages: [
        'agrc',
        'app',
        'dijit',
        'dgrid',
        'dojo',
        'dojox',
        'esri',
        'moment',
        'layer-selector',
        'put-selector',
        'xstyle',
        {
            name: 'bootstrap',
            location: './bootstrap',
            main: 'dist/js/bootstrap'
        }, {
            name: 'proj4',
            location: './proj4/dist',
            main: 'proj4'
        }, {
            name: 'spin',
            location: './spinjs',
            main: 'spin'
        }
    ]
});

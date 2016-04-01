require({
    packages: ['agrc', 'app', 'dijit', 'dojo', 'dojox', 'esri', 'moment', 'layer-selector', {
        name: 'bootstrap',
        location: './bootstrap',
        main: 'dist/js/bootstrap'
    }, {
        name: 'jquery',
        location: './jquery/dist',
        main: 'jquery'
    }, {
        name: 'proj4',
        location: './proj4/dist',
        main: 'proj4'
    }, {
        name: 'spin',
        location: './spinjs',
        main: 'spin'
    }]
});

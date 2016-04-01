require({
    packages: ['agrc', 'app', 'dijit', 'dojo', 'dojox', 'esri', 'moment', 'layer-selector', {
        name: 'spin',
        location: './spinjs',
        main: 'spin'
    },{
        name: 'bootstrap',
        location: './bootstrap',
        main: 'dist/js/bootstrap'
    }, {
        name: 'jquery',
        location: './jquery/dist',
        main: 'jquery'
    }]
});

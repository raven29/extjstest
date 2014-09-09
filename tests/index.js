var Harness = Siesta.Harness.Browser.ExtJS;

Harness.configure({
    title       : 'Awesome Test Suite',

    preload     : [
        // version of ExtJS used by your application
        //'../ext-4.1.1/resources/css/ext-all.css',
        //'../resources/yourproject-css-all.css',

        // version of ExtJS used by your application
        //'../ext-4.1.1/ext-all-debug.js',
        //'../yourproject-all.js'

        //'../packages/ext-theme-neptune-tic/build/resources/ext-theme-neptune-tic-all.css',
        
        //'../ext/packages/ext-theme-classic/build/resources/ext-theme-classic-all.css',
        '../build/production/TIC/resources/TIC-all.css',

        '../ext/ext-all-debug.js',
        //'../build/testing/TIC/app.js'
        '../app.js'

    ]
});

Harness.start(
    '010_sanity.t.js',
    '020_basic.t.js'
);
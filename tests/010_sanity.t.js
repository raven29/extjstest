// also supports: startTest(function(t) {
StartTest(function(t) {
    t.diag("Sanity");

    t.ok(Ext, 'ExtJS is here');
    t.ok(Ext.Window, '.. indeed');


    t.ok(TIC.app, 'My project is here');
    t.ok(TIC.app.controllers, '.. indeed');

    t.done();   // Optional, marks the correct exit point from the test
})    

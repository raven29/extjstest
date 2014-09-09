describe('Testing Ext5', function (t) {

    t.it('Should be possible to click a button', function(t) {
        var button      = new Ext.button.Button({
            text        : 'Button',
            renderTo    : document.body  
        })
        
        t.firesOk(button, 'click', 1, "1 click event is fired")

        t.chain(
            { click : button }
        )
    })

});

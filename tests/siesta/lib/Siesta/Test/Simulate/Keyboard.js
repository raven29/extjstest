/*

Siesta 2.0.9
Copyright(c) 2009-2014 Bryntum AB
http://bryntum.com/contact
http://bryntum.com/products/siesta/license

*/
/**
@class Siesta.Test.Simulate.Keyboard

This is a mixin, providing the keyboard events simulation functionality.


*/

//        Copyright (c) 2011 John Resig, http://jquery.com/

//        Permission is hereby granted, free of charge, to any person obtaining
//        a copy of this software and associated documentation files (the
//        "Software"), to deal in the Software without restriction, including
//        without limitation the rights to use, copy, modify, merge, publish,
//        distribute, sublicense, and/or sell copies of the Software, and to
//        permit persons to whom the Software is furnished to do so, subject to
//        the following conditions:

//        The above copyright notice and this permission notice shall be
//        included in all copies or substantial portions of the Software.

//        THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
//        EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
//        MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
//        NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
//        LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
//        OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
//        WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


Role('Siesta.Test.Simulate.Keyboard', {

    requires        : [ 'simulateEvent', 'getSimulateEventsWith', 'getElementAtCursor' ],

    methods: {
        // private
        createKeyboardEvent: function (type, options, el) {
            var evt;

            var e = $.extend({ bubbles: true, cancelable: true, view: this.global,
                ctrlKey: false, altKey: false, shiftKey: false, metaKey: false,
                keyCode: 0, charCode: 0
            }, options);

            var doc = el.ownerDocument;

            // use W3C standard when available and allowed by "simulateEventsWith" option
            if (doc.createEvent && this.getSimulateEventsWith() == 'dispatchEvent') {
                try {
                    evt = doc.createEvent("KeyEvents");
                    evt.initKeyEvent(type, e.bubbles, e.cancelable, e.view, e.ctrlKey, e.altKey, e.shiftKey, e.metaKey, e.keyCode, e.charCode);
                } catch (err) {
                    evt = doc.createEvent("Events");
                    evt.initEvent(type, e.bubbles, e.cancelable);
                    $.extend(evt, { view: e.view,
                        ctrlKey: e.ctrlKey, altKey: e.altKey, shiftKey: e.shiftKey, metaKey: e.metaKey,
                        keyCode: e.keyCode, charCode: e.charCode
                    });
                }
            } else if (doc.createEventObject) {
                evt = doc.createEventObject();
                $.extend(evt, e);
            }
            if ($.browser.msie || $.browser.opera) {
                evt.keyCode = (e.charCode > 0) ? e.charCode : e.keyCode;
                evt.charCode = undefined;
            }
            
            // IE10 somehow reports that "defaultPrevented" property of the event object is `false`
            // even that "preventDefault()" has been called on the object
            // more over, immediately after call to "preventDefault()" the property is updated
            // but down in stack it is replaced with "false" again somehow
            // we setup our own, additional property, indicating that event has been prevented
            if ($.browser.msie && $.browser.version == '10.0') {
                var prev    = evt.preventDefault
                
                if (prev) evt.preventDefault = function () {
                    this.$defaultPrevented  = true                    
                    return prev.apply(this, arguments)
                }
            }
            
            return evt;
        },

        // private
        createTextEvent: function (type, options, el) {
            var doc         = el.ownerDocument;
            var event       = null;

            // only for Webkit for now
            if (doc.createEvent && !$.browser.msie) {
                try {
                    event = doc.createEvent('TextEvent');

                    if (event && event.initTextEvent) {
                        event.initTextEvent('textInput', true, true, this.global, options.text, 0);
                        return event;
                    }
                }
                catch(e) {}
            }

            return null;
        },
        
        
        /*!
         * Based on:
         * 
         * @license EmulateTab
         * Copyright (c) 2011, 2012 The Swedish Post and Telecom Authority (PTS)
         * Developed for PTS by Joel Purra <http://joelpurra.se/>
         * Released under the BSD license.
         *
         * A jQuery plugin to emulate tabbing between elements on a page.
         */
        findNextFocusable : function (el, offset) {
            var $el         = this.$(el)
            
            var $focusable  = this.$(":input, a[href]", el.ownerDocument)
                .not(":disabled")
                .not(":hidden")
                .not("a[href]:empty");
                
            var escapeSelectorName  = function (str) {
                // Based on http://api.jquery.com/category/selectors/
                // Still untested
                return str.replace(/(!"#$%&'\(\)\*\+,\.\/:;<=>\?@\[\]^`\{\|\}~)/g, "\\\\$1");
            }

            if (
                el.tagName  === "INPUT" &&
                el.type     === "radio" &&
                el.name     !== ""
            ) {
                var name    = escapeSelectorName(el.name);

                $focusable  = $focusable
                    .not("input[type=radio][name=" + name + "]")
                    .add($el);
            }

            // Sort the inputs, by tabIndex if it is set
            var elsWithTabIndex = $focusable.filter('[tabindex]');

            elsWithTabIndex.sort(function(a, b) {
                return a.tabIndex < b.tabIndex ? -1 : 1;
            });

            elsWithTabIndex     = $(elsWithTabIndex.toArray().concat($focusable.filter(':not([tabindex])').toArray()));

            var currentIndex    = $(elsWithTabIndex).index($el);

            var nextIndex       = (currentIndex + offset) % elsWithTabIndex.length;
            var $next;

            // If we're at the last focusable element, focus the body el
            if (nextIndex > 0) {
                $next           = elsWithTabIndex.eq(nextIndex);
            }

            return $next && $next[ 0 ] || null;
        },
        
        
        emulateTab : function (el, offset) {
            var next        = this.findNextFocusable(el, offset || 1)
            
            if (next)  
                this.focus(next)
            else
                el.blur()
                
            return next
        },


        /**
        * This method will simulate keyboard typing on either a provided DOM element, or if omitted on the currently focuced DOM element.
        * Simulation of certain special keys such as ENTER, ESC, LEFT etc is supported.
        * You can type these special keys by using the all uppercase name the key inside square brackets. See {@link Siesta.Test.Simulate.KeyCodes} for a list
        * of key names.
        *
        * For example:
        *

    t.type(el, 'Foo bar[ENTER]', function () {
        ...
    })

    // With extra options as the last argument
    t.type(el, 'Foo bar[ENTER]', callback, scope, { shiftKey : true, altKey : true });
        *
        * The following events will be fired, in order: `keydown`, `keypress`, `keyup`
        *
        * @param {Siesta.Test.ActionTarget} el The element to type into
        * @param {String} text The text to type, including any names of special keys in square brackets.
        * @param {Function} callback (optional) To run this method async, provide a callback method to be called after the type operation is completed.
        * @param {Object} scope (optional) the scope for the callback
        * @param {Object} options (optional) any extra options used to configure the DOM key events (like holding shiftKey, ctrlKey, altKey etc).
        */
        type: function (el, text, callback, scope, options) {
            el              = this.normalizeElement(el || this.activeElement());

            // Some browsers (IE/FF) do not overwrite selected text, do it manually.
            var selText     = this.getSelectedText(el);

            if (selText) {
                el.value    = el.value.replace(selText, '');
            }

            var me          = this

            if (el.readOnly || el.disabled) {
                me.processCallbackFromTest(callback, null, scope || me)

                return;
            }

            // Extract normal chars, or special keys in brackets such as [TAB], [RIGHT] or [ENTER]			
            var keys        = (text + '').match(/(\[(?:\w|-)+\])|([\s\S])/g) || [];

            var queue       = new Siesta.Util.Queue({
                deferer         : this.originalSetTimeout,
                deferClearer    : this.originalClearTimeout,

                interval        : this.actionDelay,
                callbackDelay   : this.afterActionDelay,

                observeTest     : this,

                processor       : function (data, index) {
                    // 1. In IE10, it seems activeElement cannot be trusted as it sometimes returns an empty object with no properties.
                    // Try to detect this case and simply use the original el 
                    // 2. If user clicks around in the harness during ongoing test, the activeElement will be reset to BODY
                    // If this happens, reuse the original el and hope all is well
                    var focusedEl   = me.activeElement(true, el, el)
                    
                    me.keyPress(focusedEl, data.key, options)
                }
            })

            // Manually focus event to be typed into first
            queue.addStep({
                processor       : function () {
                    me.focus(el)
                }
            })

            // focus the element one more time for IE - this seems to fix the weird sporadic failures in 042_keyevent_simulation3.t.js
            // failures are caused by the field "blur" immediately after 1st focus
            // no Ext "focus/blur" methods seems to be called, so it can be a browser behavior
            $.browser.msie && queue.addStep({
                processor       : function () {
                    me.focus(el)
                }
            })
            
            jQuery.each(keys, function (index, key) {
                queue.addStep({
                    key     : key.length == 1 ? key : key.substring(1, key.length - 1)
                })
            });

            var async       = this.beginAsync();

            queue.run(function () {
                me.endAsync(async)

                me.processCallbackFromTest(callback, null, scope || me)
            })
        },

        /**
        * @param {Siesta.Test.ActionTarget} el
        * @param {String} key
        * @param {Object} options any extra options used to configure the DOM event
        *
        * This method will simluate the key press, translated to the specified DOM element.
        * The following events will be fired, in order: `keydown`, `keypress`, `textInput`(webkit only currently), `keyup`
        */
        keyPress: function (el, key, options) {
            el                  = this.normalizeElement(el);

            var KeyCodes        = Siesta.Test.Simulate.KeyCodes().keys
            var keyCode         = KeyCodes[ key.toUpperCase() ] || 0;

            options             = options || {};

            options.readableKey = key;

            var isReadableKey   = this.isReadableKey(keyCode)

            var charCode        = isReadableKey ? key.charCodeAt(0) : 0

            var me              = this,
                isTextInput     = me.isTextInput(el),
                isEditableNode  = me.isEditableNode(el),
                acceptsTextInput = isTextInput || isEditableNode;

            var keyDownEvent    = me.simulateEvent(el, 'keydown', $.extend({ charCode : 0, keyCode : keyCode }, options), true);
            var keyDownPrevented    = this.isEventPrevented(keyDownEvent)

            // Need to reevaluate focused element here, it may have changed in a 'keydown' listener
            el                  = me.activeElement(true, el, el);

            var event           = me.simulateEvent(el, 'keypress', $.extend({ charCode : charCode, keyCode : isReadableKey ? 0 : keyCode }, options), false);
            var prevented       = this.isEventPrevented(event)

            var supports        = Siesta.Harness.Browser.FeatureSupport().supports

            if (!keyDownPrevented && !prevented && keyCode === KeyCodes.TAB) {
                el              = this.emulateTab(el, options.shiftKey ? -1 : 1) || el;
            }
            
            if (!prevented && acceptsTextInput && keyCode != KeyCodes.TAB) {
                var isPhantomJS = this.harness.isPhantomJS
                var textValueProp = "value" in el ? "value" : "innerHTML";

                if (isReadableKey) {
                    // PhantomJS does not simulate the "textInput" event correctly if target element is inside an iframe
                    // (at least not as of 1.6), only the last character is shown.
                    if (!isPhantomJS) {

                        // IE10 tries to be 'helpful' by inserting an empty space, clean it
                        if (isEditableNode && $.browser.msie && el.innerHTML.indexOf('&nbsp;') === 0) {
                            el.innerHTML = el.innerHTML.substring(6);
                        }

                        // IE won't do execCommand with insertText
                        if (isEditableNode && !$.browser.msie) {
                            if (el.innerHTML.charCodeAt(el.innerHTML.length-1) === 8203) {
                                el.innerHTML = el.innerHTML.substring(0, el.innerHTML.length-1);
                            }
                            el.ownerDocument.execCommand('insertText', false, options.readableKey);
                        } else {
                            // TODO should check first if textInput event is supported
                            me.simulateEvent(el, 'textInput', { text: options.readableKey }, true);
                        }
                    }
                    
                    var originalLength  = el[textValueProp].length;
                    var maxLength       = el.getAttribute('maxlength')
                    
                    if (maxLength != null) maxLength    = Number(maxLength)

                    // If the entered char had no impact on the textfield - manually put it there
                    if ((isTextInput || $.browser.msie) && (!supports.canSimulateKeyCharacters || isPhantomJS) && originalLength === el[textValueProp].length && originalLength !== maxLength) {
                        el[textValueProp] = el[textValueProp] + options.readableKey;
                    }
                }

                // Manually delete one char off the end if backspace simulation is not supported by the browser
                if (keyCode === KeyCodes.BACKSPACE && !supports.canSimulateBackspace && el[textValueProp].length > 0) {
                    // IE won't do execCommand with insertText
                    if (isTextInput || $.browser.msie) {
                        el[textValueProp]    = el[textValueProp].substring(0, el[textValueProp].length - 1);
                    } else {
                        el.ownerDocument.execCommand('delete');
                    }
                }

                if (textValueProp === 'value' && keyCode === KeyCodes.ENTER && !supports.enterSubmitsForm) {
                    var form    = this.$(el).closest('form');

                    if (form.length) form.submit();
                }
            }

            // somehow "node.nodeName" is empty sometimes in IE10
            var nodeName        = el.nodeName && el.nodeName.toLowerCase()

            if ((nodeName == 'a' || nodeName == 'button') && keyCode === KeyCodes.ENTER && !supports.enterOnAnchorTriggersClick) {
                // this "click" should not update the current cursor position its merely for activating "click" listeners
                me.simulateEvent(el, 'click', { doNotUpdateCurrentPosition : true }, true);
            }
            me.simulateEvent(el, 'keyup', $.extend({ charCode : 0, keyCode : keyCode }, options), true);
        },
        

        isTextInput : function(node) {
            // somehow "node.nodeName" is empty sometimes in IE10
            var name    = node.nodeName && node.nodeName.toLowerCase(),
                type    = node.type && node.type.toLowerCase();

            return  name === 'textarea' ||
                    // Various INPUT types
                    (name === 'input' && (type === 'password'    ||
                                         type === 'number'      ||
                                         type === 'search'      ||
                                         type === 'text'        ||
                                         type === 'email'));
        },

        isEditableNode : function(node) {
            return node.ownerDocument.designMode.toLowerCase() === 'on' ||
                   node.contentEditable.toLowerCase() === 'true';
        },

        // private
        isReadableKey: function (keyCode) {
            var KC = Siesta.Test.Simulate.KeyCodes();

            return !KC.isNav(keyCode) && !KC.isSpecial(keyCode);
        }
    }
});



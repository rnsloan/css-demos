;(function (window, document) {

    'use strict';

    var defaultWidths, getKeys, isArray, nextTick;

    nextTick = window.requestAnimationFrame ||
               window.mozRequestAnimationFrame ||
               window.webkitRequestAnimationFrame ||
               function (callback) {
                   window.setTimeout(callback, 1000 / 60);
               };

    function applyEach (collection, callbackEach) {
        var i = 0,
            length = collection.length,
            new_collection = [];

        for (; i < length; i++) {
            new_collection[i] = callbackEach(collection[i]);
        }

        return new_collection;
    }

    function returnDirectValue (value) {
      return value;
    }

    defaultWidths = [96, 130, 165, 200, 235, 270, 304, 340, 375, 410, 445, 485, 520, 555, 590, 625, 660, 695, 736];

    getKeys = typeof Object.keys === 'function' ? Object.keys : function (object) {
        var keys = [],
            key;

        for (key in object) {
            keys.push(key);
        }

        return keys;
    };

    isArray = function isArray (object) {
        return Object.prototype.toString.call(object) === '[object Array]';
    };


    /*
        Construct a new Imager instance, passing an optional configuration object.

        Example usage:

            {
                // Available widths for your images
                availableWidths: [Number],

                // Selector to be used to locate your div placeholders
                selector: '',

                // Class name to give your resizable images
                className: '',

                // If set to true, Imager will update the src attribute of the relevant images
                onResize: Boolean,

                // Toggle the lazy load functionality on or off
                lazyload: Boolean,

                // Used alongside the lazyload feature (helps performance by setting a higher delay)
                scrollDelay: Number
            }

        @param {object} configuration settings
        @return {object} instance of Imager
     */
    function Imager (elements, opts) {
        var self = this,
            doc  = document;

        opts = opts || {};

        if (elements !== undefined) {
            // selector
            if (typeof elements === 'string') {
                opts.selector = elements;
                elements = undefined;
            }

            // config object
            else if (!elements.hasOwnProperty('length')) {
                opts = elements;
                elements = undefined;
            }
        }

        this.imagesOffScreen  = [];
        this.viewportHeight   = doc.documentElement.clientHeight;
        this.selector         = opts.selector || '.delayed-image-load';
        this.className        = opts.className || 'image-replace';
        this.gif              = doc.createElement('img');
        this.gif.src          = 'data:image/gif;base64,R0lGODlhEAAJAIAAAP///wAAACH5BAEAAAAALAAAAAAQAAkAAAIKhI+py+0Po5yUFQA7';
        this.gif.className    = this.className;
        this.gif.alt          = '';
        this.scrollDelay      = opts.scrollDelay || 250;
        this.onResize         = opts.hasOwnProperty('onResize') ? opts.onResize : true;
        this.lazyload         = opts.hasOwnProperty('lazyload') ? opts.lazyload : false;
        this.scrolled         = false;
        this.devicePixelRatio = Imager.getPixelRatio();

        if (opts.availableWidths === undefined) {
            opts.availableWidths = defaultWidths;
        }

        if (isArray(opts.availableWidths)) {
            this.availableWidths = opts.availableWidths;
            this.widthsMap = Imager.createWidthsMap(this.availableWidths);
        }
        else {
            this.availableWidths = getKeys(opts.availableWidths);
            this.widthsMap = opts.availableWidths;
        }

        this.availableWidths = this.availableWidths.sort(function (a, b) {
            return a - b;
        });

        if (elements) {
            this.divs = applyEach(elements, returnDirectValue);
            this.selector = null;
        }
        else {
            this.divs = applyEach(doc.querySelectorAll(this.selector), returnDirectValue);
        }

        this.changeDivsToEmptyImages();

        nextTick(function(){
            self.init();
        });
    }

    Imager.prototype.scrollCheck = function(){
        if (this.scrolled) {
            if (!this.imagesOffScreen.length) {
                window.clearInterval(this.interval);
            }

            this.divs = this.imagesOffScreen.slice(0); // copy by value, don't copy by reference
            this.imagesOffScreen.length = 0;
            this.changeDivsToEmptyImages();
            this.scrolled = false;
        }
    };

    Imager.prototype.init = function(){
        this.initialized = true;
        this.checkImagesNeedReplacing(this.divs);

        if (this.onResize) {
            this.registerResizeEvent();
        }

        if (this.lazyload) {
            this.registerScrollEvent();
        }
    };

    Imager.prototype.createGif = function (element) {
        // if the element is already a responsive image then we don't replace it again
        if (element.className.match(new RegExp('(^| )' + this.className + '( |$)'))) {
            return element;
        }

        var gif = this.gif.cloneNode(false);

        gif.width = element.getAttribute('data-width');
        gif.setAttribute('data-src', element.getAttribute('data-src'));

        element.parentNode.replaceChild(gif, element);

        return gif;
    };

    Imager.prototype.changeDivsToEmptyImages = function(){
        var divs = this.divs,
            i    = divs.length,
            element;

        while (i--) {
            element = divs[i];

            if (this.lazyload) {
                if (this.isThisElementOnScreen(element)) {
                    this.divs[i] = this.createGif(element);
                } else {
                    this.imagesOffScreen.push(element);
                }
            } else {
                this.divs[i] = this.createGif(element);
            }
        }

        if (this.initialized) {
            this.checkImagesNeedReplacing(this.divs);
        }
    };

    Imager.prototype.isThisElementOnScreen = function (element) {
        // document.body.scrollTop was working in Chrome but didn't work on Firefox, so had to resort to window.pageYOffset
        // but can't fallback to document.body.scrollTop as that doesn't work in IE with a doctype (?) so have to use document.documentElement.scrollTop
        var offset = (window.hasOwnProperty('pageYOffset')) ? window.pageYOffset : document.documentElement.scrollTop;

        return (element.offsetTop < (this.viewportHeight + offset)) ? true : false;
    };

    Imager.prototype.checkImagesNeedReplacing = function (images) {
        var i = images.length;

        if (!this.isResizing) {
            this.isResizing = true;

            while (i--) {
                this.replaceImagesBasedOnScreenDimensions(images[i]);
            }

            this.isResizing = false;
        }
    };

    Imager.prototype.replaceImagesBasedOnScreenDimensions = function (image) {
        var computedWidth, src;

        computedWidth = typeof this.availableWidths === 'function' ? this.availableWidths(image)
                                                                   : this.determineAppropriateResolution(image);

        src = this.changeImageSrcToUseNewImageDimensions(image.getAttribute('data-src'), computedWidth);

        image.src = src;
    };

    Imager.prototype.determineAppropriateResolution = function (image) {
        var imagewidth    = image.clientWidth,
            i             = this.availableWidths.length,
            selectedWidth = this.availableWidths[i - 1];

        while (i--) {
            if (imagewidth <= this.availableWidths[i]) {
                selectedWidth = this.availableWidths[i];
            }
        }

        return selectedWidth;
    };

    Imager.prototype.changeImageSrcToUseNewImageDimensions = function (src, selectedWidth) {
        return src
            .replace(/{width}/g, Imager.transforms.width(selectedWidth, this.widthsMap))
            .replace(/{pixel_ratio}/g, Imager.transforms.pixelRatio(this.devicePixelRatio));
    };

    Imager.getPixelRatio = function getPixelRatio(){
        return window.devicePixelRatio || 1;
    };

    Imager.createWidthsMap = function createWidthsMap (widths) {
        var map = {},
            i   = widths.length;

        while (i--) {
            map[widths[i]] = null;
        }

        return map;
    };

    Imager.transforms = {
        pixelRatio: function (value) {
            return value === 1 ? '' : '-' + value + 'x';
        },
        width: function (width, map) {
            return map[width] || width;
        }
    };

    Imager.prototype.registerResizeEvent = function(){
        var self = this;

        window.addEventListener('resize', function(){
            self.checkImagesNeedReplacing(self.divs);
        }, false);
    };

    Imager.prototype.registerScrollEvent = function (){
        var self = this;

        this.scrolled = false;

        this.interval = window.setInterval(function(){
            self.scrollCheck();
        }, self.scrollDelay);

        window.addEventListener('scroll', function(){
            self.scrolled = true;
        }, false);
    };

    /* global module, exports: true, define */
    if (typeof module === 'object' && typeof module.exports === 'object') {
        // CommonJS, just export
        module.exports = exports = Imager;
    } else if (typeof define === 'function' && define.amd) {
        // AMD support
        define(function () { return Imager; });
    } else if (typeof window === 'object') {
        // If no AMD and we are in the browser, attach to window
        window.Imager = Imager;
    }
    /* global -module, -exports, -define */

}(window, document));

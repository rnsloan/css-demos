function initSectionNavigation() {
    var navButton = document.getElementsByTagName('button')[0],
        sectionNav = document.querySelector('.js-section-nav');

    navButton.addEventListener('click', toggleSectionNavigation, false);

    function toggleSectionNavigation() {
        if (sectionNav.className.indexOf('section-nav--is-open') !== -1) {
            sectionNav.className = sectionNav.className.replace('section-nav--is-open', '');
            window.location.hash = '';
        } else {
            sectionNav.className += ' section-nav--is-open';
            window.location.hash = 'nav';
        }
    }

    //on page load
    if (window.location.hash === '#nav') {
        toggleSectionNavigation();
    }
}

function mobileSubNavigationToggle(state) {
    var headingLink = document.querySelector('.js-sub-nav__heading a');

    function toggleSubSectionNavigation(e) {
        var target = e.target || e.srcElement,
            nav = target.parentNode.parentNode;

        if (nav.className.indexOf('sub-nav--is-open') !== -1) {
            nav.className = nav.className.replace('sub-nav--is-open', '');
        } else {
            nav.className += ' sub-nav--is-open';
        }
    }

    if (state === 'on') {
        headingLink.addEventListener('click', toggleSubSectionNavigation, false);
    } else {
        headingLink.removeEventListener('click', toggleSubSectionNavigation, false);
    }
}

initSectionNavigation();

if (window.Harvey) {
    Harvey.attach('screen and (max-width: 50em)', {
        setup: function () {
        },
        on: function () {
            mobileSubNavigationToggle('on');
        },
        off: function () {
            mobileSubNavigationToggle('off');
        }
    });
} else {
    if (matchMedia('screen and (max-width: 800px)').matches) {
        mobileSubNavigationToggle('on');
    }
}
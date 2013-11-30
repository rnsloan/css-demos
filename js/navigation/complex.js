function sectionNavigation() {
    var navButton = document.getElementsByTagName('button')[0],
        nav = document.getElementsByTagName('nav')[0];

    navButton.addEventListener('click', toggleSectionNavigation, false);

    function toggleSectionNavigation() {
        if (nav.className.indexOf('js-section-nav-visible') !== -1) {
            nav.className = nav.className.replace('js-section-nav-visible', '');
            window.location.hash = '';
        } else {
            nav.className += ' js-section-nav-visible';
            window.location.hash = 'nav';
        }
    }

    //on page load
    if (window.location.hash === '#nav') {
        toggleSectionNavigation();
    }
}

function subSectionNavigation(state) {
    var headingLink = document.querySelector('.js-sub-nav__heading a');

    if (state === 'on') {
        headingLink.addEventListener('click', toggleSubSectionNavigation, false);
    } else {
        headingLink.removeEventListener('click', toggleSubSectionNavigation, false);
    }
}

function toggleSubSectionNavigation(e) {
    var target = e.target || e.srcElement,
        nav = target.parentNode.parentNode;

    if (nav.className.indexOf('js-sub-section-nav-visible') !== -1) {
        nav.className = nav.className.replace('js-sub-section-nav-visible', '');
    } else {
        nav.className += ' js-sub-section-nav-visible';
    }
}

sectionNavigation();

if (window.Harvey) {
    Harvey.attach('screen and (max-width: 50em)', {
        setup: function () {
        },
        on: function () {
            subSectionNavigation('on');
        },
        off: function () {
            subSectionNavigation('off');
        }
    });
} else {
    if (matchMedia('screen and (max-width: 800px)').matches) {
        subSectionNavigation('on');
    }
}
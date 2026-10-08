var EventJs = (function () {

    var timer = null;
    var ptimer = null;
    var ttimer = null;
    var lastQ = '';
    var seatArea = 'dining';
    var giftDelivery = 'email';

    function el(id) {
        return document.getElementById(id);
    }

    function val(id) {
        var e = el(id);
        return e ? (e.value || '').trim() : '';
    }

    function page() {
        var s = document.querySelector('.et-site');
        return s ? s.getAttribute('data-page') : '';
    }

    function openNav() {
        el('et-nav').classList.add('et-open');
        el('et-scrim').classList.add('et-open');
        document.body.style.overflow = 'hidden';
    }

    function closeNav() {
        el('et-nav').classList.remove('et-open');
        el('et-scrim').classList.remove('et-open');
        document.body.style.overflow = '';
    }

    function toggleSub(btn) {
        var li = btn.closest('.et-mi');
        if (li) {
            li.classList.toggle('et-exp');
        }
    }

    function search(value) {
        var q = (value || '').trim();
        clearTimeout(timer);
        if (q.length < 2) {
            closeSugg();
            lastQ = '';
            return;
        }
        timer = setTimeout(function () {
            if (q === lastQ && el('et-sugg').innerHTML !== '') {
                openSugg();
                return;
            }
            lastQ = q;
            $ApiRequest('Event/Search', JSON.stringify([{ key: 'q', vlu: q }]));
        }, 250);
    }

    function openSugg() {
        el('et-sugg').classList.add('et-open');
    }

    function closeSugg() {
        el('et-sugg').classList.remove('et-open');
    }

    function toast() {
        var t = el('et-toast');
        t.classList.add('et-open');
        clearTimeout(ttimer);
        ttimer = setTimeout(function () {
            t.classList.remove('et-open');
        }, 3600);
    }

    function shown(id) {
        var e = el(id);
        if (e) {
            e.classList.add('et-show');
        }
    }

    function openModal() {
        el('et-modal').classList.add('et-open');
        document.body.style.overflow = 'hidden';
    }

    function closeModal(e) {
        if (e && e.target && e.target.id !== 'et-modal') {
            return;
        }
        el('et-modal').classList.remove('et-open');
        document.body.style.overflow = '';
    }

    function values() {
        var list = [];
        var fields = document.querySelectorAll('.et-fv');
        for (var i = 0; i < fields.length; i++) {
            list.push({ key: fields[i].getAttribute('data-k'), vlu: (fields[i].value || '').trim() });
        }
        return list;
    }

    function filter() {
        $ApiRequest('Event/Filter', JSON.stringify(values()));
    }

    function chip(btn, value) {
        var chips = btn.parentNode.querySelectorAll('.et-chip');
        for (var i = 0; i < chips.length; i++) {
            chips[i].classList.remove('et-act');
        }
        btn.classList.add('et-act');
        var p = page();
        if (p === 'Menu') {
            el('et-f-course').value = value;
            filter();
        } else if (p === 'Wine') {
            el('et-f-type').value = value;
            filter();
        } else {
            $ApiRequest('Event/Filter', JSON.stringify([{ key: 'kind', vlu: value }]));
        }
    }

    function diet(btn) {
        btn.classList.toggle('et-act');
        var on = document.querySelectorAll('.et-chip-t.et-act');
        var list = [];
        for (var i = 0; i < on.length; i++) {
            list.push(on[i].getAttribute('data-d'));
        }
        el('et-f-diet').value = list.join('.');
        filter();
    }

    function view(id) {
        $ApiRequest('Event/View', JSON.stringify([{ key: 'id', vlu: id }]));
    }

    function estimate() {
        $ApiRequest('Event/Estimate', JSON.stringify([
            { key: 'menu', vlu: val('et-pmenu') },
            { key: 'guests', vlu: val('et-pguests') },
            { key: 'pairing', vlu: el('et-ppair').checked ? '1' : '' }
        ]));
    }

    function check() {
        $ApiRequest('Event/Check', JSON.stringify([
            { key: 'date', vlu: val('et-cdate') },
            { key: 'party', vlu: val('et-cparty') }
        ]));
    }

    function area(key) {
        seatArea = key;
        var b = document.querySelectorAll('.et-seg-b[data-a]');
        for (var i = 0; i < b.length; i++) {
            b[i].classList.toggle('et-act', b[i].getAttribute('data-a') === key);
        }
        var notes = {
            dining: 'Our main room, linen-laid tables and soft candlelight.',
            bar: 'The full menu at the bar for up to 3 guests; walk-ins welcome too.',
            counter: 'Eight seats facing the kitchen; Chef’s Counter menu only, Wednesday to Saturday at 6:00 and 8:30.'
        };
        el('et-area-note').textContent = notes[key] || '';
        find();
    }

    function find() {
        $WaitOn();
        $ApiRequest('Event/Find', JSON.stringify([
            { key: 'date', vlu: val('et-date') },
            { key: 'party', vlu: val('et-party') },
            { key: 'area', vlu: seatArea }
        ]));
    }

    function pick(btn) {
        var t = document.querySelectorAll('.et-time');
        for (var i = 0; i < t.length; i++) {
            t[i].classList.remove('et-act');
        }
        btn.classList.add('et-act');
        picked(btn.getAttribute('data-t'), btn.getAttribute('data-l'));
        var f = el('et-form');
        if (f && window.innerWidth < 1024) {
            f.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function picked(time, label) {
        el('et-time').value = time || '';
        var p = el('et-picked');
        if (time) {
            p.innerHTML = '';
            var b = document.createElement('b');
            b.textContent = label || time;
            p.appendChild(b);
            p.classList.add('et-on');
        } else {
            p.innerHTML = '<span>Choose a time above.</span>';
            p.classList.remove('et-on');
        }
    }

    function bookTable() {
        $WaitOn();
        $ApiRequest('Event/Book', JSON.stringify([
            { key: 'date', vlu: val('et-date') },
            { key: 'party', vlu: val('et-party') },
            { key: 'area', vlu: seatArea },
            { key: 'time', vlu: val('et-time') },
            { key: 'name', vlu: val('et-name') },
            { key: 'phone', vlu: val('et-phone') },
            { key: 'email', vlu: val('et-email') },
            { key: 'occasion', vlu: val('et-occasion') },
            { key: 'notes', vlu: val('et-notes') },
            { key: 'agree', vlu: el('et-agree').checked ? '1' : '' }
        ]));
    }

    function bookEvent() {
        $WaitOn();
        $ApiRequest('Event/Book', JSON.stringify([
            { key: 'id', vlu: val('et-id') },
            { key: 'guests', vlu: val('et-guests') },
            { key: 'name', vlu: val('et-name') },
            { key: 'phone', vlu: val('et-phone') },
            { key: 'email', vlu: val('et-email') },
            { key: 'notes', vlu: val('et-notes') }
        ]));
    }

    function book() {
        if (page() === 'Event') {
            bookEvent();
        } else {
            bookTable();
        }
    }

    function booked() {
        var d = el('et-done');
        d.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function seats() {
        $ApiRequest('Event/Seats', JSON.stringify([
            { key: 'id', vlu: val('et-id') },
            { key: 'guests', vlu: val('et-guests') }
        ]));
    }

    function inquire() {
        $WaitOn();
        $ApiRequest('Event/Inquire', JSON.stringify([
            { key: 'name', vlu: val('et-name') },
            { key: 'phone', vlu: val('et-phone') },
            { key: 'email', vlu: val('et-email') },
            { key: 'date', vlu: val('et-date') },
            { key: 'guests', vlu: val('et-guests') },
            { key: 'room', vlu: val('et-room') },
            { key: 'notes', vlu: val('et-notes') }
        ]));
    }

    function pair() {
        $ApiRequest('Event/Pair', JSON.stringify([{ key: 'dish', vlu: val('et-dish') }]));
    }

    function amount(btn, v) {
        var c = document.querySelectorAll('#et-amts .et-chip, #et-exps .et-chip');
        for (var i = 0; i < c.length; i++) {
            c[i].classList.remove('et-act');
        }
        btn.classList.add('et-act');
        el('et-custom').value = '';
        el('et-amount').value = v;
        preview();
    }

    function custom() {
        var v = val('et-custom');
        var c = document.querySelectorAll('#et-amts .et-chip, #et-exps .et-chip');
        for (var i = 0; i < c.length; i++) {
            c[i].classList.remove('et-act');
        }
        el('et-amount').value = v;
        preview();
    }

    function design() {
        var d = document.querySelector('input[name="et-design"]:checked');
        return d ? d.value : '';
    }

    function giftData() {
        return [
            { key: 'amount', vlu: val('et-amount') },
            { key: 'design', vlu: design() },
            { key: 'to', vlu: val('et-to') },
            { key: 'from', vlu: val('et-from') },
            { key: 'msg', vlu: val('et-msg') }
        ];
    }

    function preview() {
        clearTimeout(ptimer);
        ptimer = setTimeout(function () {
            $ApiRequest('Event/Preview', JSON.stringify(giftData()));
        }, 220);
    }

    function delivery(d) {
        giftDelivery = d;
        var b = document.querySelectorAll('.et-seg-b[data-d]');
        for (var i = 0; i < b.length; i++) {
            b[i].classList.toggle('et-act', b[i].getAttribute('data-d') === d);
        }
        el('et-remail-l').classList.toggle('et-hide', d === 'print');
    }

    function buy() {
        $WaitOn();
        $ApiRequest('Event/Buy', JSON.stringify(giftData().concat([
            { key: 'delivery', vlu: giftDelivery },
            { key: 'remail', vlu: val('et-remail') },
            { key: 'send', vlu: val('et-send') },
            { key: 'email', vlu: val('et-email') }
        ])));
    }

    function bought() {
        el('et-done').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function send() {
        $WaitOn();
        $ApiRequest('Event/Send', JSON.stringify([
            { key: 'name', vlu: val('et-name') },
            { key: 'email', vlu: val('et-email') },
            { key: 'topic', vlu: val('et-topic') },
            { key: 'message', vlu: val('et-msg') }
        ]));
    }

    function sent() {
        var f = el('et-form');
        if (!f) {
            return;
        }
        var fields = f.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea');
        for (var i = 0; i < fields.length; i++) {
            fields[i].value = '';
        }
    }

    function subscribe() {
        $ApiRequest('Event/Subscribe', JSON.stringify([{ key: 'email', vlu: val('et-nl-email') }]));
    }

    function subscribed() {
        el('et-nl-email').value = '';
    }

    function reveal() {
        document.addEventListener('click', function (e) {
            var box = el('et-search');
            if (box && !box.contains(e.target)) {
                closeSugg();
            }
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                closeSugg();
                closeNav();
                closeModal();
            }
        });
        window.addEventListener('scroll', function () {
            var h = el('et-head');
            if (h) {
                h.classList.toggle('et-scrolled', window.pageYOffset > 8);
            }
        }, { passive: true });
        window.addEventListener('resize', function () {
            if (window.innerWidth > 767) {
                closeNav();
            }
        });
        if (page() === 'Reservation' && val('et-time') !== '') {
            el('et-picked').classList.add('et-on');
        }
    }

    return {
        reveal: function () { reveal(); },
        openNav: function () { openNav(); },
        closeNav: function () { closeNav(); },
        toggleSub: function (btn) { toggleSub(btn); },
        search: function (v) { search(v); },
        openSugg: function () { openSugg(); },
        closeSugg: function () { closeSugg(); },
        toast: function () { toast(); },
        shown: function (id) { shown(id); },
        openModal: function () { openModal(); },
        closeModal: function (e) { closeModal(e); },
        filter: function () { filter(); },
        chip: function (btn, v) { chip(btn, v); },
        diet: function (btn) { diet(btn); },
        view: function (id) { view(id); },
        estimate: function () { estimate(); },
        check: function () { check(); },
        area: function (k) { area(k); },
        find: function () { find(); },
        pick: function (btn) { pick(btn); },
        picked: function (t, l) { picked(t, l); },
        book: function () { book(); },
        booked: function () { booked(); },
        seats: function () { seats(); },
        inquire: function () { inquire(); },
        pair: function () { pair(); },
        amount: function (btn, v) { amount(btn, v); },
        custom: function () { custom(); },
        preview: function () { preview(); },
        delivery: function (d) { delivery(d); },
        buy: function () { buy(); },
        bought: function () { bought(); },
        send: function () { send(); },
        sent: function () { sent(); },
        subscribe: function () { subscribe(); },
        subscribed: function () { subscribed(); }
    };

})();

EventJs.reveal();

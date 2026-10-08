var EventsJs = (function () {

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
        var s = document.querySelector('.ev-site');
        return s ? s.getAttribute('data-page') : '';
    }

    function openNav() {
        el('ev-nav').classList.add('ev-open');
        el('ev-scrim').classList.add('ev-open');
        document.body.style.overflow = 'hidden';
    }

    function closeNav() {
        el('ev-nav').classList.remove('ev-open');
        el('ev-scrim').classList.remove('ev-open');
        document.body.style.overflow = '';
    }

    function toggleSub(btn) {
        var li = btn.closest('.ev-mi');
        if (li) {
            li.classList.toggle('ev-exp');
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
            if (q === lastQ && el('ev-sugg').innerHTML !== '') {
                openSugg();
                return;
            }
            lastQ = q;
            $ApiRequest('Events/Search', JSON.stringify([{ key: 'q', vlu: q }]));
        }, 250);
    }

    function openSugg() {
        el('ev-sugg').classList.add('ev-open');
    }

    function closeSugg() {
        el('ev-sugg').classList.remove('ev-open');
    }

    function toast() {
        var t = el('ev-toast');
        t.classList.add('ev-open');
        clearTimeout(ttimer);
        ttimer = setTimeout(function () {
            t.classList.remove('ev-open');
        }, 3600);
    }

    function shown(id) {
        var e = el(id);
        if (e) {
            e.classList.add('ev-show');
        }
    }

    function openModal() {
        el('ev-modal').classList.add('ev-open');
        document.body.style.overflow = 'hidden';
    }

    function closeModal(e) {
        if (e && e.target && e.target.id !== 'ev-modal') {
            return;
        }
        el('ev-modal').classList.remove('ev-open');
        document.body.style.overflow = '';
    }

    function values() {
        var list = [];
        var fields = document.querySelectorAll('.ev-fv');
        for (var i = 0; i < fields.length; i++) {
            list.push({ key: fields[i].getAttribute('data-k'), vlu: (fields[i].value || '').trim() });
        }
        return list;
    }

    function filter() {
        $ApiRequest('Events/Filter', JSON.stringify(values()));
    }

    function chip(btn, value) {
        var chips = btn.parentNode.querySelectorAll('.ev-chip');
        for (var i = 0; i < chips.length; i++) {
            chips[i].classList.remove('ev-act');
        }
        btn.classList.add('ev-act');
        var p = page();
        if (p === 'Menu') {
            el('ev-f-course').value = value;
            filter();
        } else if (p === 'Wine') {
            el('ev-f-type').value = value;
            filter();
        } else {
            $ApiRequest('Events/Filter', JSON.stringify([{ key: 'kind', vlu: value }]));
        }
    }

    function diet(btn) {
        btn.classList.toggle('ev-act');
        var on = document.querySelectorAll('.ev-chip-t.ev-act');
        var list = [];
        for (var i = 0; i < on.length; i++) {
            list.push(on[i].getAttribute('data-d'));
        }
        el('ev-f-diet').value = list.join('.');
        filter();
    }

    function view(id) {
        $ApiRequest('Events/View', JSON.stringify([{ key: 'id', vlu: id }]));
    }

    function estimate() {
        $ApiRequest('Events/Estimate', JSON.stringify([
            { key: 'menu', vlu: val('ev-pmenu') },
            { key: 'guests', vlu: val('ev-pguests') },
            { key: 'pairing', vlu: el('ev-ppair').checked ? '1' : '' }
        ]));
    }

    function check() {
        $ApiRequest('Events/Check', JSON.stringify([
            { key: 'date', vlu: val('ev-cdate') },
            { key: 'party', vlu: val('ev-cparty') }
        ]));
    }

    function area(key) {
        seatArea = key;
        var b = document.querySelectorAll('.ev-seg-b[data-a]');
        for (var i = 0; i < b.length; i++) {
            b[i].classList.toggle('ev-act', b[i].getAttribute('data-a') === key);
        }
        var notes = {
            dining: 'Our main room, linen-laid tables and soft candlelight.',
            bar: 'The full menu at the bar for up to 3 guests; walk-ins welcome too.',
            counter: 'Eight seats facing the kitchen; Chef’s Counter menu only, Wednesday to Saturday at 6:00 and 8:30.'
        };
        el('ev-area-note').textContent = notes[key] || '';
        find();
    }

    function find() {
        $WaitOn();
        $ApiRequest('Events/Find', JSON.stringify([
            { key: 'date', vlu: val('ev-date') },
            { key: 'party', vlu: val('ev-party') },
            { key: 'area', vlu: seatArea }
        ]));
    }

    function pick(btn) {
        var t = document.querySelectorAll('.ev-time');
        for (var i = 0; i < t.length; i++) {
            t[i].classList.remove('ev-act');
        }
        btn.classList.add('ev-act');
        picked(btn.getAttribute('data-t'), btn.getAttribute('data-l'));
        var f = el('ev-form');
        if (f && window.innerWidth < 1024) {
            f.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function picked(time, label) {
        el('ev-time').value = time || '';
        var p = el('ev-picked');
        if (time) {
            p.innerHTML = '';
            var b = document.createElement('b');
            b.textContent = label || time;
            p.appendChild(b);
            p.classList.add('ev-on');
        } else {
            p.innerHTML = '<span>Choose a time above.</span>';
            p.classList.remove('ev-on');
        }
    }

    function bookTable() {
        $WaitOn();
        $ApiRequest('Events/Book', JSON.stringify([
            { key: 'date', vlu: val('ev-date') },
            { key: 'party', vlu: val('ev-party') },
            { key: 'area', vlu: seatArea },
            { key: 'time', vlu: val('ev-time') },
            { key: 'name', vlu: val('ev-name') },
            { key: 'phone', vlu: val('ev-phone') },
            { key: 'email', vlu: val('ev-email') },
            { key: 'occasion', vlu: val('ev-occasion') },
            { key: 'notes', vlu: val('ev-notes') },
            { key: 'agree', vlu: el('ev-agree').checked ? '1' : '' }
        ]));
    }

    function bookEvent() {
        $WaitOn();
        $ApiRequest('Events/Book', JSON.stringify([
            { key: 'id', vlu: val('ev-id') },
            { key: 'guests', vlu: val('ev-guests') },
            { key: 'name', vlu: val('ev-name') },
            { key: 'phone', vlu: val('ev-phone') },
            { key: 'email', vlu: val('ev-email') },
            { key: 'notes', vlu: val('ev-notes') }
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
        var d = el('ev-done');
        d.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function seats() {
        $ApiRequest('Events/Seats', JSON.stringify([
            { key: 'id', vlu: val('ev-id') },
            { key: 'guests', vlu: val('ev-guests') }
        ]));
    }

    function inquire() {
        $WaitOn();
        $ApiRequest('Events/Inquire', JSON.stringify([
            { key: 'name', vlu: val('ev-name') },
            { key: 'phone', vlu: val('ev-phone') },
            { key: 'email', vlu: val('ev-email') },
            { key: 'date', vlu: val('ev-date') },
            { key: 'guests', vlu: val('ev-guests') },
            { key: 'room', vlu: val('ev-room') },
            { key: 'notes', vlu: val('ev-notes') }
        ]));
    }

    function pair() {
        $ApiRequest('Events/Pair', JSON.stringify([{ key: 'dish', vlu: val('ev-dish') }]));
    }

    function amount(btn, v) {
        var c = document.querySelectorAll('#ev-amts .ev-chip, #ev-exps .ev-chip');
        for (var i = 0; i < c.length; i++) {
            c[i].classList.remove('ev-act');
        }
        btn.classList.add('ev-act');
        el('ev-custom').value = '';
        el('ev-amount').value = v;
        preview();
    }

    function custom() {
        var v = val('ev-custom');
        var c = document.querySelectorAll('#ev-amts .ev-chip, #ev-exps .ev-chip');
        for (var i = 0; i < c.length; i++) {
            c[i].classList.remove('ev-act');
        }
        el('ev-amount').value = v;
        preview();
    }

    function design() {
        var d = document.querySelector('input[name="ev-design"]:checked');
        return d ? d.value : '';
    }

    function giftData() {
        return [
            { key: 'amount', vlu: val('ev-amount') },
            { key: 'design', vlu: design() },
            { key: 'to', vlu: val('ev-to') },
            { key: 'from', vlu: val('ev-from') },
            { key: 'msg', vlu: val('ev-msg') }
        ];
    }

    function preview() {
        clearTimeout(ptimer);
        ptimer = setTimeout(function () {
            $ApiRequest('Events/Preview', JSON.stringify(giftData()));
        }, 220);
    }

    function delivery(d) {
        giftDelivery = d;
        var b = document.querySelectorAll('.ev-seg-b[data-d]');
        for (var i = 0; i < b.length; i++) {
            b[i].classList.toggle('ev-act', b[i].getAttribute('data-d') === d);
        }
        el('ev-remail-l').classList.toggle('ev-hide', d === 'print');
    }

    function buy() {
        $WaitOn();
        $ApiRequest('Events/Buy', JSON.stringify(giftData().concat([
            { key: 'delivery', vlu: giftDelivery },
            { key: 'remail', vlu: val('ev-remail') },
            { key: 'send', vlu: val('ev-send') },
            { key: 'email', vlu: val('ev-email') }
        ])));
    }

    function bought() {
        el('ev-done').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function send() {
        $WaitOn();
        $ApiRequest('Events/Send', JSON.stringify([
            { key: 'name', vlu: val('ev-name') },
            { key: 'email', vlu: val('ev-email') },
            { key: 'topic', vlu: val('ev-topic') },
            { key: 'message', vlu: val('ev-msg') }
        ]));
    }

    function sent() {
        var f = el('ev-form');
        if (!f) {
            return;
        }
        var fields = f.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea');
        for (var i = 0; i < fields.length; i++) {
            fields[i].value = '';
        }
    }

    function subscribe() {
        $ApiRequest('Events/Subscribe', JSON.stringify([{ key: 'email', vlu: val('ev-nl-email') }]));
    }

    function subscribed() {
        el('ev-nl-email').value = '';
    }

    function reveal() {
        document.addEventListener('click', function (e) {
            var box = el('ev-search');
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
            var h = el('ev-head');
            if (h) {
                h.classList.toggle('ev-scrolled', window.pageYOffset > 8);
            }
        }, { passive: true });
        window.addEventListener('resize', function () {
            if (window.innerWidth > 767) {
                closeNav();
            }
        });
        if (page() === 'Reservation' && val('ev-time') !== '') {
            el('ev-picked').classList.add('ev-on');
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

EventsJs.reveal();

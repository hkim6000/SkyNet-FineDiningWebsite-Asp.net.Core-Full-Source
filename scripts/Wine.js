var WineJs = (function () {

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
        var s = document.querySelector('.wn-site');
        return s ? s.getAttribute('data-page') : '';
    }

    function openNav() {
        el('wn-nav').classList.add('wn-open');
        el('wn-scrim').classList.add('wn-open');
        document.body.style.overflow = 'hidden';
    }

    function closeNav() {
        el('wn-nav').classList.remove('wn-open');
        el('wn-scrim').classList.remove('wn-open');
        document.body.style.overflow = '';
    }

    function toggleSub(btn) {
        var li = btn.closest('.wn-mi');
        if (li) {
            li.classList.toggle('wn-exp');
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
            if (q === lastQ && el('wn-sugg').innerHTML !== '') {
                openSugg();
                return;
            }
            lastQ = q;
            $ApiRequest('Wine/Search', JSON.stringify([{ key: 'q', vlu: q }]));
        }, 250);
    }

    function openSugg() {
        el('wn-sugg').classList.add('wn-open');
    }

    function closeSugg() {
        el('wn-sugg').classList.remove('wn-open');
    }

    function toast() {
        var t = el('wn-toast');
        t.classList.add('wn-open');
        clearTimeout(ttimer);
        ttimer = setTimeout(function () {
            t.classList.remove('wn-open');
        }, 3600);
    }

    function shown(id) {
        var e = el(id);
        if (e) {
            e.classList.add('wn-show');
        }
    }

    function openModal() {
        el('wn-modal').classList.add('wn-open');
        document.body.style.overflow = 'hidden';
    }

    function closeModal(e) {
        if (e && e.target && e.target.id !== 'wn-modal') {
            return;
        }
        el('wn-modal').classList.remove('wn-open');
        document.body.style.overflow = '';
    }

    function values() {
        var list = [];
        var fields = document.querySelectorAll('.wn-fv');
        for (var i = 0; i < fields.length; i++) {
            list.push({ key: fields[i].getAttribute('data-k'), vlu: (fields[i].value || '').trim() });
        }
        return list;
    }

    function filter() {
        $ApiRequest('Wine/Filter', JSON.stringify(values()));
    }

    function chip(btn, value) {
        var chips = btn.parentNode.querySelectorAll('.wn-chip');
        for (var i = 0; i < chips.length; i++) {
            chips[i].classList.remove('wn-act');
        }
        btn.classList.add('wn-act');
        var p = page();
        if (p === 'Menu') {
            el('wn-f-course').value = value;
            filter();
        } else if (p === 'Wine') {
            el('wn-f-type').value = value;
            filter();
        } else {
            $ApiRequest('Wine/Filter', JSON.stringify([{ key: 'kind', vlu: value }]));
        }
    }

    function diet(btn) {
        btn.classList.toggle('wn-act');
        var on = document.querySelectorAll('.wn-chip-t.wn-act');
        var list = [];
        for (var i = 0; i < on.length; i++) {
            list.push(on[i].getAttribute('data-d'));
        }
        el('wn-f-diet').value = list.join('.');
        filter();
    }

    function view(id) {
        $ApiRequest('Wine/View', JSON.stringify([{ key: 'id', vlu: id }]));
    }

    function estimate() {
        $ApiRequest('Wine/Estimate', JSON.stringify([
            { key: 'menu', vlu: val('wn-pmenu') },
            { key: 'guests', vlu: val('wn-pguests') },
            { key: 'pairing', vlu: el('wn-ppair').checked ? '1' : '' }
        ]));
    }

    function check() {
        $ApiRequest('Wine/Check', JSON.stringify([
            { key: 'date', vlu: val('wn-cdate') },
            { key: 'party', vlu: val('wn-cparty') }
        ]));
    }

    function area(key) {
        seatArea = key;
        var b = document.querySelectorAll('.wn-seg-b[data-a]');
        for (var i = 0; i < b.length; i++) {
            b[i].classList.toggle('wn-act', b[i].getAttribute('data-a') === key);
        }
        var notes = {
            dining: 'Our main room, linen-laid tables and soft candlelight.',
            bar: 'The full menu at the bar for up to 3 guests; walk-ins welcome too.',
            counter: 'Eight seats facing the kitchen; Chef’s Counter menu only, Wednesday to Saturday at 6:00 and 8:30.'
        };
        el('wn-area-note').textContent = notes[key] || '';
        find();
    }

    function find() {
        $WaitOn();
        $ApiRequest('Wine/Find', JSON.stringify([
            { key: 'date', vlu: val('wn-date') },
            { key: 'party', vlu: val('wn-party') },
            { key: 'area', vlu: seatArea }
        ]));
    }

    function pick(btn) {
        var t = document.querySelectorAll('.wn-time');
        for (var i = 0; i < t.length; i++) {
            t[i].classList.remove('wn-act');
        }
        btn.classList.add('wn-act');
        picked(btn.getAttribute('data-t'), btn.getAttribute('data-l'));
        var f = el('wn-form');
        if (f && window.innerWidth < 1024) {
            f.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function picked(time, label) {
        el('wn-time').value = time || '';
        var p = el('wn-picked');
        if (time) {
            p.innerHTML = '';
            var b = document.createElement('b');
            b.textContent = label || time;
            p.appendChild(b);
            p.classList.add('wn-on');
        } else {
            p.innerHTML = '<span>Choose a time above.</span>';
            p.classList.remove('wn-on');
        }
    }

    function bookTable() {
        $WaitOn();
        $ApiRequest('Wine/Book', JSON.stringify([
            { key: 'date', vlu: val('wn-date') },
            { key: 'party', vlu: val('wn-party') },
            { key: 'area', vlu: seatArea },
            { key: 'time', vlu: val('wn-time') },
            { key: 'name', vlu: val('wn-name') },
            { key: 'phone', vlu: val('wn-phone') },
            { key: 'email', vlu: val('wn-email') },
            { key: 'occasion', vlu: val('wn-occasion') },
            { key: 'notes', vlu: val('wn-notes') },
            { key: 'agree', vlu: el('wn-agree').checked ? '1' : '' }
        ]));
    }

    function bookEvent() {
        $WaitOn();
        $ApiRequest('Wine/Book', JSON.stringify([
            { key: 'id', vlu: val('wn-id') },
            { key: 'guests', vlu: val('wn-guests') },
            { key: 'name', vlu: val('wn-name') },
            { key: 'phone', vlu: val('wn-phone') },
            { key: 'email', vlu: val('wn-email') },
            { key: 'notes', vlu: val('wn-notes') }
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
        var d = el('wn-done');
        d.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function seats() {
        $ApiRequest('Wine/Seats', JSON.stringify([
            { key: 'id', vlu: val('wn-id') },
            { key: 'guests', vlu: val('wn-guests') }
        ]));
    }

    function inquire() {
        $WaitOn();
        $ApiRequest('Wine/Inquire', JSON.stringify([
            { key: 'name', vlu: val('wn-name') },
            { key: 'phone', vlu: val('wn-phone') },
            { key: 'email', vlu: val('wn-email') },
            { key: 'date', vlu: val('wn-date') },
            { key: 'guests', vlu: val('wn-guests') },
            { key: 'room', vlu: val('wn-room') },
            { key: 'notes', vlu: val('wn-notes') }
        ]));
    }

    function pair() {
        $ApiRequest('Wine/Pair', JSON.stringify([{ key: 'dish', vlu: val('wn-dish') }]));
    }

    function amount(btn, v) {
        var c = document.querySelectorAll('#wn-amts .wn-chip, #wn-exps .wn-chip');
        for (var i = 0; i < c.length; i++) {
            c[i].classList.remove('wn-act');
        }
        btn.classList.add('wn-act');
        el('wn-custom').value = '';
        el('wn-amount').value = v;
        preview();
    }

    function custom() {
        var v = val('wn-custom');
        var c = document.querySelectorAll('#wn-amts .wn-chip, #wn-exps .wn-chip');
        for (var i = 0; i < c.length; i++) {
            c[i].classList.remove('wn-act');
        }
        el('wn-amount').value = v;
        preview();
    }

    function design() {
        var d = document.querySelector('input[name="wn-design"]:checked');
        return d ? d.value : '';
    }

    function giftData() {
        return [
            { key: 'amount', vlu: val('wn-amount') },
            { key: 'design', vlu: design() },
            { key: 'to', vlu: val('wn-to') },
            { key: 'from', vlu: val('wn-from') },
            { key: 'msg', vlu: val('wn-msg') }
        ];
    }

    function preview() {
        clearTimeout(ptimer);
        ptimer = setTimeout(function () {
            $ApiRequest('Wine/Preview', JSON.stringify(giftData()));
        }, 220);
    }

    function delivery(d) {
        giftDelivery = d;
        var b = document.querySelectorAll('.wn-seg-b[data-d]');
        for (var i = 0; i < b.length; i++) {
            b[i].classList.toggle('wn-act', b[i].getAttribute('data-d') === d);
        }
        el('wn-remail-l').classList.toggle('wn-hide', d === 'print');
    }

    function buy() {
        $WaitOn();
        $ApiRequest('Wine/Buy', JSON.stringify(giftData().concat([
            { key: 'delivery', vlu: giftDelivery },
            { key: 'remail', vlu: val('wn-remail') },
            { key: 'send', vlu: val('wn-send') },
            { key: 'email', vlu: val('wn-email') }
        ])));
    }

    function bought() {
        el('wn-done').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function send() {
        $WaitOn();
        $ApiRequest('Wine/Send', JSON.stringify([
            { key: 'name', vlu: val('wn-name') },
            { key: 'email', vlu: val('wn-email') },
            { key: 'topic', vlu: val('wn-topic') },
            { key: 'message', vlu: val('wn-msg') }
        ]));
    }

    function sent() {
        var f = el('wn-form');
        if (!f) {
            return;
        }
        var fields = f.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea');
        for (var i = 0; i < fields.length; i++) {
            fields[i].value = '';
        }
    }

    function subscribe() {
        $ApiRequest('Wine/Subscribe', JSON.stringify([{ key: 'email', vlu: val('wn-nl-email') }]));
    }

    function subscribed() {
        el('wn-nl-email').value = '';
    }

    function reveal() {
        document.addEventListener('click', function (e) {
            var box = el('wn-search');
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
            var h = el('wn-head');
            if (h) {
                h.classList.toggle('wn-scrolled', window.pageYOffset > 8);
            }
        }, { passive: true });
        window.addEventListener('resize', function () {
            if (window.innerWidth > 767) {
                closeNav();
            }
        });
        if (page() === 'Reservation' && val('wn-time') !== '') {
            el('wn-picked').classList.add('wn-on');
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

WineJs.reveal();

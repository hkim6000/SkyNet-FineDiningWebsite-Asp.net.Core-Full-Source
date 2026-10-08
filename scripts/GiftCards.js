var GiftCardsJs = (function () {

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
        var s = document.querySelector('.gc-site');
        return s ? s.getAttribute('data-page') : '';
    }

    function openNav() {
        el('gc-nav').classList.add('gc-open');
        el('gc-scrim').classList.add('gc-open');
        document.body.style.overflow = 'hidden';
    }

    function closeNav() {
        el('gc-nav').classList.remove('gc-open');
        el('gc-scrim').classList.remove('gc-open');
        document.body.style.overflow = '';
    }

    function toggleSub(btn) {
        var li = btn.closest('.gc-mi');
        if (li) {
            li.classList.toggle('gc-exp');
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
            if (q === lastQ && el('gc-sugg').innerHTML !== '') {
                openSugg();
                return;
            }
            lastQ = q;
            $ApiRequest('GiftCards/Search', JSON.stringify([{ key: 'q', vlu: q }]));
        }, 250);
    }

    function openSugg() {
        el('gc-sugg').classList.add('gc-open');
    }

    function closeSugg() {
        el('gc-sugg').classList.remove('gc-open');
    }

    function toast() {
        var t = el('gc-toast');
        t.classList.add('gc-open');
        clearTimeout(ttimer);
        ttimer = setTimeout(function () {
            t.classList.remove('gc-open');
        }, 3600);
    }

    function shown(id) {
        var e = el(id);
        if (e) {
            e.classList.add('gc-show');
        }
    }

    function openModal() {
        el('gc-modal').classList.add('gc-open');
        document.body.style.overflow = 'hidden';
    }

    function closeModal(e) {
        if (e && e.target && e.target.id !== 'gc-modal') {
            return;
        }
        el('gc-modal').classList.remove('gc-open');
        document.body.style.overflow = '';
    }

    function values() {
        var list = [];
        var fields = document.querySelectorAll('.gc-fv');
        for (var i = 0; i < fields.length; i++) {
            list.push({ key: fields[i].getAttribute('data-k'), vlu: (fields[i].value || '').trim() });
        }
        return list;
    }

    function filter() {
        $ApiRequest('GiftCards/Filter', JSON.stringify(values()));
    }

    function chip(btn, value) {
        var chips = btn.parentNode.querySelectorAll('.gc-chip');
        for (var i = 0; i < chips.length; i++) {
            chips[i].classList.remove('gc-act');
        }
        btn.classList.add('gc-act');
        var p = page();
        if (p === 'Menu') {
            el('gc-f-course').value = value;
            filter();
        } else if (p === 'Wine') {
            el('gc-f-type').value = value;
            filter();
        } else {
            $ApiRequest('GiftCards/Filter', JSON.stringify([{ key: 'kind', vlu: value }]));
        }
    }

    function diet(btn) {
        btn.classList.toggle('gc-act');
        var on = document.querySelectorAll('.gc-chip-t.gc-act');
        var list = [];
        for (var i = 0; i < on.length; i++) {
            list.push(on[i].getAttribute('data-d'));
        }
        el('gc-f-diet').value = list.join('.');
        filter();
    }

    function view(id) {
        $ApiRequest('GiftCards/View', JSON.stringify([{ key: 'id', vlu: id }]));
    }

    function estimate() {
        $ApiRequest('GiftCards/Estimate', JSON.stringify([
            { key: 'menu', vlu: val('gc-pmenu') },
            { key: 'guests', vlu: val('gc-pguests') },
            { key: 'pairing', vlu: el('gc-ppair').checked ? '1' : '' }
        ]));
    }

    function check() {
        $ApiRequest('GiftCards/Check', JSON.stringify([
            { key: 'date', vlu: val('gc-cdate') },
            { key: 'party', vlu: val('gc-cparty') }
        ]));
    }

    function area(key) {
        seatArea = key;
        var b = document.querySelectorAll('.gc-seg-b[data-a]');
        for (var i = 0; i < b.length; i++) {
            b[i].classList.toggle('gc-act', b[i].getAttribute('data-a') === key);
        }
        var notes = {
            dining: 'Our main room, linen-laid tables and soft candlelight.',
            bar: 'The full menu at the bar for up to 3 guests; walk-ins welcome too.',
            counter: 'Eight seats facing the kitchen; Chef’s Counter menu only, Wednesday to Saturday at 6:00 and 8:30.'
        };
        el('gc-area-note').textContent = notes[key] || '';
        find();
    }

    function find() {
        $WaitOn();
        $ApiRequest('GiftCards/Find', JSON.stringify([
            { key: 'date', vlu: val('gc-date') },
            { key: 'party', vlu: val('gc-party') },
            { key: 'area', vlu: seatArea }
        ]));
    }

    function pick(btn) {
        var t = document.querySelectorAll('.gc-time');
        for (var i = 0; i < t.length; i++) {
            t[i].classList.remove('gc-act');
        }
        btn.classList.add('gc-act');
        picked(btn.getAttribute('data-t'), btn.getAttribute('data-l'));
        var f = el('gc-form');
        if (f && window.innerWidth < 1024) {
            f.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function picked(time, label) {
        el('gc-time').value = time || '';
        var p = el('gc-picked');
        if (time) {
            p.innerHTML = '';
            var b = document.createElement('b');
            b.textContent = label || time;
            p.appendChild(b);
            p.classList.add('gc-on');
        } else {
            p.innerHTML = '<span>Choose a time above.</span>';
            p.classList.remove('gc-on');
        }
    }

    function bookTable() {
        $WaitOn();
        $ApiRequest('GiftCards/Book', JSON.stringify([
            { key: 'date', vlu: val('gc-date') },
            { key: 'party', vlu: val('gc-party') },
            { key: 'area', vlu: seatArea },
            { key: 'time', vlu: val('gc-time') },
            { key: 'name', vlu: val('gc-name') },
            { key: 'phone', vlu: val('gc-phone') },
            { key: 'email', vlu: val('gc-email') },
            { key: 'occasion', vlu: val('gc-occasion') },
            { key: 'notes', vlu: val('gc-notes') },
            { key: 'agree', vlu: el('gc-agree').checked ? '1' : '' }
        ]));
    }

    function bookEvent() {
        $WaitOn();
        $ApiRequest('GiftCards/Book', JSON.stringify([
            { key: 'id', vlu: val('gc-id') },
            { key: 'guests', vlu: val('gc-guests') },
            { key: 'name', vlu: val('gc-name') },
            { key: 'phone', vlu: val('gc-phone') },
            { key: 'email', vlu: val('gc-email') },
            { key: 'notes', vlu: val('gc-notes') }
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
        var d = el('gc-done');
        d.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function seats() {
        $ApiRequest('GiftCards/Seats', JSON.stringify([
            { key: 'id', vlu: val('gc-id') },
            { key: 'guests', vlu: val('gc-guests') }
        ]));
    }

    function inquire() {
        $WaitOn();
        $ApiRequest('GiftCards/Inquire', JSON.stringify([
            { key: 'name', vlu: val('gc-name') },
            { key: 'phone', vlu: val('gc-phone') },
            { key: 'email', vlu: val('gc-email') },
            { key: 'date', vlu: val('gc-date') },
            { key: 'guests', vlu: val('gc-guests') },
            { key: 'room', vlu: val('gc-room') },
            { key: 'notes', vlu: val('gc-notes') }
        ]));
    }

    function pair() {
        $ApiRequest('GiftCards/Pair', JSON.stringify([{ key: 'dish', vlu: val('gc-dish') }]));
    }

    function amount(btn, v) {
        var c = document.querySelectorAll('#gc-amts .gc-chip, #gc-exps .gc-chip');
        for (var i = 0; i < c.length; i++) {
            c[i].classList.remove('gc-act');
        }
        btn.classList.add('gc-act');
        el('gc-custom').value = '';
        el('gc-amount').value = v;
        preview();
    }

    function custom() {
        var v = val('gc-custom');
        var c = document.querySelectorAll('#gc-amts .gc-chip, #gc-exps .gc-chip');
        for (var i = 0; i < c.length; i++) {
            c[i].classList.remove('gc-act');
        }
        el('gc-amount').value = v;
        preview();
    }

    function design() {
        var d = document.querySelector('input[name="gc-design"]:checked');
        return d ? d.value : '';
    }

    function giftData() {
        return [
            { key: 'amount', vlu: val('gc-amount') },
            { key: 'design', vlu: design() },
            { key: 'to', vlu: val('gc-to') },
            { key: 'from', vlu: val('gc-from') },
            { key: 'msg', vlu: val('gc-msg') }
        ];
    }

    function preview() {
        clearTimeout(ptimer);
        ptimer = setTimeout(function () {
            $ApiRequest('GiftCards/Preview', JSON.stringify(giftData()));
        }, 220);
    }

    function delivery(d) {
        giftDelivery = d;
        var b = document.querySelectorAll('.gc-seg-b[data-d]');
        for (var i = 0; i < b.length; i++) {
            b[i].classList.toggle('gc-act', b[i].getAttribute('data-d') === d);
        }
        el('gc-remail-l').classList.toggle('gc-hide', d === 'print');
    }

    function buy() {
        $WaitOn();
        $ApiRequest('GiftCards/Buy', JSON.stringify(giftData().concat([
            { key: 'delivery', vlu: giftDelivery },
            { key: 'remail', vlu: val('gc-remail') },
            { key: 'send', vlu: val('gc-send') },
            { key: 'email', vlu: val('gc-email') }
        ])));
    }

    function bought() {
        el('gc-done').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function send() {
        $WaitOn();
        $ApiRequest('GiftCards/Send', JSON.stringify([
            { key: 'name', vlu: val('gc-name') },
            { key: 'email', vlu: val('gc-email') },
            { key: 'topic', vlu: val('gc-topic') },
            { key: 'message', vlu: val('gc-msg') }
        ]));
    }

    function sent() {
        var f = el('gc-form');
        if (!f) {
            return;
        }
        var fields = f.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea');
        for (var i = 0; i < fields.length; i++) {
            fields[i].value = '';
        }
    }

    function subscribe() {
        $ApiRequest('GiftCards/Subscribe', JSON.stringify([{ key: 'email', vlu: val('gc-nl-email') }]));
    }

    function subscribed() {
        el('gc-nl-email').value = '';
    }

    function reveal() {
        document.addEventListener('click', function (e) {
            var box = el('gc-search');
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
            var h = el('gc-head');
            if (h) {
                h.classList.toggle('gc-scrolled', window.pageYOffset > 8);
            }
        }, { passive: true });
        window.addEventListener('resize', function () {
            if (window.innerWidth > 767) {
                closeNav();
            }
        });
        if (page() === 'Reservation' && val('gc-time') !== '') {
            el('gc-picked').classList.add('gc-on');
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

GiftCardsJs.reveal();

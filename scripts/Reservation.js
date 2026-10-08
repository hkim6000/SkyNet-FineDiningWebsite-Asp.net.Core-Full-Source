var ReservationJs = (function () {

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
        var s = document.querySelector('.rv-site');
        return s ? s.getAttribute('data-page') : '';
    }

    function openNav() {
        el('rv-nav').classList.add('rv-open');
        el('rv-scrim').classList.add('rv-open');
        document.body.style.overflow = 'hidden';
    }

    function closeNav() {
        el('rv-nav').classList.remove('rv-open');
        el('rv-scrim').classList.remove('rv-open');
        document.body.style.overflow = '';
    }

    function toggleSub(btn) {
        var li = btn.closest('.rv-mi');
        if (li) {
            li.classList.toggle('rv-exp');
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
            if (q === lastQ && el('rv-sugg').innerHTML !== '') {
                openSugg();
                return;
            }
            lastQ = q;
            $ApiRequest('Reservation/Search', JSON.stringify([{ key: 'q', vlu: q }]));
        }, 250);
    }

    function openSugg() {
        el('rv-sugg').classList.add('rv-open');
    }

    function closeSugg() {
        el('rv-sugg').classList.remove('rv-open');
    }

    function toast() {
        var t = el('rv-toast');
        t.classList.add('rv-open');
        clearTimeout(ttimer);
        ttimer = setTimeout(function () {
            t.classList.remove('rv-open');
        }, 3600);
    }

    function shown(id) {
        var e = el(id);
        if (e) {
            e.classList.add('rv-show');
        }
    }

    function openModal() {
        el('rv-modal').classList.add('rv-open');
        document.body.style.overflow = 'hidden';
    }

    function closeModal(e) {
        if (e && e.target && e.target.id !== 'rv-modal') {
            return;
        }
        el('rv-modal').classList.remove('rv-open');
        document.body.style.overflow = '';
    }

    function values() {
        var list = [];
        var fields = document.querySelectorAll('.rv-fv');
        for (var i = 0; i < fields.length; i++) {
            list.push({ key: fields[i].getAttribute('data-k'), vlu: (fields[i].value || '').trim() });
        }
        return list;
    }

    function filter() {
        $ApiRequest('Reservation/Filter', JSON.stringify(values()));
    }

    function chip(btn, value) {
        var chips = btn.parentNode.querySelectorAll('.rv-chip');
        for (var i = 0; i < chips.length; i++) {
            chips[i].classList.remove('rv-act');
        }
        btn.classList.add('rv-act');
        var p = page();
        if (p === 'Menu') {
            el('rv-f-course').value = value;
            filter();
        } else if (p === 'Wine') {
            el('rv-f-type').value = value;
            filter();
        } else {
            $ApiRequest('Reservation/Filter', JSON.stringify([{ key: 'kind', vlu: value }]));
        }
    }

    function diet(btn) {
        btn.classList.toggle('rv-act');
        var on = document.querySelectorAll('.rv-chip-t.rv-act');
        var list = [];
        for (var i = 0; i < on.length; i++) {
            list.push(on[i].getAttribute('data-d'));
        }
        el('rv-f-diet').value = list.join('.');
        filter();
    }

    function view(id) {
        $ApiRequest('Reservation/View', JSON.stringify([{ key: 'id', vlu: id }]));
    }

    function estimate() {
        $ApiRequest('Reservation/Estimate', JSON.stringify([
            { key: 'menu', vlu: val('rv-pmenu') },
            { key: 'guests', vlu: val('rv-pguests') },
            { key: 'pairing', vlu: el('rv-ppair').checked ? '1' : '' }
        ]));
    }

    function check() {
        $ApiRequest('Reservation/Check', JSON.stringify([
            { key: 'date', vlu: val('rv-cdate') },
            { key: 'party', vlu: val('rv-cparty') }
        ]));
    }

    function area(key) {
        seatArea = key;
        var b = document.querySelectorAll('.rv-seg-b[data-a]');
        for (var i = 0; i < b.length; i++) {
            b[i].classList.toggle('rv-act', b[i].getAttribute('data-a') === key);
        }
        var notes = {
            dining: 'Our main room, linen-laid tables and soft candlelight.',
            bar: 'The full menu at the bar for up to 3 guests; walk-ins welcome too.',
            counter: 'Eight seats facing the kitchen; Chef’s Counter menu only, Wednesday to Saturday at 6:00 and 8:30.'
        };
        el('rv-area-note').textContent = notes[key] || '';
        find();
    }

    function find() {
        $WaitOn();
        $ApiRequest('Reservation/Find', JSON.stringify([
            { key: 'date', vlu: val('rv-date') },
            { key: 'party', vlu: val('rv-party') },
            { key: 'area', vlu: seatArea }
        ]));
    }

    function pick(btn) {
        var t = document.querySelectorAll('.rv-time');
        for (var i = 0; i < t.length; i++) {
            t[i].classList.remove('rv-act');
        }
        btn.classList.add('rv-act');
        picked(btn.getAttribute('data-t'), btn.getAttribute('data-l'));
        var f = el('rv-form');
        if (f && window.innerWidth < 1024) {
            f.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function picked(time, label) {
        el('rv-time').value = time || '';
        var p = el('rv-picked');
        if (time) {
            p.innerHTML = '';
            var b = document.createElement('b');
            b.textContent = label || time;
            p.appendChild(b);
            p.classList.add('rv-on');
        } else {
            p.innerHTML = '<span>Choose a time above.</span>';
            p.classList.remove('rv-on');
        }
    }

    function bookTable() {
        $WaitOn();
        $ApiRequest('Reservation/Book', JSON.stringify([
            { key: 'date', vlu: val('rv-date') },
            { key: 'party', vlu: val('rv-party') },
            { key: 'area', vlu: seatArea },
            { key: 'time', vlu: val('rv-time') },
            { key: 'name', vlu: val('rv-name') },
            { key: 'phone', vlu: val('rv-phone') },
            { key: 'email', vlu: val('rv-email') },
            { key: 'occasion', vlu: val('rv-occasion') },
            { key: 'notes', vlu: val('rv-notes') },
            { key: 'agree', vlu: el('rv-agree').checked ? '1' : '' }
        ]));
    }

    function bookEvent() {
        $WaitOn();
        $ApiRequest('Reservation/Book', JSON.stringify([
            { key: 'id', vlu: val('rv-id') },
            { key: 'guests', vlu: val('rv-guests') },
            { key: 'name', vlu: val('rv-name') },
            { key: 'phone', vlu: val('rv-phone') },
            { key: 'email', vlu: val('rv-email') },
            { key: 'notes', vlu: val('rv-notes') }
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
        var d = el('rv-done');
        d.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function seats() {
        $ApiRequest('Reservation/Seats', JSON.stringify([
            { key: 'id', vlu: val('rv-id') },
            { key: 'guests', vlu: val('rv-guests') }
        ]));
    }

    function inquire() {
        $WaitOn();
        $ApiRequest('Reservation/Inquire', JSON.stringify([
            { key: 'name', vlu: val('rv-name') },
            { key: 'phone', vlu: val('rv-phone') },
            { key: 'email', vlu: val('rv-email') },
            { key: 'date', vlu: val('rv-date') },
            { key: 'guests', vlu: val('rv-guests') },
            { key: 'room', vlu: val('rv-room') },
            { key: 'notes', vlu: val('rv-notes') }
        ]));
    }

    function pair() {
        $ApiRequest('Reservation/Pair', JSON.stringify([{ key: 'dish', vlu: val('rv-dish') }]));
    }

    function amount(btn, v) {
        var c = document.querySelectorAll('#rv-amts .rv-chip, #rv-exps .rv-chip');
        for (var i = 0; i < c.length; i++) {
            c[i].classList.remove('rv-act');
        }
        btn.classList.add('rv-act');
        el('rv-custom').value = '';
        el('rv-amount').value = v;
        preview();
    }

    function custom() {
        var v = val('rv-custom');
        var c = document.querySelectorAll('#rv-amts .rv-chip, #rv-exps .rv-chip');
        for (var i = 0; i < c.length; i++) {
            c[i].classList.remove('rv-act');
        }
        el('rv-amount').value = v;
        preview();
    }

    function design() {
        var d = document.querySelector('input[name="rv-design"]:checked');
        return d ? d.value : '';
    }

    function giftData() {
        return [
            { key: 'amount', vlu: val('rv-amount') },
            { key: 'design', vlu: design() },
            { key: 'to', vlu: val('rv-to') },
            { key: 'from', vlu: val('rv-from') },
            { key: 'msg', vlu: val('rv-msg') }
        ];
    }

    function preview() {
        clearTimeout(ptimer);
        ptimer = setTimeout(function () {
            $ApiRequest('Reservation/Preview', JSON.stringify(giftData()));
        }, 220);
    }

    function delivery(d) {
        giftDelivery = d;
        var b = document.querySelectorAll('.rv-seg-b[data-d]');
        for (var i = 0; i < b.length; i++) {
            b[i].classList.toggle('rv-act', b[i].getAttribute('data-d') === d);
        }
        el('rv-remail-l').classList.toggle('rv-hide', d === 'print');
    }

    function buy() {
        $WaitOn();
        $ApiRequest('Reservation/Buy', JSON.stringify(giftData().concat([
            { key: 'delivery', vlu: giftDelivery },
            { key: 'remail', vlu: val('rv-remail') },
            { key: 'send', vlu: val('rv-send') },
            { key: 'email', vlu: val('rv-email') }
        ])));
    }

    function bought() {
        el('rv-done').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function send() {
        $WaitOn();
        $ApiRequest('Reservation/Send', JSON.stringify([
            { key: 'name', vlu: val('rv-name') },
            { key: 'email', vlu: val('rv-email') },
            { key: 'topic', vlu: val('rv-topic') },
            { key: 'message', vlu: val('rv-msg') }
        ]));
    }

    function sent() {
        var f = el('rv-form');
        if (!f) {
            return;
        }
        var fields = f.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea');
        for (var i = 0; i < fields.length; i++) {
            fields[i].value = '';
        }
    }

    function subscribe() {
        $ApiRequest('Reservation/Subscribe', JSON.stringify([{ key: 'email', vlu: val('rv-nl-email') }]));
    }

    function subscribed() {
        el('rv-nl-email').value = '';
    }

    function reveal() {
        document.addEventListener('click', function (e) {
            var box = el('rv-search');
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
            var h = el('rv-head');
            if (h) {
                h.classList.toggle('rv-scrolled', window.pageYOffset > 8);
            }
        }, { passive: true });
        window.addEventListener('resize', function () {
            if (window.innerWidth > 767) {
                closeNav();
            }
        });
        if (page() === 'Reservation' && val('rv-time') !== '') {
            el('rv-picked').classList.add('rv-on');
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

ReservationJs.reveal();

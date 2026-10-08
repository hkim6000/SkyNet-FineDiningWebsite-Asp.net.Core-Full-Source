var ContactJs = (function () {

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
        var s = document.querySelector('.co-site');
        return s ? s.getAttribute('data-page') : '';
    }

    function openNav() {
        el('co-nav').classList.add('co-open');
        el('co-scrim').classList.add('co-open');
        document.body.style.overflow = 'hidden';
    }

    function closeNav() {
        el('co-nav').classList.remove('co-open');
        el('co-scrim').classList.remove('co-open');
        document.body.style.overflow = '';
    }

    function toggleSub(btn) {
        var li = btn.closest('.co-mi');
        if (li) {
            li.classList.toggle('co-exp');
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
            if (q === lastQ && el('co-sugg').innerHTML !== '') {
                openSugg();
                return;
            }
            lastQ = q;
            $ApiRequest('Contact/Search', JSON.stringify([{ key: 'q', vlu: q }]));
        }, 250);
    }

    function openSugg() {
        el('co-sugg').classList.add('co-open');
    }

    function closeSugg() {
        el('co-sugg').classList.remove('co-open');
    }

    function toast() {
        var t = el('co-toast');
        t.classList.add('co-open');
        clearTimeout(ttimer);
        ttimer = setTimeout(function () {
            t.classList.remove('co-open');
        }, 3600);
    }

    function shown(id) {
        var e = el(id);
        if (e) {
            e.classList.add('co-show');
        }
    }

    function openModal() {
        el('co-modal').classList.add('co-open');
        document.body.style.overflow = 'hidden';
    }

    function closeModal(e) {
        if (e && e.target && e.target.id !== 'co-modal') {
            return;
        }
        el('co-modal').classList.remove('co-open');
        document.body.style.overflow = '';
    }

    function values() {
        var list = [];
        var fields = document.querySelectorAll('.co-fv');
        for (var i = 0; i < fields.length; i++) {
            list.push({ key: fields[i].getAttribute('data-k'), vlu: (fields[i].value || '').trim() });
        }
        return list;
    }

    function filter() {
        $ApiRequest('Contact/Filter', JSON.stringify(values()));
    }

    function chip(btn, value) {
        var chips = btn.parentNode.querySelectorAll('.co-chip');
        for (var i = 0; i < chips.length; i++) {
            chips[i].classList.remove('co-act');
        }
        btn.classList.add('co-act');
        var p = page();
        if (p === 'Menu') {
            el('co-f-course').value = value;
            filter();
        } else if (p === 'Wine') {
            el('co-f-type').value = value;
            filter();
        } else {
            $ApiRequest('Contact/Filter', JSON.stringify([{ key: 'kind', vlu: value }]));
        }
    }

    function diet(btn) {
        btn.classList.toggle('co-act');
        var on = document.querySelectorAll('.co-chip-t.co-act');
        var list = [];
        for (var i = 0; i < on.length; i++) {
            list.push(on[i].getAttribute('data-d'));
        }
        el('co-f-diet').value = list.join('.');
        filter();
    }

    function view(id) {
        $ApiRequest('Contact/View', JSON.stringify([{ key: 'id', vlu: id }]));
    }

    function estimate() {
        $ApiRequest('Contact/Estimate', JSON.stringify([
            { key: 'menu', vlu: val('co-pmenu') },
            { key: 'guests', vlu: val('co-pguests') },
            { key: 'pairing', vlu: el('co-ppair').checked ? '1' : '' }
        ]));
    }

    function check() {
        $ApiRequest('Contact/Check', JSON.stringify([
            { key: 'date', vlu: val('co-cdate') },
            { key: 'party', vlu: val('co-cparty') }
        ]));
    }

    function area(key) {
        seatArea = key;
        var b = document.querySelectorAll('.co-seg-b[data-a]');
        for (var i = 0; i < b.length; i++) {
            b[i].classList.toggle('co-act', b[i].getAttribute('data-a') === key);
        }
        var notes = {
            dining: 'Our main room, linen-laid tables and soft candlelight.',
            bar: 'The full menu at the bar for up to 3 guests; walk-ins welcome too.',
            counter: 'Eight seats facing the kitchen; Chef’s Counter menu only, Wednesday to Saturday at 6:00 and 8:30.'
        };
        el('co-area-note').textContent = notes[key] || '';
        find();
    }

    function find() {
        $WaitOn();
        $ApiRequest('Contact/Find', JSON.stringify([
            { key: 'date', vlu: val('co-date') },
            { key: 'party', vlu: val('co-party') },
            { key: 'area', vlu: seatArea }
        ]));
    }

    function pick(btn) {
        var t = document.querySelectorAll('.co-time');
        for (var i = 0; i < t.length; i++) {
            t[i].classList.remove('co-act');
        }
        btn.classList.add('co-act');
        picked(btn.getAttribute('data-t'), btn.getAttribute('data-l'));
        var f = el('co-form');
        if (f && window.innerWidth < 1024) {
            f.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function picked(time, label) {
        el('co-time').value = time || '';
        var p = el('co-picked');
        if (time) {
            p.innerHTML = '';
            var b = document.createElement('b');
            b.textContent = label || time;
            p.appendChild(b);
            p.classList.add('co-on');
        } else {
            p.innerHTML = '<span>Choose a time above.</span>';
            p.classList.remove('co-on');
        }
    }

    function bookTable() {
        $WaitOn();
        $ApiRequest('Contact/Book', JSON.stringify([
            { key: 'date', vlu: val('co-date') },
            { key: 'party', vlu: val('co-party') },
            { key: 'area', vlu: seatArea },
            { key: 'time', vlu: val('co-time') },
            { key: 'name', vlu: val('co-name') },
            { key: 'phone', vlu: val('co-phone') },
            { key: 'email', vlu: val('co-email') },
            { key: 'occasion', vlu: val('co-occasion') },
            { key: 'notes', vlu: val('co-notes') },
            { key: 'agree', vlu: el('co-agree').checked ? '1' : '' }
        ]));
    }

    function bookEvent() {
        $WaitOn();
        $ApiRequest('Contact/Book', JSON.stringify([
            { key: 'id', vlu: val('co-id') },
            { key: 'guests', vlu: val('co-guests') },
            { key: 'name', vlu: val('co-name') },
            { key: 'phone', vlu: val('co-phone') },
            { key: 'email', vlu: val('co-email') },
            { key: 'notes', vlu: val('co-notes') }
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
        var d = el('co-done');
        d.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function seats() {
        $ApiRequest('Contact/Seats', JSON.stringify([
            { key: 'id', vlu: val('co-id') },
            { key: 'guests', vlu: val('co-guests') }
        ]));
    }

    function inquire() {
        $WaitOn();
        $ApiRequest('Contact/Inquire', JSON.stringify([
            { key: 'name', vlu: val('co-name') },
            { key: 'phone', vlu: val('co-phone') },
            { key: 'email', vlu: val('co-email') },
            { key: 'date', vlu: val('co-date') },
            { key: 'guests', vlu: val('co-guests') },
            { key: 'room', vlu: val('co-room') },
            { key: 'notes', vlu: val('co-notes') }
        ]));
    }

    function pair() {
        $ApiRequest('Contact/Pair', JSON.stringify([{ key: 'dish', vlu: val('co-dish') }]));
    }

    function amount(btn, v) {
        var c = document.querySelectorAll('#co-amts .co-chip, #co-exps .co-chip');
        for (var i = 0; i < c.length; i++) {
            c[i].classList.remove('co-act');
        }
        btn.classList.add('co-act');
        el('co-custom').value = '';
        el('co-amount').value = v;
        preview();
    }

    function custom() {
        var v = val('co-custom');
        var c = document.querySelectorAll('#co-amts .co-chip, #co-exps .co-chip');
        for (var i = 0; i < c.length; i++) {
            c[i].classList.remove('co-act');
        }
        el('co-amount').value = v;
        preview();
    }

    function design() {
        var d = document.querySelector('input[name="co-design"]:checked');
        return d ? d.value : '';
    }

    function giftData() {
        return [
            { key: 'amount', vlu: val('co-amount') },
            { key: 'design', vlu: design() },
            { key: 'to', vlu: val('co-to') },
            { key: 'from', vlu: val('co-from') },
            { key: 'msg', vlu: val('co-msg') }
        ];
    }

    function preview() {
        clearTimeout(ptimer);
        ptimer = setTimeout(function () {
            $ApiRequest('Contact/Preview', JSON.stringify(giftData()));
        }, 220);
    }

    function delivery(d) {
        giftDelivery = d;
        var b = document.querySelectorAll('.co-seg-b[data-d]');
        for (var i = 0; i < b.length; i++) {
            b[i].classList.toggle('co-act', b[i].getAttribute('data-d') === d);
        }
        el('co-remail-l').classList.toggle('co-hide', d === 'print');
    }

    function buy() {
        $WaitOn();
        $ApiRequest('Contact/Buy', JSON.stringify(giftData().concat([
            { key: 'delivery', vlu: giftDelivery },
            { key: 'remail', vlu: val('co-remail') },
            { key: 'send', vlu: val('co-send') },
            { key: 'email', vlu: val('co-email') }
        ])));
    }

    function bought() {
        el('co-done').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function send() {
        $WaitOn();
        $ApiRequest('Contact/Send', JSON.stringify([
            { key: 'name', vlu: val('co-name') },
            { key: 'email', vlu: val('co-email') },
            { key: 'topic', vlu: val('co-topic') },
            { key: 'message', vlu: val('co-msg') }
        ]));
    }

    function sent() {
        var f = el('co-form');
        if (!f) {
            return;
        }
        var fields = f.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea');
        for (var i = 0; i < fields.length; i++) {
            fields[i].value = '';
        }
    }

    function subscribe() {
        $ApiRequest('Contact/Subscribe', JSON.stringify([{ key: 'email', vlu: val('co-nl-email') }]));
    }

    function subscribed() {
        el('co-nl-email').value = '';
    }

    function reveal() {
        document.addEventListener('click', function (e) {
            var box = el('co-search');
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
            var h = el('co-head');
            if (h) {
                h.classList.toggle('co-scrolled', window.pageYOffset > 8);
            }
        }, { passive: true });
        window.addEventListener('resize', function () {
            if (window.innerWidth > 767) {
                closeNav();
            }
        });
        if (page() === 'Reservation' && val('co-time') !== '') {
            el('co-picked').classList.add('co-on');
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

ContactJs.reveal();

var AboutJs = (function () {

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
        var s = document.querySelector('.ab-site');
        return s ? s.getAttribute('data-page') : '';
    }

    function openNav() {
        el('ab-nav').classList.add('ab-open');
        el('ab-scrim').classList.add('ab-open');
        document.body.style.overflow = 'hidden';
    }

    function closeNav() {
        el('ab-nav').classList.remove('ab-open');
        el('ab-scrim').classList.remove('ab-open');
        document.body.style.overflow = '';
    }

    function toggleSub(btn) {
        var li = btn.closest('.ab-mi');
        if (li) {
            li.classList.toggle('ab-exp');
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
            if (q === lastQ && el('ab-sugg').innerHTML !== '') {
                openSugg();
                return;
            }
            lastQ = q;
            $ApiRequest('About/Search', JSON.stringify([{ key: 'q', vlu: q }]));
        }, 250);
    }

    function openSugg() {
        el('ab-sugg').classList.add('ab-open');
    }

    function closeSugg() {
        el('ab-sugg').classList.remove('ab-open');
    }

    function toast() {
        var t = el('ab-toast');
        t.classList.add('ab-open');
        clearTimeout(ttimer);
        ttimer = setTimeout(function () {
            t.classList.remove('ab-open');
        }, 3600);
    }

    function shown(id) {
        var e = el(id);
        if (e) {
            e.classList.add('ab-show');
        }
    }

    function openModal() {
        el('ab-modal').classList.add('ab-open');
        document.body.style.overflow = 'hidden';
    }

    function closeModal(e) {
        if (e && e.target && e.target.id !== 'ab-modal') {
            return;
        }
        el('ab-modal').classList.remove('ab-open');
        document.body.style.overflow = '';
    }

    function values() {
        var list = [];
        var fields = document.querySelectorAll('.ab-fv');
        for (var i = 0; i < fields.length; i++) {
            list.push({ key: fields[i].getAttribute('data-k'), vlu: (fields[i].value || '').trim() });
        }
        return list;
    }

    function filter() {
        $ApiRequest('About/Filter', JSON.stringify(values()));
    }

    function chip(btn, value) {
        var chips = btn.parentNode.querySelectorAll('.ab-chip');
        for (var i = 0; i < chips.length; i++) {
            chips[i].classList.remove('ab-act');
        }
        btn.classList.add('ab-act');
        var p = page();
        if (p === 'Menu') {
            el('ab-f-course').value = value;
            filter();
        } else if (p === 'Wine') {
            el('ab-f-type').value = value;
            filter();
        } else {
            $ApiRequest('About/Filter', JSON.stringify([{ key: 'kind', vlu: value }]));
        }
    }

    function diet(btn) {
        btn.classList.toggle('ab-act');
        var on = document.querySelectorAll('.ab-chip-t.ab-act');
        var list = [];
        for (var i = 0; i < on.length; i++) {
            list.push(on[i].getAttribute('data-d'));
        }
        el('ab-f-diet').value = list.join('.');
        filter();
    }

    function view(id) {
        $ApiRequest('About/View', JSON.stringify([{ key: 'id', vlu: id }]));
    }

    function estimate() {
        $ApiRequest('About/Estimate', JSON.stringify([
            { key: 'menu', vlu: val('ab-pmenu') },
            { key: 'guests', vlu: val('ab-pguests') },
            { key: 'pairing', vlu: el('ab-ppair').checked ? '1' : '' }
        ]));
    }

    function check() {
        $ApiRequest('About/Check', JSON.stringify([
            { key: 'date', vlu: val('ab-cdate') },
            { key: 'party', vlu: val('ab-cparty') }
        ]));
    }

    function area(key) {
        seatArea = key;
        var b = document.querySelectorAll('.ab-seg-b[data-a]');
        for (var i = 0; i < b.length; i++) {
            b[i].classList.toggle('ab-act', b[i].getAttribute('data-a') === key);
        }
        var notes = {
            dining: 'Our main room, linen-laid tables and soft candlelight.',
            bar: 'The full menu at the bar for up to 3 guests; walk-ins welcome too.',
            counter: 'Eight seats facing the kitchen; Chef’s Counter menu only, Wednesday to Saturday at 6:00 and 8:30.'
        };
        el('ab-area-note').textContent = notes[key] || '';
        find();
    }

    function find() {
        $WaitOn();
        $ApiRequest('About/Find', JSON.stringify([
            { key: 'date', vlu: val('ab-date') },
            { key: 'party', vlu: val('ab-party') },
            { key: 'area', vlu: seatArea }
        ]));
    }

    function pick(btn) {
        var t = document.querySelectorAll('.ab-time');
        for (var i = 0; i < t.length; i++) {
            t[i].classList.remove('ab-act');
        }
        btn.classList.add('ab-act');
        picked(btn.getAttribute('data-t'), btn.getAttribute('data-l'));
        var f = el('ab-form');
        if (f && window.innerWidth < 1024) {
            f.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function picked(time, label) {
        el('ab-time').value = time || '';
        var p = el('ab-picked');
        if (time) {
            p.innerHTML = '';
            var b = document.createElement('b');
            b.textContent = label || time;
            p.appendChild(b);
            p.classList.add('ab-on');
        } else {
            p.innerHTML = '<span>Choose a time above.</span>';
            p.classList.remove('ab-on');
        }
    }

    function bookTable() {
        $WaitOn();
        $ApiRequest('About/Book', JSON.stringify([
            { key: 'date', vlu: val('ab-date') },
            { key: 'party', vlu: val('ab-party') },
            { key: 'area', vlu: seatArea },
            { key: 'time', vlu: val('ab-time') },
            { key: 'name', vlu: val('ab-name') },
            { key: 'phone', vlu: val('ab-phone') },
            { key: 'email', vlu: val('ab-email') },
            { key: 'occasion', vlu: val('ab-occasion') },
            { key: 'notes', vlu: val('ab-notes') },
            { key: 'agree', vlu: el('ab-agree').checked ? '1' : '' }
        ]));
    }

    function bookEvent() {
        $WaitOn();
        $ApiRequest('About/Book', JSON.stringify([
            { key: 'id', vlu: val('ab-id') },
            { key: 'guests', vlu: val('ab-guests') },
            { key: 'name', vlu: val('ab-name') },
            { key: 'phone', vlu: val('ab-phone') },
            { key: 'email', vlu: val('ab-email') },
            { key: 'notes', vlu: val('ab-notes') }
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
        var d = el('ab-done');
        d.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function seats() {
        $ApiRequest('About/Seats', JSON.stringify([
            { key: 'id', vlu: val('ab-id') },
            { key: 'guests', vlu: val('ab-guests') }
        ]));
    }

    function inquire() {
        $WaitOn();
        $ApiRequest('About/Inquire', JSON.stringify([
            { key: 'name', vlu: val('ab-name') },
            { key: 'phone', vlu: val('ab-phone') },
            { key: 'email', vlu: val('ab-email') },
            { key: 'date', vlu: val('ab-date') },
            { key: 'guests', vlu: val('ab-guests') },
            { key: 'room', vlu: val('ab-room') },
            { key: 'notes', vlu: val('ab-notes') }
        ]));
    }

    function pair() {
        $ApiRequest('About/Pair', JSON.stringify([{ key: 'dish', vlu: val('ab-dish') }]));
    }

    function amount(btn, v) {
        var c = document.querySelectorAll('#ab-amts .ab-chip, #ab-exps .ab-chip');
        for (var i = 0; i < c.length; i++) {
            c[i].classList.remove('ab-act');
        }
        btn.classList.add('ab-act');
        el('ab-custom').value = '';
        el('ab-amount').value = v;
        preview();
    }

    function custom() {
        var v = val('ab-custom');
        var c = document.querySelectorAll('#ab-amts .ab-chip, #ab-exps .ab-chip');
        for (var i = 0; i < c.length; i++) {
            c[i].classList.remove('ab-act');
        }
        el('ab-amount').value = v;
        preview();
    }

    function design() {
        var d = document.querySelector('input[name="ab-design"]:checked');
        return d ? d.value : '';
    }

    function giftData() {
        return [
            { key: 'amount', vlu: val('ab-amount') },
            { key: 'design', vlu: design() },
            { key: 'to', vlu: val('ab-to') },
            { key: 'from', vlu: val('ab-from') },
            { key: 'msg', vlu: val('ab-msg') }
        ];
    }

    function preview() {
        clearTimeout(ptimer);
        ptimer = setTimeout(function () {
            $ApiRequest('About/Preview', JSON.stringify(giftData()));
        }, 220);
    }

    function delivery(d) {
        giftDelivery = d;
        var b = document.querySelectorAll('.ab-seg-b[data-d]');
        for (var i = 0; i < b.length; i++) {
            b[i].classList.toggle('ab-act', b[i].getAttribute('data-d') === d);
        }
        el('ab-remail-l').classList.toggle('ab-hide', d === 'print');
    }

    function buy() {
        $WaitOn();
        $ApiRequest('About/Buy', JSON.stringify(giftData().concat([
            { key: 'delivery', vlu: giftDelivery },
            { key: 'remail', vlu: val('ab-remail') },
            { key: 'send', vlu: val('ab-send') },
            { key: 'email', vlu: val('ab-email') }
        ])));
    }

    function bought() {
        el('ab-done').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function send() {
        $WaitOn();
        $ApiRequest('About/Send', JSON.stringify([
            { key: 'name', vlu: val('ab-name') },
            { key: 'email', vlu: val('ab-email') },
            { key: 'topic', vlu: val('ab-topic') },
            { key: 'message', vlu: val('ab-msg') }
        ]));
    }

    function sent() {
        var f = el('ab-form');
        if (!f) {
            return;
        }
        var fields = f.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea');
        for (var i = 0; i < fields.length; i++) {
            fields[i].value = '';
        }
    }

    function subscribe() {
        $ApiRequest('About/Subscribe', JSON.stringify([{ key: 'email', vlu: val('ab-nl-email') }]));
    }

    function subscribed() {
        el('ab-nl-email').value = '';
    }

    function reveal() {
        document.addEventListener('click', function (e) {
            var box = el('ab-search');
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
            var h = el('ab-head');
            if (h) {
                h.classList.toggle('ab-scrolled', window.pageYOffset > 8);
            }
        }, { passive: true });
        window.addEventListener('resize', function () {
            if (window.innerWidth > 767) {
                closeNav();
            }
        });
        if (page() === 'Reservation' && val('ab-time') !== '') {
            el('ab-picked').classList.add('ab-on');
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

AboutJs.reveal();

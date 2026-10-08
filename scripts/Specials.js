var SpecialsJs = (function () {

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
        var s = document.querySelector('.sp-site');
        return s ? s.getAttribute('data-page') : '';
    }

    function openNav() {
        el('sp-nav').classList.add('sp-open');
        el('sp-scrim').classList.add('sp-open');
        document.body.style.overflow = 'hidden';
    }

    function closeNav() {
        el('sp-nav').classList.remove('sp-open');
        el('sp-scrim').classList.remove('sp-open');
        document.body.style.overflow = '';
    }

    function toggleSub(btn) {
        var li = btn.closest('.sp-mi');
        if (li) {
            li.classList.toggle('sp-exp');
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
            if (q === lastQ && el('sp-sugg').innerHTML !== '') {
                openSugg();
                return;
            }
            lastQ = q;
            $ApiRequest('Specials/Search', JSON.stringify([{ key: 'q', vlu: q }]));
        }, 250);
    }

    function openSugg() {
        el('sp-sugg').classList.add('sp-open');
    }

    function closeSugg() {
        el('sp-sugg').classList.remove('sp-open');
    }

    function toast() {
        var t = el('sp-toast');
        t.classList.add('sp-open');
        clearTimeout(ttimer);
        ttimer = setTimeout(function () {
            t.classList.remove('sp-open');
        }, 3600);
    }

    function shown(id) {
        var e = el(id);
        if (e) {
            e.classList.add('sp-show');
        }
    }

    function openModal() {
        el('sp-modal').classList.add('sp-open');
        document.body.style.overflow = 'hidden';
    }

    function closeModal(e) {
        if (e && e.target && e.target.id !== 'sp-modal') {
            return;
        }
        el('sp-modal').classList.remove('sp-open');
        document.body.style.overflow = '';
    }

    function values() {
        var list = [];
        var fields = document.querySelectorAll('.sp-fv');
        for (var i = 0; i < fields.length; i++) {
            list.push({ key: fields[i].getAttribute('data-k'), vlu: (fields[i].value || '').trim() });
        }
        return list;
    }

    function filter() {
        $ApiRequest('Specials/Filter', JSON.stringify(values()));
    }

    function chip(btn, value) {
        var chips = btn.parentNode.querySelectorAll('.sp-chip');
        for (var i = 0; i < chips.length; i++) {
            chips[i].classList.remove('sp-act');
        }
        btn.classList.add('sp-act');
        var p = page();
        if (p === 'Menu') {
            el('sp-f-course').value = value;
            filter();
        } else if (p === 'Wine') {
            el('sp-f-type').value = value;
            filter();
        } else {
            $ApiRequest('Specials/Filter', JSON.stringify([{ key: 'kind', vlu: value }]));
        }
    }

    function diet(btn) {
        btn.classList.toggle('sp-act');
        var on = document.querySelectorAll('.sp-chip-t.sp-act');
        var list = [];
        for (var i = 0; i < on.length; i++) {
            list.push(on[i].getAttribute('data-d'));
        }
        el('sp-f-diet').value = list.join('.');
        filter();
    }

    function view(id) {
        $ApiRequest('Specials/View', JSON.stringify([{ key: 'id', vlu: id }]));
    }

    function estimate() {
        $ApiRequest('Specials/Estimate', JSON.stringify([
            { key: 'menu', vlu: val('sp-pmenu') },
            { key: 'guests', vlu: val('sp-pguests') },
            { key: 'pairing', vlu: el('sp-ppair').checked ? '1' : '' }
        ]));
    }

    function check() {
        $ApiRequest('Specials/Check', JSON.stringify([
            { key: 'date', vlu: val('sp-cdate') },
            { key: 'party', vlu: val('sp-cparty') }
        ]));
    }

    function area(key) {
        seatArea = key;
        var b = document.querySelectorAll('.sp-seg-b[data-a]');
        for (var i = 0; i < b.length; i++) {
            b[i].classList.toggle('sp-act', b[i].getAttribute('data-a') === key);
        }
        var notes = {
            dining: 'Our main room, linen-laid tables and soft candlelight.',
            bar: 'The full menu at the bar for up to 3 guests; walk-ins welcome too.',
            counter: 'Eight seats facing the kitchen; Chef’s Counter menu only, Wednesday to Saturday at 6:00 and 8:30.'
        };
        el('sp-area-note').textContent = notes[key] || '';
        find();
    }

    function find() {
        $WaitOn();
        $ApiRequest('Specials/Find', JSON.stringify([
            { key: 'date', vlu: val('sp-date') },
            { key: 'party', vlu: val('sp-party') },
            { key: 'area', vlu: seatArea }
        ]));
    }

    function pick(btn) {
        var t = document.querySelectorAll('.sp-time');
        for (var i = 0; i < t.length; i++) {
            t[i].classList.remove('sp-act');
        }
        btn.classList.add('sp-act');
        picked(btn.getAttribute('data-t'), btn.getAttribute('data-l'));
        var f = el('sp-form');
        if (f && window.innerWidth < 1024) {
            f.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function picked(time, label) {
        el('sp-time').value = time || '';
        var p = el('sp-picked');
        if (time) {
            p.innerHTML = '';
            var b = document.createElement('b');
            b.textContent = label || time;
            p.appendChild(b);
            p.classList.add('sp-on');
        } else {
            p.innerHTML = '<span>Choose a time above.</span>';
            p.classList.remove('sp-on');
        }
    }

    function bookTable() {
        $WaitOn();
        $ApiRequest('Specials/Book', JSON.stringify([
            { key: 'date', vlu: val('sp-date') },
            { key: 'party', vlu: val('sp-party') },
            { key: 'area', vlu: seatArea },
            { key: 'time', vlu: val('sp-time') },
            { key: 'name', vlu: val('sp-name') },
            { key: 'phone', vlu: val('sp-phone') },
            { key: 'email', vlu: val('sp-email') },
            { key: 'occasion', vlu: val('sp-occasion') },
            { key: 'notes', vlu: val('sp-notes') },
            { key: 'agree', vlu: el('sp-agree').checked ? '1' : '' }
        ]));
    }

    function bookEvent() {
        $WaitOn();
        $ApiRequest('Specials/Book', JSON.stringify([
            { key: 'id', vlu: val('sp-id') },
            { key: 'guests', vlu: val('sp-guests') },
            { key: 'name', vlu: val('sp-name') },
            { key: 'phone', vlu: val('sp-phone') },
            { key: 'email', vlu: val('sp-email') },
            { key: 'notes', vlu: val('sp-notes') }
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
        var d = el('sp-done');
        d.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function seats() {
        $ApiRequest('Specials/Seats', JSON.stringify([
            { key: 'id', vlu: val('sp-id') },
            { key: 'guests', vlu: val('sp-guests') }
        ]));
    }

    function inquire() {
        $WaitOn();
        $ApiRequest('Specials/Inquire', JSON.stringify([
            { key: 'name', vlu: val('sp-name') },
            { key: 'phone', vlu: val('sp-phone') },
            { key: 'email', vlu: val('sp-email') },
            { key: 'date', vlu: val('sp-date') },
            { key: 'guests', vlu: val('sp-guests') },
            { key: 'room', vlu: val('sp-room') },
            { key: 'notes', vlu: val('sp-notes') }
        ]));
    }

    function pair() {
        $ApiRequest('Specials/Pair', JSON.stringify([{ key: 'dish', vlu: val('sp-dish') }]));
    }

    function amount(btn, v) {
        var c = document.querySelectorAll('#sp-amts .sp-chip, #sp-exps .sp-chip');
        for (var i = 0; i < c.length; i++) {
            c[i].classList.remove('sp-act');
        }
        btn.classList.add('sp-act');
        el('sp-custom').value = '';
        el('sp-amount').value = v;
        preview();
    }

    function custom() {
        var v = val('sp-custom');
        var c = document.querySelectorAll('#sp-amts .sp-chip, #sp-exps .sp-chip');
        for (var i = 0; i < c.length; i++) {
            c[i].classList.remove('sp-act');
        }
        el('sp-amount').value = v;
        preview();
    }

    function design() {
        var d = document.querySelector('input[name="sp-design"]:checked');
        return d ? d.value : '';
    }

    function giftData() {
        return [
            { key: 'amount', vlu: val('sp-amount') },
            { key: 'design', vlu: design() },
            { key: 'to', vlu: val('sp-to') },
            { key: 'from', vlu: val('sp-from') },
            { key: 'msg', vlu: val('sp-msg') }
        ];
    }

    function preview() {
        clearTimeout(ptimer);
        ptimer = setTimeout(function () {
            $ApiRequest('Specials/Preview', JSON.stringify(giftData()));
        }, 220);
    }

    function delivery(d) {
        giftDelivery = d;
        var b = document.querySelectorAll('.sp-seg-b[data-d]');
        for (var i = 0; i < b.length; i++) {
            b[i].classList.toggle('sp-act', b[i].getAttribute('data-d') === d);
        }
        el('sp-remail-l').classList.toggle('sp-hide', d === 'print');
    }

    function buy() {
        $WaitOn();
        $ApiRequest('Specials/Buy', JSON.stringify(giftData().concat([
            { key: 'delivery', vlu: giftDelivery },
            { key: 'remail', vlu: val('sp-remail') },
            { key: 'send', vlu: val('sp-send') },
            { key: 'email', vlu: val('sp-email') }
        ])));
    }

    function bought() {
        el('sp-done').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function send() {
        $WaitOn();
        $ApiRequest('Specials/Send', JSON.stringify([
            { key: 'name', vlu: val('sp-name') },
            { key: 'email', vlu: val('sp-email') },
            { key: 'topic', vlu: val('sp-topic') },
            { key: 'message', vlu: val('sp-msg') }
        ]));
    }

    function sent() {
        var f = el('sp-form');
        if (!f) {
            return;
        }
        var fields = f.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea');
        for (var i = 0; i < fields.length; i++) {
            fields[i].value = '';
        }
    }

    function subscribe() {
        $ApiRequest('Specials/Subscribe', JSON.stringify([{ key: 'email', vlu: val('sp-nl-email') }]));
    }

    function subscribed() {
        el('sp-nl-email').value = '';
    }

    function reveal() {
        document.addEventListener('click', function (e) {
            var box = el('sp-search');
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
            var h = el('sp-head');
            if (h) {
                h.classList.toggle('sp-scrolled', window.pageYOffset > 8);
            }
        }, { passive: true });
        window.addEventListener('resize', function () {
            if (window.innerWidth > 767) {
                closeNav();
            }
        });
        if (page() === 'Reservation' && val('sp-time') !== '') {
            el('sp-picked').classList.add('sp-on');
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

SpecialsJs.reveal();

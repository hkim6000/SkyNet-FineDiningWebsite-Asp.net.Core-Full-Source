var HomeJs = (function () {

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
        var s = document.querySelector('.hm-site');
        return s ? s.getAttribute('data-page') : '';
    }

    function openNav() {
        el('hm-nav').classList.add('hm-open');
        el('hm-scrim').classList.add('hm-open');
        document.body.style.overflow = 'hidden';
    }

    function closeNav() {
        el('hm-nav').classList.remove('hm-open');
        el('hm-scrim').classList.remove('hm-open');
        document.body.style.overflow = '';
    }

    function toggleSub(btn) {
        var li = btn.closest('.hm-mi');
        if (li) {
            li.classList.toggle('hm-exp');
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
            if (q === lastQ && el('hm-sugg').innerHTML !== '') {
                openSugg();
                return;
            }
            lastQ = q;
            $ApiRequest('Home/Search', JSON.stringify([{ key: 'q', vlu: q }]));
        }, 250);
    }

    function openSugg() {
        el('hm-sugg').classList.add('hm-open');
    }

    function closeSugg() {
        el('hm-sugg').classList.remove('hm-open');
    }

    function toast() {
        var t = el('hm-toast');
        t.classList.add('hm-open');
        clearTimeout(ttimer);
        ttimer = setTimeout(function () {
            t.classList.remove('hm-open');
        }, 3600);
    }

    function shown(id) {
        var e = el(id);
        if (e) {
            e.classList.add('hm-show');
        }
    }

    function openModal() {
        el('hm-modal').classList.add('hm-open');
        document.body.style.overflow = 'hidden';
    }

    function closeModal(e) {
        if (e && e.target && e.target.id !== 'hm-modal') {
            return;
        }
        el('hm-modal').classList.remove('hm-open');
        document.body.style.overflow = '';
    }

    function values() {
        var list = [];
        var fields = document.querySelectorAll('.hm-fv');
        for (var i = 0; i < fields.length; i++) {
            list.push({ key: fields[i].getAttribute('data-k'), vlu: (fields[i].value || '').trim() });
        }
        return list;
    }

    function filter() {
        $ApiRequest('Home/Filter', JSON.stringify(values()));
    }

    function chip(btn, value) {
        var chips = btn.parentNode.querySelectorAll('.hm-chip');
        for (var i = 0; i < chips.length; i++) {
            chips[i].classList.remove('hm-act');
        }
        btn.classList.add('hm-act');
        var p = page();
        if (p === 'Menu') {
            el('hm-f-course').value = value;
            filter();
        } else if (p === 'Wine') {
            el('hm-f-type').value = value;
            filter();
        } else {
            $ApiRequest('Home/Filter', JSON.stringify([{ key: 'kind', vlu: value }]));
        }
    }

    function diet(btn) {
        btn.classList.toggle('hm-act');
        var on = document.querySelectorAll('.hm-chip-t.hm-act');
        var list = [];
        for (var i = 0; i < on.length; i++) {
            list.push(on[i].getAttribute('data-d'));
        }
        el('hm-f-diet').value = list.join('.');
        filter();
    }

    function view(id) {
        $ApiRequest('Home/View', JSON.stringify([{ key: 'id', vlu: id }]));
    }

    function estimate() {
        $ApiRequest('Home/Estimate', JSON.stringify([
            { key: 'menu', vlu: val('hm-pmenu') },
            { key: 'guests', vlu: val('hm-pguests') },
            { key: 'pairing', vlu: el('hm-ppair').checked ? '1' : '' }
        ]));
    }

    function check() {
        $ApiRequest('Home/Check', JSON.stringify([
            { key: 'date', vlu: val('hm-cdate') },
            { key: 'party', vlu: val('hm-cparty') }
        ]));
    }

    function area(key) {
        seatArea = key;
        var b = document.querySelectorAll('.hm-seg-b[data-a]');
        for (var i = 0; i < b.length; i++) {
            b[i].classList.toggle('hm-act', b[i].getAttribute('data-a') === key);
        }
        var notes = {
            dining: 'Our main room, linen-laid tables and soft candlelight.',
            bar: 'The full menu at the bar for up to 3 guests; walk-ins welcome too.',
            counter: 'Eight seats facing the kitchen; Chef’s Counter menu only, Wednesday to Saturday at 6:00 and 8:30.'
        };
        el('hm-area-note').textContent = notes[key] || '';
        find();
    }

    function find() {
        $WaitOn();
        $ApiRequest('Home/Find', JSON.stringify([
            { key: 'date', vlu: val('hm-date') },
            { key: 'party', vlu: val('hm-party') },
            { key: 'area', vlu: seatArea }
        ]));
    }

    function pick(btn) {
        var t = document.querySelectorAll('.hm-time');
        for (var i = 0; i < t.length; i++) {
            t[i].classList.remove('hm-act');
        }
        btn.classList.add('hm-act');
        picked(btn.getAttribute('data-t'), btn.getAttribute('data-l'));
        var f = el('hm-form');
        if (f && window.innerWidth < 1024) {
            f.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function picked(time, label) {
        el('hm-time').value = time || '';
        var p = el('hm-picked');
        if (time) {
            p.innerHTML = '';
            var b = document.createElement('b');
            b.textContent = label || time;
            p.appendChild(b);
            p.classList.add('hm-on');
        } else {
            p.innerHTML = '<span>Choose a time above.</span>';
            p.classList.remove('hm-on');
        }
    }

    function bookTable() {
        $WaitOn();
        $ApiRequest('Home/Book', JSON.stringify([
            { key: 'date', vlu: val('hm-date') },
            { key: 'party', vlu: val('hm-party') },
            { key: 'area', vlu: seatArea },
            { key: 'time', vlu: val('hm-time') },
            { key: 'name', vlu: val('hm-name') },
            { key: 'phone', vlu: val('hm-phone') },
            { key: 'email', vlu: val('hm-email') },
            { key: 'occasion', vlu: val('hm-occasion') },
            { key: 'notes', vlu: val('hm-notes') },
            { key: 'agree', vlu: el('hm-agree').checked ? '1' : '' }
        ]));
    }

    function bookEvent() {
        $WaitOn();
        $ApiRequest('Home/Book', JSON.stringify([
            { key: 'id', vlu: val('hm-id') },
            { key: 'guests', vlu: val('hm-guests') },
            { key: 'name', vlu: val('hm-name') },
            { key: 'phone', vlu: val('hm-phone') },
            { key: 'email', vlu: val('hm-email') },
            { key: 'notes', vlu: val('hm-notes') }
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
        var d = el('hm-done');
        d.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function seats() {
        $ApiRequest('Home/Seats', JSON.stringify([
            { key: 'id', vlu: val('hm-id') },
            { key: 'guests', vlu: val('hm-guests') }
        ]));
    }

    function inquire() {
        $WaitOn();
        $ApiRequest('Home/Inquire', JSON.stringify([
            { key: 'name', vlu: val('hm-name') },
            { key: 'phone', vlu: val('hm-phone') },
            { key: 'email', vlu: val('hm-email') },
            { key: 'date', vlu: val('hm-date') },
            { key: 'guests', vlu: val('hm-guests') },
            { key: 'room', vlu: val('hm-room') },
            { key: 'notes', vlu: val('hm-notes') }
        ]));
    }

    function pair() {
        $ApiRequest('Home/Pair', JSON.stringify([{ key: 'dish', vlu: val('hm-dish') }]));
    }

    function amount(btn, v) {
        var c = document.querySelectorAll('#hm-amts .hm-chip, #hm-exps .hm-chip');
        for (var i = 0; i < c.length; i++) {
            c[i].classList.remove('hm-act');
        }
        btn.classList.add('hm-act');
        el('hm-custom').value = '';
        el('hm-amount').value = v;
        preview();
    }

    function custom() {
        var v = val('hm-custom');
        var c = document.querySelectorAll('#hm-amts .hm-chip, #hm-exps .hm-chip');
        for (var i = 0; i < c.length; i++) {
            c[i].classList.remove('hm-act');
        }
        el('hm-amount').value = v;
        preview();
    }

    function design() {
        var d = document.querySelector('input[name="hm-design"]:checked');
        return d ? d.value : '';
    }

    function giftData() {
        return [
            { key: 'amount', vlu: val('hm-amount') },
            { key: 'design', vlu: design() },
            { key: 'to', vlu: val('hm-to') },
            { key: 'from', vlu: val('hm-from') },
            { key: 'msg', vlu: val('hm-msg') }
        ];
    }

    function preview() {
        clearTimeout(ptimer);
        ptimer = setTimeout(function () {
            $ApiRequest('Home/Preview', JSON.stringify(giftData()));
        }, 220);
    }

    function delivery(d) {
        giftDelivery = d;
        var b = document.querySelectorAll('.hm-seg-b[data-d]');
        for (var i = 0; i < b.length; i++) {
            b[i].classList.toggle('hm-act', b[i].getAttribute('data-d') === d);
        }
        el('hm-remail-l').classList.toggle('hm-hide', d === 'print');
    }

    function buy() {
        $WaitOn();
        $ApiRequest('Home/Buy', JSON.stringify(giftData().concat([
            { key: 'delivery', vlu: giftDelivery },
            { key: 'remail', vlu: val('hm-remail') },
            { key: 'send', vlu: val('hm-send') },
            { key: 'email', vlu: val('hm-email') }
        ])));
    }

    function bought() {
        el('hm-done').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function send() {
        $WaitOn();
        $ApiRequest('Home/Send', JSON.stringify([
            { key: 'name', vlu: val('hm-name') },
            { key: 'email', vlu: val('hm-email') },
            { key: 'topic', vlu: val('hm-topic') },
            { key: 'message', vlu: val('hm-msg') }
        ]));
    }

    function sent() {
        var f = el('hm-form');
        if (!f) {
            return;
        }
        var fields = f.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea');
        for (var i = 0; i < fields.length; i++) {
            fields[i].value = '';
        }
    }

    function subscribe() {
        $ApiRequest('Home/Subscribe', JSON.stringify([{ key: 'email', vlu: val('hm-nl-email') }]));
    }

    function subscribed() {
        el('hm-nl-email').value = '';
    }

    function reveal() {
        document.addEventListener('click', function (e) {
            var box = el('hm-search');
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
            var h = el('hm-head');
            if (h) {
                h.classList.toggle('hm-scrolled', window.pageYOffset > 8);
            }
        }, { passive: true });
        window.addEventListener('resize', function () {
            if (window.innerWidth > 767) {
                closeNav();
            }
        });
        if (page() === 'Reservation' && val('hm-time') !== '') {
            el('hm-picked').classList.add('hm-on');
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

HomeJs.reveal();

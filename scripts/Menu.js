var MenuJs = (function () {

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
        var s = document.querySelector('.mn-site');
        return s ? s.getAttribute('data-page') : '';
    }

    function openNav() {
        el('mn-nav').classList.add('mn-open');
        el('mn-scrim').classList.add('mn-open');
        document.body.style.overflow = 'hidden';
    }

    function closeNav() {
        el('mn-nav').classList.remove('mn-open');
        el('mn-scrim').classList.remove('mn-open');
        document.body.style.overflow = '';
    }

    function toggleSub(btn) {
        var li = btn.closest('.mn-mi');
        if (li) {
            li.classList.toggle('mn-exp');
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
            if (q === lastQ && el('mn-sugg').innerHTML !== '') {
                openSugg();
                return;
            }
            lastQ = q;
            $ApiRequest('Menu/Search', JSON.stringify([{ key: 'q', vlu: q }]));
        }, 250);
    }

    function openSugg() {
        el('mn-sugg').classList.add('mn-open');
    }

    function closeSugg() {
        el('mn-sugg').classList.remove('mn-open');
    }

    function toast() {
        var t = el('mn-toast');
        t.classList.add('mn-open');
        clearTimeout(ttimer);
        ttimer = setTimeout(function () {
            t.classList.remove('mn-open');
        }, 3600);
    }

    function shown(id) {
        var e = el(id);
        if (e) {
            e.classList.add('mn-show');
        }
    }

    function openModal() {
        el('mn-modal').classList.add('mn-open');
        document.body.style.overflow = 'hidden';
    }

    function closeModal(e) {
        if (e && e.target && e.target.id !== 'mn-modal') {
            return;
        }
        el('mn-modal').classList.remove('mn-open');
        document.body.style.overflow = '';
    }

    function values() {
        var list = [];
        var fields = document.querySelectorAll('.mn-fv');
        for (var i = 0; i < fields.length; i++) {
            list.push({ key: fields[i].getAttribute('data-k'), vlu: (fields[i].value || '').trim() });
        }
        return list;
    }

    function filter() {
        $ApiRequest('Menu/Filter', JSON.stringify(values()));
    }

    function chip(btn, value) {
        var chips = btn.parentNode.querySelectorAll('.mn-chip');
        for (var i = 0; i < chips.length; i++) {
            chips[i].classList.remove('mn-act');
        }
        btn.classList.add('mn-act');
        var p = page();
        if (p === 'Menu') {
            el('mn-f-course').value = value;
            filter();
        } else if (p === 'Wine') {
            el('mn-f-type').value = value;
            filter();
        } else {
            $ApiRequest('Menu/Filter', JSON.stringify([{ key: 'kind', vlu: value }]));
        }
    }

    function diet(btn) {
        btn.classList.toggle('mn-act');
        var on = document.querySelectorAll('.mn-chip-t.mn-act');
        var list = [];
        for (var i = 0; i < on.length; i++) {
            list.push(on[i].getAttribute('data-d'));
        }
        el('mn-f-diet').value = list.join('.');
        filter();
    }

    function view(id) {
        $ApiRequest('Menu/View', JSON.stringify([{ key: 'id', vlu: id }]));
    }

    function estimate() {
        $ApiRequest('Menu/Estimate', JSON.stringify([
            { key: 'menu', vlu: val('mn-pmenu') },
            { key: 'guests', vlu: val('mn-pguests') },
            { key: 'pairing', vlu: el('mn-ppair').checked ? '1' : '' }
        ]));
    }

    function check() {
        $ApiRequest('Menu/Check', JSON.stringify([
            { key: 'date', vlu: val('mn-cdate') },
            { key: 'party', vlu: val('mn-cparty') }
        ]));
    }

    function area(key) {
        seatArea = key;
        var b = document.querySelectorAll('.mn-seg-b[data-a]');
        for (var i = 0; i < b.length; i++) {
            b[i].classList.toggle('mn-act', b[i].getAttribute('data-a') === key);
        }
        var notes = {
            dining: 'Our main room, linen-laid tables and soft candlelight.',
            bar: 'The full menu at the bar for up to 3 guests; walk-ins welcome too.',
            counter: 'Eight seats facing the kitchen; Chef’s Counter menu only, Wednesday to Saturday at 6:00 and 8:30.'
        };
        el('mn-area-note').textContent = notes[key] || '';
        find();
    }

    function find() {
        $WaitOn();
        $ApiRequest('Menu/Find', JSON.stringify([
            { key: 'date', vlu: val('mn-date') },
            { key: 'party', vlu: val('mn-party') },
            { key: 'area', vlu: seatArea }
        ]));
    }

    function pick(btn) {
        var t = document.querySelectorAll('.mn-time');
        for (var i = 0; i < t.length; i++) {
            t[i].classList.remove('mn-act');
        }
        btn.classList.add('mn-act');
        picked(btn.getAttribute('data-t'), btn.getAttribute('data-l'));
        var f = el('mn-form');
        if (f && window.innerWidth < 1024) {
            f.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function picked(time, label) {
        el('mn-time').value = time || '';
        var p = el('mn-picked');
        if (time) {
            p.innerHTML = '';
            var b = document.createElement('b');
            b.textContent = label || time;
            p.appendChild(b);
            p.classList.add('mn-on');
        } else {
            p.innerHTML = '<span>Choose a time above.</span>';
            p.classList.remove('mn-on');
        }
    }

    function bookTable() {
        $WaitOn();
        $ApiRequest('Menu/Book', JSON.stringify([
            { key: 'date', vlu: val('mn-date') },
            { key: 'party', vlu: val('mn-party') },
            { key: 'area', vlu: seatArea },
            { key: 'time', vlu: val('mn-time') },
            { key: 'name', vlu: val('mn-name') },
            { key: 'phone', vlu: val('mn-phone') },
            { key: 'email', vlu: val('mn-email') },
            { key: 'occasion', vlu: val('mn-occasion') },
            { key: 'notes', vlu: val('mn-notes') },
            { key: 'agree', vlu: el('mn-agree').checked ? '1' : '' }
        ]));
    }

    function bookEvent() {
        $WaitOn();
        $ApiRequest('Menu/Book', JSON.stringify([
            { key: 'id', vlu: val('mn-id') },
            { key: 'guests', vlu: val('mn-guests') },
            { key: 'name', vlu: val('mn-name') },
            { key: 'phone', vlu: val('mn-phone') },
            { key: 'email', vlu: val('mn-email') },
            { key: 'notes', vlu: val('mn-notes') }
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
        var d = el('mn-done');
        d.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function seats() {
        $ApiRequest('Menu/Seats', JSON.stringify([
            { key: 'id', vlu: val('mn-id') },
            { key: 'guests', vlu: val('mn-guests') }
        ]));
    }

    function inquire() {
        $WaitOn();
        $ApiRequest('Menu/Inquire', JSON.stringify([
            { key: 'name', vlu: val('mn-name') },
            { key: 'phone', vlu: val('mn-phone') },
            { key: 'email', vlu: val('mn-email') },
            { key: 'date', vlu: val('mn-date') },
            { key: 'guests', vlu: val('mn-guests') },
            { key: 'room', vlu: val('mn-room') },
            { key: 'notes', vlu: val('mn-notes') }
        ]));
    }

    function pair() {
        $ApiRequest('Menu/Pair', JSON.stringify([{ key: 'dish', vlu: val('mn-dish') }]));
    }

    function amount(btn, v) {
        var c = document.querySelectorAll('#mn-amts .mn-chip, #mn-exps .mn-chip');
        for (var i = 0; i < c.length; i++) {
            c[i].classList.remove('mn-act');
        }
        btn.classList.add('mn-act');
        el('mn-custom').value = '';
        el('mn-amount').value = v;
        preview();
    }

    function custom() {
        var v = val('mn-custom');
        var c = document.querySelectorAll('#mn-amts .mn-chip, #mn-exps .mn-chip');
        for (var i = 0; i < c.length; i++) {
            c[i].classList.remove('mn-act');
        }
        el('mn-amount').value = v;
        preview();
    }

    function design() {
        var d = document.querySelector('input[name="mn-design"]:checked');
        return d ? d.value : '';
    }

    function giftData() {
        return [
            { key: 'amount', vlu: val('mn-amount') },
            { key: 'design', vlu: design() },
            { key: 'to', vlu: val('mn-to') },
            { key: 'from', vlu: val('mn-from') },
            { key: 'msg', vlu: val('mn-msg') }
        ];
    }

    function preview() {
        clearTimeout(ptimer);
        ptimer = setTimeout(function () {
            $ApiRequest('Menu/Preview', JSON.stringify(giftData()));
        }, 220);
    }

    function delivery(d) {
        giftDelivery = d;
        var b = document.querySelectorAll('.mn-seg-b[data-d]');
        for (var i = 0; i < b.length; i++) {
            b[i].classList.toggle('mn-act', b[i].getAttribute('data-d') === d);
        }
        el('mn-remail-l').classList.toggle('mn-hide', d === 'print');
    }

    function buy() {
        $WaitOn();
        $ApiRequest('Menu/Buy', JSON.stringify(giftData().concat([
            { key: 'delivery', vlu: giftDelivery },
            { key: 'remail', vlu: val('mn-remail') },
            { key: 'send', vlu: val('mn-send') },
            { key: 'email', vlu: val('mn-email') }
        ])));
    }

    function bought() {
        el('mn-done').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function send() {
        $WaitOn();
        $ApiRequest('Menu/Send', JSON.stringify([
            { key: 'name', vlu: val('mn-name') },
            { key: 'email', vlu: val('mn-email') },
            { key: 'topic', vlu: val('mn-topic') },
            { key: 'message', vlu: val('mn-msg') }
        ]));
    }

    function sent() {
        var f = el('mn-form');
        if (!f) {
            return;
        }
        var fields = f.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea');
        for (var i = 0; i < fields.length; i++) {
            fields[i].value = '';
        }
    }

    function subscribe() {
        $ApiRequest('Menu/Subscribe', JSON.stringify([{ key: 'email', vlu: val('mn-nl-email') }]));
    }

    function subscribed() {
        el('mn-nl-email').value = '';
    }

    function reveal() {
        document.addEventListener('click', function (e) {
            var box = el('mn-search');
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
            var h = el('mn-head');
            if (h) {
                h.classList.toggle('mn-scrolled', window.pageYOffset > 8);
            }
        }, { passive: true });
        window.addEventListener('resize', function () {
            if (window.innerWidth > 767) {
                closeNav();
            }
        });
        if (page() === 'Reservation' && val('mn-time') !== '') {
            el('mn-picked').classList.add('mn-on');
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

MenuJs.reveal();

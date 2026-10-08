using System.Globalization;
using System.Text;
using System.Text.Json;
using FineDining.Models;
using SkyNet;

namespace FineDining.codes
{
    public class Event : WebPage
    {
        public override async Task OnInitialized()
        {
            HtmlDoc.SetTitle("Event | Aurelle");
            HtmlDoc.AddMetaElement("viewport", "width=device-width, initial-scale=1");
            HtmlDoc.AddMetaElement("description", "Details and booking for an event at Aurelle.");

            SiteData site = await LoadSite();
            DateTime today = DateTime.Today;
            List<EventItem> sorted = site.Events.OrderBy(e => EventDate(e, today)).ToList();
            string id = (QueryValue("id") ?? string.Empty).Trim().ToLowerInvariant();
            EventItem? ev = site.Events.FirstOrDefault(e => e.Id == id) ?? sorted.FirstOrDefault();
            if (ev == null)
            {
                return;
            }
            DateTime date = EventDate(ev, today);
            StringBuilder menu = new StringBuilder();
            foreach (string m in ev.Menu)
            {
                menu.Append("<li>" + HtmlEncode(m) + "</li>");
            }
            HtmlDoc.HtmlBodyText = HtmlDoc.HtmlBodyText
                .Replace("{plhd_crumb}", HtmlEncode(ev.Title))
                .Replace("{plhd_image}", ev.Image)
                .Replace("{plhd_title}", HtmlEncode(ev.Title))
                .Replace("{plhd_kind}", HtmlEncode(LabelOf(site.EventKinds, ev.Kind)))
                .Replace("{plhd_when}", "<span>" + date.ToString("dddd, MMMM d", Inv) + "</span><span>" + HtmlEncode(ev.Time) + "</span><span>" + Money(ev.Price) + " per guest</span>")
                .Replace("{plhd_desc}", HtmlEncode(ev.Description))
                .Replace("{plhd_seats}", SeatsBar(ev))
                .Replace("{plhd_menu}", menu.ToString())
                .Replace("{plhd_id}", ev.Id)
                .Replace("{plhd_price}", EventQuote(ev, 2))
                .Replace("{plhd_more}", EventCards(site, sorted.Where(e => e.Id != ev.Id).Take(3).ToList(), today));
        }

        public async Task<ApiResponse> Seats()
        {
            ApiResponse response = new ApiResponse();
            SiteData site = await LoadSite();
            EventItem? ev = site.Events.FirstOrDefault(e => e.Id == (GetDataValue("id") ?? string.Empty).Trim());
            int guests;
            if (ev == null || !int.TryParse(GetDataValue("guests"), out guests) || guests < 1 || guests > 8)
            {
                return response;
            }
            response.SetElementContents("et-price", EventQuote(ev, guests));
            response.SetElementContents("et-e-guests", guests > ev.Seats - ev.Taken ? (ev.Seats == ev.Taken ? "This event is sold out." : "Only " + CountText(ev.Seats - ev.Taken, "seat is", "seats are") + " left.") : string.Empty);
            return response;
        }

        public async Task<ApiResponse> Book()
        {
            ApiResponse response = new ApiResponse();
            SiteData site = await LoadSite();
            DateTime today = DateTime.Today;
            EventItem? ev = site.Events.FirstOrDefault(e => e.Id == (GetDataValue("id") ?? string.Empty).Trim());
            if (ev == null)
            {
                return response;
            }
            int guests;
            int.TryParse(GetDataValue("guests"), out guests);
            string name = (GetDataValue("name") ?? string.Empty).Trim();
            string phone = (GetDataValue("phone") ?? string.Empty).Trim();
            string email = (GetDataValue("email") ?? string.Empty).Trim();
            int left = ev.Seats - ev.Taken;

            string eGuests = guests < 1 || guests > 8 ? "Please choose 1 to 8 guests." : left == 0 ? "This event is sold out. Reply to any event email to join the waitlist." : guests > left ? "Only " + CountText(left, "seat is", "seats are") + " left." : string.Empty;
            string eName = name.Length < 2 || name.Length > 60 ? "Please tell us your name." : string.Empty;
            string ePhone = !IsPhone(phone) ? "Please enter a 10-digit phone number." : string.Empty;
            string eEmail = !IsEmail(email) ? "Please enter a valid email address." : string.Empty;
            response.SetElementContents("et-e-guests", eGuests);
            response.SetElementContents("et-e-name", eName);
            response.SetElementContents("et-e-phone", ePhone);
            response.SetElementContents("et-e-email", eEmail);
            if (eGuests + eName + ePhone + eEmail != string.Empty)
            {
                response.SetElementContents("et-sent", string.Empty);
                return response;
            }
            DateTime date = EventDate(ev, today);
            string code = Code("EV", ev.Id + name + email + guests);
            response.SetElementContents("et-sent", "<b>You&rsquo;re on the list, " + HtmlEncode(name) + ".</b> " + CountText(guests, "seat", "seats") + " for " + HtmlEncode(ev.Title) + " on " + date.ToString("dddd, MMMM d", Inv) + " at " + HtmlEncode(ev.Time) + ". Confirmation " + code + ". <small>This is a demo: no seats were held and nothing was charged.</small>");
            response.ExecuteScript("EventJs.sent();");
            return response;
        }

        private static string SeatsBar(EventItem ev)
        {
            int left = ev.Seats - ev.Taken;
            int pct = ev.Seats == 0 ? 100 : (int)Math.Round(100.0 * ev.Taken / ev.Seats);
            return "<div class=\"et-bar\"><i style=\"width:" + pct + "%\"></i></div><span>" + (left == 0 ? "<b>Sold out</b> &middot; join the waitlist below" : "<b>" + left + " of " + ev.Seats + "</b> seats left") + "</span>";
        }

        private static string EventQuote(EventItem ev, int guests)
        {
            decimal sub = ev.Price * guests;
            decimal service = Math.Round(sub * 0.20m, 2, MidpointRounding.AwayFromZero);
            decimal tax = Math.Round(sub * 0.075m, 2, MidpointRounding.AwayFromZero);
            return "<ul><li><span>" + Money(ev.Price) + " &times; " + CountText(guests, "guest", "guests") + "</span><b>" + Money2(sub) + "</b></li><li><span>Service (20%)</span><b>" + Money2(service) + "</b></li><li><span>Tax (7.5%)</span><b>" + Money2(tax) + "</b></li><li class=\"et-quote-t\"><span>Total</span><b>" + Money2(sub + service + tax) + "</b></li></ul>";
        }

        private static readonly CultureInfo Inv = CultureInfo.InvariantCulture;

        public async Task<ApiResponse> Search()
        {
            ApiResponse response = new ApiResponse();
            string q = Clip(GetDataValue("q"));
            SiteData site = await LoadSite();
            DateTime today = DateTime.Today;
            List<string> rows = new List<string>();
            int total = 0;
            if (q.Length >= 2)
            {
                foreach (Dish d in site.Dishes.Where(d => Has(d.Name, q) || Has(d.Description, q)).OrderBy(d => d.Rank))
                {
                    total++;
                    rows.Add(Sugg("Menu", d.Image, d.Name, Money(d.Price) + " · " + LabelOf(site.Courses, d.Course), "Menu?course=" + d.Course + "#carte"));
                }
                foreach (Special s in site.Specials.Where(s => Has(s.Title, q) || Has(s.Description, q)))
                {
                    total++;
                    rows.Add(Sugg("Special", s.Image, s.Title, SpecialStatus(s, today), "Specials"));
                }
                foreach (EventItem e in site.Events.Where(e => Has(e.Title, q) || Has(e.Description, q)).OrderBy(e => EventDate(e, today)))
                {
                    total++;
                    rows.Add(Sugg("Event", e.Image, e.Title, EventDate(e, today).ToString("ddd, MMM d", Inv) + " · " + e.Time, "Event?id=" + e.Id));
                }
                foreach (WineItem w in site.Wines.Where(w => Has(w.Name, q) || Has(w.Producer, q) || Has(w.Grapes, q) || Has(LabelOf(site.Regions, w.Region), q)))
                {
                    total++;
                    rows.Add(Sugg("Wine", string.Empty, w.Name, w.Producer + " · " + w.Vintage, "Wine?type=" + w.Type));
                }
            }
            StringBuilder sb = new StringBuilder();
            if (total == 0)
            {
                sb.Append("<div class=\"et-sg-none\">No results for &ldquo;" + HtmlEncode(q) + "&rdquo;</div>");
            }
            else
            {
                foreach (string r in rows.Take(7))
                {
                    sb.Append(r);
                }
                sb.Append("<div class=\"et-sg-foot\">" + total + (total == 1 ? " result" : " results") + " across the menu, specials, events and wine</div>");
            }
            response.SetElementContents("et-sugg", sb.ToString());
            response.ExecuteScript("EventJs.openSugg();");
            return response;
        }

        public async Task<ApiResponse> Subscribe()
        {
            ApiResponse response = new ApiResponse();
            await Task.CompletedTask;
            string email = (GetDataValue("email") ?? string.Empty).Trim();
            if (!IsEmail(email))
            {
                response.SetElementContents("et-nl-msg", "<span class=\"et-err\">Please enter a valid email address.</span>");
                return response;
            }
            response.SetElementContents("et-nl-msg", "<span class=\"et-ok\">Thank you. Invitations will go to " + HtmlEncode(email) + ". (Demo only &mdash; nothing was stored.)</span>");
            response.ExecuteScript("EventJs.subscribed();");
            return response;
        }

        private sealed class Slot
        {
            public string Time { get; set; } = string.Empty;
            public string Label { get; set; } = string.Empty;
            public bool Open { get; set; }
        }

        private static List<Slot> Slots(SiteData site, DateTime date, int party, string area, DateTime now)
        {
            List<Slot> list = new List<Slot>();
            if (site.Hours.Count != 7)
            {
                return list;
            }
            DayHours h = site.Hours[(int)date.DayOfWeek];
            TimeSpan open, close;
            if (h.Open == string.Empty || !TimeSpan.TryParse(h.Open, Inv, out open) || !TimeSpan.TryParse(h.Close, Inv, out close))
            {
                return list;
            }
            List<TimeSpan> times = new List<TimeSpan>();
            if (area == "counter")
            {
                int dow = (int)date.DayOfWeek;
                if (dow >= 3 && dow <= 6)
                {
                    times.Add(new TimeSpan(18, 0, 0));
                    times.Add(new TimeSpan(20, 30, 0));
                }
            }
            else
            {
                for (TimeSpan t = open; t <= close; t = t.Add(TimeSpan.FromMinutes(30)))
                {
                    times.Add(t);
                }
            }
            foreach (TimeSpan t in times)
            {
                list.Add(new Slot { Time = t.ToString(@"hh\:mm", Inv), Label = TimeText(t), Open = Available(date, t, party, area, now) });
            }
            return list;
        }

        private static bool Available(DateTime date, TimeSpan t, int party, string area, DateTime now)
        {
            if (date.Date.Add(t) <= now.AddMinutes(60))
            {
                return false;
            }
            int v = (int)(Hash(date.ToString("yyyyMMdd", Inv) + "|" + t.ToString(@"hh\:mm", Inv) + "|" + area) % 100);
            int th = party <= 2 ? 30 : party <= 4 ? 45 : party <= 6 ? 60 : 72;
            if (area == "counter")
            {
                th = 35 + party * 5;
            }
            if (date.DayOfWeek == DayOfWeek.Friday || date.DayOfWeek == DayOfWeek.Saturday)
            {
                th += 12;
            }
            if (t >= new TimeSpan(19, 0, 0) && t <= new TimeSpan(20, 0, 0))
            {
                th += 10;
            }
            return v >= th;
        }

        private static uint Hash(string s)
        {
            uint h = 2166136261;
            foreach (char c in s)
            {
                h ^= c;
                h *= 16777619;
            }
            return h;
        }

        private static string Code(string prefix, string seed)
        {
            const string abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
            uint h = Hash(seed);
            StringBuilder sb = new StringBuilder(prefix + "-");
            for (int i = 0; i < 6; i++)
            {
                sb.Append(abc[(int)(h % (uint)abc.Length)]);
                h = h / (uint)abc.Length + Hash(seed + i) % 7919;
            }
            return sb.ToString();
        }

        private static DateTime EventDate(EventItem e, DateTime today)
        {
            if (!string.IsNullOrEmpty(e.Fixed))
            {
                string[] p = e.Fixed.Split('-');
                int m, d;
                if (p.Length == 2 && int.TryParse(p[0], out m) && int.TryParse(p[1], out d))
                {
                    DateTime f = new DateTime(today.Year, m, d);
                    return f < today ? f.AddYears(1) : f;
                }
            }
            DateTime x = today.AddDays(1);
            while ((int)x.DayOfWeek != e.Weekday)
            {
                x = x.AddDays(1);
            }
            return x.AddDays(7 * e.Week);
        }

        private static bool SpecialNow(Special s, DateTime today)
        {
            return s.Kind == "weekly" ? s.Days.Contains((int)today.DayOfWeek) : s.Months.Contains(today.Month);
        }

        private static string SpecialStatus(Special s, DateTime today)
        {
            if (s.Kind == "weekly")
            {
                if (s.Days.Contains((int)today.DayOfWeek))
                {
                    return "Tonight";
                }
                DateTime d = today.AddDays(1);
                for (int i = 0; i < 7 && !s.Days.Contains((int)d.DayOfWeek); i++)
                {
                    d = d.AddDays(1);
                }
                return "Next: " + d.ToString("dddd, MMM d", Inv);
            }
            if (s.Months.Contains(today.Month))
            {
                DateTime m = new DateTime(today.Year, today.Month, 1);
                while (s.Months.Contains(m.AddMonths(1).Month) && m < today.AddYears(1))
                {
                    m = m.AddMonths(1);
                }
                DateTime end = m.AddMonths(1).AddDays(-1);
                int days = (end - today).Days;
                return days == 0 ? "In season · last day" : "In season · " + days + (days == 1 ? " day" : " days") + " left";
            }
            DateTime n = new DateTime(today.Year, today.Month, 1).AddMonths(1);
            for (int i = 0; i < 12 && !s.Months.Contains(n.Month); i++)
            {
                n = n.AddMonths(1);
            }
            return "Returns in " + n.ToString("MMMM", Inv);
        }

        private static string OpenStatus(SiteData site, DateTime now)
        {
            if (site.Hours.Count != 7)
            {
                return string.Empty;
            }
            DayHours h = site.Hours[(int)now.DayOfWeek];
            TimeSpan open, close;
            if (h.Open != string.Empty && TimeSpan.TryParse(h.Open, Inv, out open) && TimeSpan.TryParse(h.Close, Inv, out close))
            {
                TimeSpan t = now.TimeOfDay;
                if (t < open)
                {
                    return "<span class=\"et-dot et-dot-on\"></span>Open tonight &middot; " + TimeText(open) + " &ndash; " + TimeText(close);
                }
                if (t <= close.Add(TimeSpan.FromMinutes(90)))
                {
                    return "<span class=\"et-dot et-dot-on\"></span>Open now &middot; last seating " + TimeText(close);
                }
            }
            for (int i = 1; i <= 7; i++)
            {
                DateTime d = now.Date.AddDays(i);
                DayHours n = site.Hours[(int)d.DayOfWeek];
                if (n.Open != string.Empty)
                {
                    return "<span class=\"et-dot\"></span>Closed " + (h.Open == string.Empty ? "today" : "for the night") + " &middot; opens " + (i == 1 ? "tomorrow" : d.ToString("dddd", Inv)) + " at " + TimeText(n.Open);
                }
            }
            return string.Empty;
        }

        private static string TimeText(string hhmm)
        {
            TimeSpan t;
            return TimeSpan.TryParse(hhmm, Inv, out t) ? TimeText(t) : hhmm;
        }

        private static string TimeText(TimeSpan t)
        {
            int h = t.Hours % 12 == 0 ? 12 : t.Hours % 12;
            return h + ":" + t.Minutes.ToString("00", Inv) + (t.Hours < 12 ? " am" : " pm");
        }

        private static string DayText(DateTime date, DateTime today)
        {
            if (date == today)
            {
                return "tonight";
            }
            if (date == today.AddDays(1))
            {
                return "tomorrow";
            }
            return "on " + date.ToString("dddd, MMM d", Inv);
        }

        private static string DateOptions(SiteData site, DateTime today, int days, DateTime selected)
        {
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < days; i++)
            {
                DateTime d = today.AddDays(i);
                bool closed = site.Hours.Count == 7 && site.Hours[(int)d.DayOfWeek].Open == string.Empty;
                string label = (i == 0 ? "Today, " : i == 1 ? "Tomorrow, " : d.ToString("ddd, ", Inv)) + d.ToString("MMM d", Inv) + (closed ? " · closed" : string.Empty);
                sb.Append("<option value=\"" + d.ToString("yyyy-MM-dd", Inv) + "\"" + (closed ? " disabled" : string.Empty) + (d == selected && !closed ? " selected" : string.Empty) + ">" + label + "</option>");
            }
            return sb.ToString();
        }

        private static bool ParseDate(string? v, out DateTime date)
        {
            return DateTime.TryParseExact((v ?? string.Empty).Trim(), "yyyy-MM-dd", Inv, DateTimeStyles.None, out date);
        }

        private static string Sugg(string type, string img, string title, string sub, string href)
        {
            string pic = img == string.Empty ? "<span class=\"et-sg-i\">&#127863;</span>" : "<img src=\"" + img + "\" alt=\"\">";
            return "<a class=\"et-sg\" href=\"" + href + "\">" + pic + "<span><b>" + HtmlEncode(title) + "</b><small>" + type + " &middot; " + HtmlEncode(sub) + "</small></span></a>";
        }

        private async Task<SiteData> LoadSite()
        {
            string file = Path.Combine(DataPath ?? string.Empty, "site.json");
            if (!File.Exists(file))
            {
                file = Path.Combine(Directory.GetCurrentDirectory(), "data", "site.json");
            }
            if (!File.Exists(file))
            {
                return new SiteData();
            }
            string json = await File.ReadAllTextAsync(file);
            JsonSerializerOptions options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            return JsonSerializer.Deserialize<SiteData>(json, options) ?? new SiteData();
        }

        private static string Clip(string? value)
        {
            string q = (value ?? string.Empty).Trim();
            return q.Length > 40 ? q.Substring(0, 40) : q;
        }

        private static string Pick(string? value, IEnumerable<string> allowed)
        {
            string v = (value ?? string.Empty).Trim().ToLowerInvariant();
            return allowed.Contains(v) ? v : string.Empty;
        }

        private static bool Has(string text, string q)
        {
            return (text ?? string.Empty).Contains(q, StringComparison.OrdinalIgnoreCase);
        }

        private static bool IsEmail(string v)
        {
            if (v.Length < 5 || v.Length > 80 || v.Contains(' '))
            {
                return false;
            }
            int at = v.IndexOf('@');
            int dot = v.LastIndexOf('.');
            return at > 0 && at == v.LastIndexOf('@') && dot > at + 1 && dot < v.Length - 1;
        }

        private static bool IsPhone(string v)
        {
            string digits = new string(v.Where(char.IsDigit).ToArray());
            return digits.Length == 10 || (digits.Length == 11 && digits[0] == '1');
        }

        private static string Money(decimal v)
        {
            return "$" + (v == Math.Floor(v) ? v.ToString("#,0", Inv) : v.ToString("#,0.00", Inv));
        }

        private static string Money2(decimal v)
        {
            return "$" + v.ToString("#,0.00", Inv);
        }

        private static string CountText(int n, string one, string many)
        {
            return n + " " + (n == 1 ? one : many);
        }

        private static string LabelOf(List<KeyLabel> list, string key)
        {
            return list.Where(x => x.Key == key).Select(x => x.Label).FirstOrDefault() ?? key;
        }

        private static string Chips(List<KeyLabel> items, string active)
        {
            StringBuilder sb = new StringBuilder();
            sb.Append("<button type=\"button\" class=\"et-chip" + (active == string.Empty ? " et-act" : string.Empty) + "\" onclick=\"EventJs.chip(this, '')\">All</button>");
            foreach (KeyLabel k in items)
            {
                sb.Append("<button type=\"button\" class=\"et-chip" + (k.Key == active ? " et-act" : string.Empty) + "\" onclick=\"EventJs.chip(this, '" + k.Key + "')\">" + HtmlEncode(k.Label) + "</button>");
            }
            return sb.ToString();
        }

        private static string DietTags(SiteData site, Dish d)
        {
            if (d.Diets.Count == 0)
            {
                return string.Empty;
            }
            StringBuilder sb = new StringBuilder("<span class=\"et-tags\">");
            foreach (string k in d.Diets)
            {
                sb.Append("<span class=\"et-tag et-tag-" + k + "\" title=\"" + HtmlEncode(LabelOf(site.Diets, k)) + "\">" + (k == "veg" ? "V" : k == "gf" ? "GF" : "NF") + "</span>");
            }
            return sb.Append("</span>").ToString();
        }

        private static string WinePrice(WineItem w)
        {
            List<string> p = new List<string>();
            if (w.Glass > 0)
            {
                p.Add(Money(w.Glass) + " glass");
            }
            if (w.Bottle > 0)
            {
                p.Add(Money(w.Bottle) + " bottle");
            }
            return string.Join(" &middot; ", p);
        }

        private static string SpecialCards(List<Special> list, DateTime today)
        {
            StringBuilder sb = new StringBuilder();
            foreach (Special s in list)
            {
                bool now = SpecialNow(s, today);
                sb.Append("<article class=\"et-card\"><div class=\"et-card-img\"><img src=\"" + s.Image + "\" alt=\"" + HtmlEncode(s.Title) + "\" loading=\"lazy\"><span class=\"et-flag" + (now ? " et-flag-on" : string.Empty) + "\">" + HtmlEncode(SpecialStatus(s, today)) + "</span></div>");
                sb.Append("<div class=\"et-card-b\"><div class=\"et-eyebrow\">" + (s.Kind == "weekly" ? "Weekly" : "Seasonal") + "</div><h3>" + HtmlEncode(s.Title) + "</h3><p>" + HtmlEncode(s.Description) + "</p>");
                sb.Append("<div class=\"et-card-f\"><b>" + Money(s.Price) + "</b><a href=\"Reservation\">Reserve &rarr;</a></div></div></article>");
            }
            return sb.ToString();
        }

        private static string EventCards(SiteData site, List<EventItem> list, DateTime today)
        {
            if (list.Count == 0)
            {
                return "<div class=\"et-empty\">No events in this group right now.</div>";
            }
            StringBuilder sb = new StringBuilder();
            foreach (EventItem e in list)
            {
                DateTime d = EventDate(e, today);
                int left = e.Seats - e.Taken;
                sb.Append("<a class=\"et-card\" href=\"Event?id=" + e.Id + "\"><div class=\"et-card-img\"><img src=\"" + e.Image + "\" alt=\"" + HtmlEncode(e.Title) + "\" loading=\"lazy\"><span class=\"et-date\"><b>" + d.ToString("dd", Inv) + "</b>" + d.ToString("MMM", Inv) + "</span></div>");
                sb.Append("<div class=\"et-card-b\"><div class=\"et-eyebrow\">" + HtmlEncode(LabelOf(site.EventKinds, e.Kind)) + " &middot; " + d.ToString("dddd", Inv) + " " + HtmlEncode(e.Time) + "</div><h3>" + HtmlEncode(e.Title) + "</h3><p>" + HtmlEncode(e.Description) + "</p>");
                sb.Append("<div class=\"et-card-f\"><b>" + Money(e.Price) + "<small> per guest</small></b><span class=\"" + (left == 0 ? "et-sold" : left <= 6 ? "et-few" : "et-left") + "\">" + (left == 0 ? "Sold out" : left + " seats left") + "</span></div></div></a>");
            }
            return sb.ToString();
        }
    }
}

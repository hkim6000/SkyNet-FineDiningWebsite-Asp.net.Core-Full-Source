using System.Globalization;
using System.Text;
using System.Text.Json;
using FineDining.Models;
using SkyNet;

namespace FineDining.codes
{
    public class Menu : WebPage
    {
        public override async Task OnInitialized()
        {
            HtmlDoc.SetTitle("Menu | Aurelle");
            HtmlDoc.AddMetaElement("viewport", "width=device-width, initial-scale=1");
            HtmlDoc.AddMetaElement("description", "Tasting menus and an à la carte menu that follows the season.");

            SiteData site = await LoadSite();
            DateTime today = DateTime.Today;
            string course = Pick(QueryValue("course"), site.Courses.Select(c => c.Key));
            StringBuilder tastings = new StringBuilder();
            foreach (Tasting t in site.Tastings)
            {
                tastings.Append("<article class=\"mn-tasting\"><img src=\"" + t.Image + "\" alt=\"\" loading=\"lazy\"><div class=\"mn-tasting-b\">");
                tastings.Append("<div class=\"mn-eyebrow\">" + t.Courses + " courses</div><h3>" + HtmlEncode(t.Name) + "</h3><p>" + HtmlEncode(t.Description) + "</p><ol>");
                foreach (string i in t.Items)
                {
                    tastings.Append("<li>" + HtmlEncode(i) + "</li>");
                }
                tastings.Append("</ol><div class=\"mn-tasting-f\"><span><b>" + Money(t.Price) + "</b> per guest</span><span>Wine pairing " + Money(t.Pairing) + "</span></div></div></article>");
            }
            List<Dish> list = FilterDishes(site, course, new List<string>());
            StringBuilder diets = new StringBuilder();
            foreach (KeyLabel d in site.Diets)
            {
                diets.Append("<button type=\"button\" class=\"mn-chip mn-chip-t\" data-d=\"" + d.Key + "\" onclick=\"MenuJs.diet(this)\">" + HtmlEncode(d.Label) + "</button>");
            }
            HtmlDoc.HtmlBodyText = HtmlDoc.HtmlBodyText
                .Replace("{plhd_tastings}", tastings.ToString())
                .Replace("{plhd_chips}", Chips(site.Courses, course))
                .Replace("{plhd_diets}", diets.ToString())
                .Replace("{plhd_course}", course)
                .Replace("{plhd_count}", CountText(list.Count, "dish", "dishes"))
                .Replace("{plhd_carte}", Carte(site, list, course));
        }

        public async Task<ApiResponse> Filter()
        {
            ApiResponse response = new ApiResponse();
            SiteData site = await LoadSite();
            string course = Pick(GetDataValue("course"), site.Courses.Select(c => c.Key));
            List<string> diets = (GetDataValue("diet") ?? string.Empty).Split('.', StringSplitOptions.RemoveEmptyEntries).Where(d => site.Diets.Any(x => x.Key == d)).Distinct().ToList();
            List<Dish> list = FilterDishes(site, course, diets);
            response.SetElementContents("mn-carte", Carte(site, list, course));
            response.SetElementContents("mn-count", CountText(list.Count, "dish", "dishes"));
            return response;
        }

        public async Task<ApiResponse> View()
        {
            ApiResponse response = new ApiResponse();
            SiteData site = await LoadSite();
            Dish? d = site.Dishes.FirstOrDefault(x => x.Id == (GetDataValue("id") ?? string.Empty).Trim());
            if (d == null)
            {
                return response;
            }
            StringBuilder sb = new StringBuilder();
            sb.Append("<button type=\"button\" class=\"mn-modal-x\" aria-label=\"Close\" onclick=\"MenuJs.closeModal()\">&times;</button>");
            sb.Append("<img src=\"" + d.Image + "\" alt=\"" + HtmlEncode(d.Name) + "\"><div class=\"mn-modal-b\">");
            sb.Append("<div class=\"mn-eyebrow\">" + HtmlEncode(LabelOf(site.Courses, d.Course)) + "</div><h3>" + HtmlEncode(d.Name) + "</h3><p>" + HtmlEncode(d.Description) + "</p>");
            sb.Append("<div class=\"mn-modal-p\"><b>" + Money(d.Price) + "</b>" + DietTags(site, d) + "</div>");
            List<WineItem> wines = d.Pairs.Select(p => site.Wines.FirstOrDefault(w => w.Id == p)).Where(w => w != null).Select(w => w!).ToList();
            if (wines.Count > 0)
            {
                sb.Append("<div class=\"mn-mtitle\">The sommelier suggests</div><ul class=\"mn-modal-w\">");
                foreach (WineItem w in wines)
                {
                    sb.Append("<li><b>" + HtmlEncode(w.Name) + "</b><span>" + HtmlEncode(w.Producer) + " &middot; " + HtmlEncode(w.Vintage) + "</span><em>" + WinePrice(w) + "</em></li>");
                }
                sb.Append("</ul>");
            }
            sb.Append("<a class=\"mn-btn\" href=\"Reservation\">Reserve a table</a></div>");
            response.SetElementContents("mn-modal-box", sb.ToString());
            response.ExecuteScript("MenuJs.openModal();");
            return response;
        }

        public async Task<ApiResponse> Estimate()
        {
            ApiResponse response = new ApiResponse();
            SiteData site = await LoadSite();
            Tasting? t = site.Tastings.FirstOrDefault(x => x.Key == (GetDataValue("menu") ?? string.Empty).Trim());
            int guests;
            if (t == null || !int.TryParse(GetDataValue("guests"), out guests) || guests < 1 || guests > 8)
            {
                response.SetElementContents("mn-estimate", "<div class=\"mn-quote-e\">Please choose a menu and 1 to 8 guests.</div>");
                return response;
            }
            bool pairing = GetDataValue("pairing") == "1";
            decimal food = t.Price * guests;
            decimal wine = pairing ? t.Pairing * guests : 0m;
            decimal sub = food + wine;
            decimal service = Math.Round(sub * 0.20m, 2, MidpointRounding.AwayFromZero);
            decimal tax = Math.Round(sub * 0.075m, 2, MidpointRounding.AwayFromZero);
            decimal total = sub + service + tax;
            StringBuilder sb = new StringBuilder("<div class=\"mn-quote-h\"><span>Estimated total</span><b>" + Money2(total) + "</b><small>about " + Money2(Math.Round(total / guests, 2, MidpointRounding.AwayFromZero)) + " per guest</small></div><ul>");
            sb.Append("<li><span>" + HtmlEncode(t.Name) + " menu &times; " + guests + "</span><b>" + Money2(food) + "</b></li>");
            if (pairing)
            {
                sb.Append("<li><span>Wine pairing &times; " + guests + "</span><b>" + Money2(wine) + "</b></li>");
            }
            sb.Append("<li><span>Service (20%)</span><b>" + Money2(service) + "</b></li><li><span>Tax (7.5%)</span><b>" + Money2(tax) + "</b></li>");
            sb.Append("<li class=\"mn-quote-t\"><span>Total</span><b>" + Money2(total) + "</b></li></ul>");
            sb.Append("<p>" + (t.Key == "counter" ? "Served at the chef&rsquo;s counter, Wednesday to Saturday. A $50 per person deposit holds your seats." : "Served in the dining room every evening we&rsquo;re open.") + " <a href=\"Reservation\">Reserve &rarr;</a></p>");
            response.SetElementContents("mn-estimate", sb.ToString());
            return response;
        }

        private static List<Dish> FilterDishes(SiteData site, string course, List<string> diets)
        {
            return site.Dishes.Where(d => (course == string.Empty || d.Course == course) && diets.All(x => d.Diets.Contains(x))).OrderBy(d => d.Rank).ToList();
        }

        private static string Carte(SiteData site, List<Dish> list, string course)
        {
            if (list.Count == 0)
            {
                return "<div class=\"mn-empty\">No dishes match those choices. Try removing a filter.</div>";
            }
            StringBuilder sb = new StringBuilder();
            foreach (KeyLabel c in site.Courses)
            {
                List<Dish> part = list.Where(d => d.Course == c.Key).ToList();
                if (part.Count == 0)
                {
                    continue;
                }
                sb.Append("<div class=\"mn-csec\"><h3>" + HtmlEncode(c.Label) + "</h3><div class=\"mn-dishes\">");
                foreach (Dish d in part)
                {
                    sb.Append("<button type=\"button\" class=\"mn-dish\" onclick=\"MenuJs.view('" + d.Id + "')\"><img src=\"" + d.Image + "\" alt=\"\" loading=\"lazy\">");
                    sb.Append("<span class=\"mn-dish-b\"><span class=\"mn-dish-h\"><b>" + HtmlEncode(d.Name) + "</b><i></i><em>" + Money(d.Price) + "</em></span><span class=\"mn-dish-d\">" + HtmlEncode(d.Description) + "</span>" + DietTags(site, d) + "</span></button>");
                }
                sb.Append("</div></div>");
            }
            return sb.ToString();
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
                sb.Append("<div class=\"mn-sg-none\">No results for &ldquo;" + HtmlEncode(q) + "&rdquo;</div>");
            }
            else
            {
                foreach (string r in rows.Take(7))
                {
                    sb.Append(r);
                }
                sb.Append("<div class=\"mn-sg-foot\">" + total + (total == 1 ? " result" : " results") + " across the menu, specials, events and wine</div>");
            }
            response.SetElementContents("mn-sugg", sb.ToString());
            response.ExecuteScript("MenuJs.openSugg();");
            return response;
        }

        public async Task<ApiResponse> Subscribe()
        {
            ApiResponse response = new ApiResponse();
            await Task.CompletedTask;
            string email = (GetDataValue("email") ?? string.Empty).Trim();
            if (!IsEmail(email))
            {
                response.SetElementContents("mn-nl-msg", "<span class=\"mn-err\">Please enter a valid email address.</span>");
                return response;
            }
            response.SetElementContents("mn-nl-msg", "<span class=\"mn-ok\">Thank you. Invitations will go to " + HtmlEncode(email) + ". (Demo only &mdash; nothing was stored.)</span>");
            response.ExecuteScript("MenuJs.subscribed();");
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
                    return "<span class=\"mn-dot mn-dot-on\"></span>Open tonight &middot; " + TimeText(open) + " &ndash; " + TimeText(close);
                }
                if (t <= close.Add(TimeSpan.FromMinutes(90)))
                {
                    return "<span class=\"mn-dot mn-dot-on\"></span>Open now &middot; last seating " + TimeText(close);
                }
            }
            for (int i = 1; i <= 7; i++)
            {
                DateTime d = now.Date.AddDays(i);
                DayHours n = site.Hours[(int)d.DayOfWeek];
                if (n.Open != string.Empty)
                {
                    return "<span class=\"mn-dot\"></span>Closed " + (h.Open == string.Empty ? "today" : "for the night") + " &middot; opens " + (i == 1 ? "tomorrow" : d.ToString("dddd", Inv)) + " at " + TimeText(n.Open);
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
            string pic = img == string.Empty ? "<span class=\"mn-sg-i\">&#127863;</span>" : "<img src=\"" + img + "\" alt=\"\">";
            return "<a class=\"mn-sg\" href=\"" + href + "\">" + pic + "<span><b>" + HtmlEncode(title) + "</b><small>" + type + " &middot; " + HtmlEncode(sub) + "</small></span></a>";
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
            sb.Append("<button type=\"button\" class=\"mn-chip" + (active == string.Empty ? " mn-act" : string.Empty) + "\" onclick=\"MenuJs.chip(this, '')\">All</button>");
            foreach (KeyLabel k in items)
            {
                sb.Append("<button type=\"button\" class=\"mn-chip" + (k.Key == active ? " mn-act" : string.Empty) + "\" onclick=\"MenuJs.chip(this, '" + k.Key + "')\">" + HtmlEncode(k.Label) + "</button>");
            }
            return sb.ToString();
        }

        private static string DietTags(SiteData site, Dish d)
        {
            if (d.Diets.Count == 0)
            {
                return string.Empty;
            }
            StringBuilder sb = new StringBuilder("<span class=\"mn-tags\">");
            foreach (string k in d.Diets)
            {
                sb.Append("<span class=\"mn-tag mn-tag-" + k + "\" title=\"" + HtmlEncode(LabelOf(site.Diets, k)) + "\">" + (k == "veg" ? "V" : k == "gf" ? "GF" : "NF") + "</span>");
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
                sb.Append("<article class=\"mn-card\"><div class=\"mn-card-img\"><img src=\"" + s.Image + "\" alt=\"" + HtmlEncode(s.Title) + "\" loading=\"lazy\"><span class=\"mn-flag" + (now ? " mn-flag-on" : string.Empty) + "\">" + HtmlEncode(SpecialStatus(s, today)) + "</span></div>");
                sb.Append("<div class=\"mn-card-b\"><div class=\"mn-eyebrow\">" + (s.Kind == "weekly" ? "Weekly" : "Seasonal") + "</div><h3>" + HtmlEncode(s.Title) + "</h3><p>" + HtmlEncode(s.Description) + "</p>");
                sb.Append("<div class=\"mn-card-f\"><b>" + Money(s.Price) + "</b><a href=\"Reservation\">Reserve &rarr;</a></div></div></article>");
            }
            return sb.ToString();
        }

        private static string EventCards(SiteData site, List<EventItem> list, DateTime today)
        {
            if (list.Count == 0)
            {
                return "<div class=\"mn-empty\">No events in this group right now.</div>";
            }
            StringBuilder sb = new StringBuilder();
            foreach (EventItem e in list)
            {
                DateTime d = EventDate(e, today);
                int left = e.Seats - e.Taken;
                sb.Append("<a class=\"mn-card\" href=\"Event?id=" + e.Id + "\"><div class=\"mn-card-img\"><img src=\"" + e.Image + "\" alt=\"" + HtmlEncode(e.Title) + "\" loading=\"lazy\"><span class=\"mn-date\"><b>" + d.ToString("dd", Inv) + "</b>" + d.ToString("MMM", Inv) + "</span></div>");
                sb.Append("<div class=\"mn-card-b\"><div class=\"mn-eyebrow\">" + HtmlEncode(LabelOf(site.EventKinds, e.Kind)) + " &middot; " + d.ToString("dddd", Inv) + " " + HtmlEncode(e.Time) + "</div><h3>" + HtmlEncode(e.Title) + "</h3><p>" + HtmlEncode(e.Description) + "</p>");
                sb.Append("<div class=\"mn-card-f\"><b>" + Money(e.Price) + "<small> per guest</small></b><span class=\"" + (left == 0 ? "mn-sold" : left <= 6 ? "mn-few" : "mn-left") + "\">" + (left == 0 ? "Sold out" : left + " seats left") + "</span></div></div></a>");
            }
            return sb.ToString();
        }
    }
}

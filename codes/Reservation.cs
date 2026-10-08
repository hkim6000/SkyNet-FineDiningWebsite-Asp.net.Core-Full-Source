using System.Globalization;
using System.Text;
using System.Text.Json;
using FineDining.Models;
using SkyNet;

namespace FineDining.codes
{
    public class Reservation : WebPage
    {
        public override async Task OnInitialized()
        {
            HtmlDoc.SetTitle("Reservations | Aurelle");
            HtmlDoc.AddMetaElement("viewport", "width=device-width, initial-scale=1");
            HtmlDoc.AddMetaElement("description", "Reserve a table at Aurelle.");

            SiteData site = await LoadSite();
            DateTime today = DateTime.Today;
            DateTime date;
            int party;
            string time = (QueryValue("time") ?? string.Empty).Trim();
            string slots = "<p class=\"rv-fine\">Choose a date and party size, then find a table.</p>";
            string picked = "<span>Choose a time above.</span>";
            string chosen = string.Empty;
            DateTime selected = today;
            if (ParseDate(QueryValue("date"), out date) && date >= today && date <= today.AddDays(60) && int.TryParse(QueryValue("party"), out party) && party >= 1 && party <= 8)
            {
                selected = date;
                List<Slot> list = Slots(site, date, party, "dining", DateTime.Now);
                Slot? hit = list.FirstOrDefault(s => s.Time == time && s.Open);
                chosen = hit == null ? string.Empty : hit.Time;
                slots = SlotsHtml(site, list, date, party, "dining", chosen, today);
                if (hit != null)
                {
                    picked = PickedText(site, date, party, "dining", hit, today);
                }
                HtmlDoc.HtmlBodyText = HtmlDoc.HtmlBodyText.Replace("<option value=\"" + party + "\">", "<option value=\"" + party + "\" selected>").Replace("<option value=\"2\" selected>", party == 2 ? "<option value=\"2\" selected>" : "<option value=\"2\">");
            }
            StringBuilder hours = new StringBuilder();
            foreach (DayHours h in site.Hours.Skip(1).Concat(site.Hours.Take(1)))
            {
                hours.Append(h.Day.Substring(0, 3) + " " + (h.Open == string.Empty ? "closed" : TimeText(h.Open) + "&ndash;" + TimeText(h.Close)) + "<br>");
            }
            HtmlDoc.HtmlBodyText = HtmlDoc.HtmlBodyText
                .Replace("{plhd_dates}", DateOptions(site, today, 61, selected))
                .Replace("{plhd_slots}", slots)
                .Replace("{plhd_time}", chosen)
                .Replace("{plhd_picked}", picked)
                .Replace("{plhd_hours}", hours.ToString());
        }

        public async Task<ApiResponse> Find()
        {
            ApiResponse response = new ApiResponse();
            SiteData site = await LoadSite();
            DateTime today = DateTime.Today;
            DateTime date;
            int party;
            string area = Pick(GetDataValue("area"), site.Areas.Select(a => a.Key));
            response.ExecuteScript("ReservationJs.picked('');");
            if (!ParseDate(GetDataValue("date"), out date) || date < today || date > today.AddDays(60))
            {
                response.SetElementContents("rv-slots", "<p class=\"rv-err\">Please choose a date in the next 60 days.</p>");
                return response;
            }
            if (!int.TryParse(GetDataValue("party"), out party) || party < 1)
            {
                response.SetElementContents("rv-slots", "<p class=\"rv-err\">Please choose a party size.</p>");
                return response;
            }
            if (party > 8)
            {
                response.SetElementContents("rv-slots", "<p>For nine or more guests we seat you in the Salon or the Cellar. <a href=\"Events#private\">Plan a private event &rarr;</a></p>");
                return response;
            }
            Area? a = site.Areas.FirstOrDefault(x => x.Key == area);
            if (a == null)
            {
                return response;
            }
            if (party > a.Max)
            {
                response.SetElementContents("rv-slots", "<p class=\"rv-err\">" + HtmlEncode(a.Label) + " seats up to " + a.Max + " guests. Try the dining room.</p>");
                return response;
            }
            List<Slot> list = Slots(site, date, party, area, DateTime.Now);
            response.SetElementContents("rv-slots", SlotsHtml(site, list, date, party, area, string.Empty, today));
            return response;
        }

        public async Task<ApiResponse> Book()
        {
            ApiResponse response = new ApiResponse();
            SiteData site = await LoadSite();
            DateTime today = DateTime.Today;
            DateTime date;
            int party;
            bool okDate = ParseDate(GetDataValue("date"), out date) && date >= today && date <= today.AddDays(60);
            bool okParty = int.TryParse(GetDataValue("party"), out party) && party >= 1 && party <= 8;
            string area = Pick(GetDataValue("area"), site.Areas.Select(a => a.Key));
            string time = (GetDataValue("time") ?? string.Empty).Trim();
            string name = (GetDataValue("name") ?? string.Empty).Trim();
            string phone = (GetDataValue("phone") ?? string.Empty).Trim();
            string email = (GetDataValue("email") ?? string.Empty).Trim();
            string occasion = Pick(GetDataValue("occasion"), site.Occasions.Select(o => o.Key));
            string notes = (GetDataValue("notes") ?? string.Empty).Trim();
            bool agree = GetDataValue("agree") == "1";

            Slot? slot = null;
            if (okDate && okParty && area != string.Empty)
            {
                slot = Slots(site, date, party, area, DateTime.Now).FirstOrDefault(s => s.Time == time);
            }
            string eSlot = !okDate || !okParty || area == string.Empty ? "Please choose a date, party size and seating." : slot == null ? "Please choose a time from the list." : !slot.Open ? "Sorry, that time was just taken. Please pick another." : string.Empty;
            string eName = name.Length < 2 || name.Length > 60 ? "Please tell us your name." : string.Empty;
            string ePhone = !IsPhone(phone) ? "Please enter a 10-digit phone number." : string.Empty;
            string eEmail = !IsEmail(email) ? "Please enter a valid email address." : string.Empty;
            string eAgree = !agree ? "Please accept the cancellation policy." : string.Empty;
            response.SetElementContents("rv-e-slot", eSlot);
            response.SetElementContents("rv-e-name", eName);
            response.SetElementContents("rv-e-phone", ePhone);
            response.SetElementContents("rv-e-email", eEmail);
            response.SetElementContents("rv-e-agree", eAgree);
            if (eSlot + eName + ePhone + eEmail + eAgree != string.Empty || slot == null)
            {
                response.SetElementContents("rv-done", string.Empty);
                return response;
            }
            Area a = site.Areas.First(x => x.Key == area);
            string code = Code("AU", date.ToString("yyyyMMdd", Inv) + slot.Time + party + area + name + email);
            StringBuilder sb = new StringBuilder();
            sb.Append("<div class=\"rv-done-h\"><span>&#10003;</span><div><b>See you " + HtmlEncode(DayText(date, today)) + ", " + HtmlEncode(name.Split(' ')[0]) + ".</b><small>Confirmation " + code + "</small></div></div><ul>");
            sb.Append("<li><span>Date</span>" + date.ToString("dddd, MMMM d", Inv) + "</li><li><span>Time</span>" + slot.Label + "</li>");
            sb.Append("<li><span>Party</span>" + CountText(party, "guest", "guests") + "</li><li><span>Seating</span>" + HtmlEncode(a.Label) + "</li>");
            if (occasion != string.Empty)
            {
                sb.Append("<li><span>Occasion</span>" + HtmlEncode(LabelOf(site.Occasions, occasion)) + "</li>");
            }
            if (notes != string.Empty)
            {
                sb.Append("<li><span>Notes</span>" + HtmlEncode(notes.Length > 120 ? notes.Substring(0, 120) + "…" : notes) + "</li>");
            }
            sb.Append("</ul><p>" + (area == "counter" ? "A $50 per person deposit (" + Money(50m * party) + ") would be taken to hold counter seats. " : string.Empty) + "We&rsquo;ll email " + HtmlEncode(email) + " the day before. This is a demo: no table was held.</p>");
            response.SetElementContents("rv-done", sb.ToString());
            response.ExecuteScript("ReservationJs.booked();");
            return response;
        }

        private static string SlotsHtml(SiteData site, List<Slot> list, DateTime date, int party, string area, string chosen, DateTime today)
        {
            Area? a = site.Areas.FirstOrDefault(x => x.Key == area);
            string where = a == null ? string.Empty : a.Label;
            if (list.Count == 0)
            {
                return "<p>" + (area == "counter" && site.Hours[(int)date.DayOfWeek].Open != string.Empty ? "The chef&rsquo;s counter is open Wednesday to Saturday." : "We&rsquo;re closed " + HtmlEncode(DayText(date, today)) + ".") + " Please choose another evening.</p>";
            }
            int open = list.Count(s => s.Open);
            StringBuilder sb = new StringBuilder("<p><b>" + (open == 0 ? "Fully booked" : open + " open " + (open == 1 ? "time" : "times")) + "</b> &middot; " + HtmlEncode(where) + " &middot; " + HtmlEncode(DayText(date, today)) + " &middot; " + CountText(party, "guest", "guests") + "</p><div class=\"rv-times\">");
            foreach (Slot s in list)
            {
                if (s.Open)
                {
                    string label = date.ToString("ddd, MMM d", Inv) + " at " + s.Label + " · " + CountText(party, "guest", "guests") + " · " + where;
                    sb.Append("<button type=\"button\" class=\"rv-time" + (s.Time == chosen ? " rv-act" : string.Empty) + "\" data-t=\"" + s.Time + "\" data-l=\"" + HtmlEncode(label) + "\" onclick=\"ReservationJs.pick(this)\">" + s.Label + "</button>");
                }
                else
                {
                    sb.Append("<span class=\"rv-time rv-off\" title=\"Booked\">" + s.Label + "</span>");
                }
            }
            sb.Append("</div>");
            if (open == 0)
            {
                sb.Append("<p class=\"rv-fine\">Try the bar, a different party size or another evening.</p>");
            }
            return sb.ToString();
        }

        private static string PickedText(SiteData site, DateTime date, int party, string area, Slot s, DateTime today)
        {
            Area? a = site.Areas.FirstOrDefault(x => x.Key == area);
            return "<b>" + date.ToString("ddd, MMM d", Inv) + " at " + s.Label + "</b> &middot; " + CountText(party, "guest", "guests") + " &middot; " + HtmlEncode(a == null ? string.Empty : a.Label);
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
                sb.Append("<div class=\"rv-sg-none\">No results for &ldquo;" + HtmlEncode(q) + "&rdquo;</div>");
            }
            else
            {
                foreach (string r in rows.Take(7))
                {
                    sb.Append(r);
                }
                sb.Append("<div class=\"rv-sg-foot\">" + total + (total == 1 ? " result" : " results") + " across the menu, specials, events and wine</div>");
            }
            response.SetElementContents("rv-sugg", sb.ToString());
            response.ExecuteScript("ReservationJs.openSugg();");
            return response;
        }

        public async Task<ApiResponse> Subscribe()
        {
            ApiResponse response = new ApiResponse();
            await Task.CompletedTask;
            string email = (GetDataValue("email") ?? string.Empty).Trim();
            if (!IsEmail(email))
            {
                response.SetElementContents("rv-nl-msg", "<span class=\"rv-err\">Please enter a valid email address.</span>");
                return response;
            }
            response.SetElementContents("rv-nl-msg", "<span class=\"rv-ok\">Thank you. Invitations will go to " + HtmlEncode(email) + ". (Demo only &mdash; nothing was stored.)</span>");
            response.ExecuteScript("ReservationJs.subscribed();");
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
                    return "<span class=\"rv-dot rv-dot-on\"></span>Open tonight &middot; " + TimeText(open) + " &ndash; " + TimeText(close);
                }
                if (t <= close.Add(TimeSpan.FromMinutes(90)))
                {
                    return "<span class=\"rv-dot rv-dot-on\"></span>Open now &middot; last seating " + TimeText(close);
                }
            }
            for (int i = 1; i <= 7; i++)
            {
                DateTime d = now.Date.AddDays(i);
                DayHours n = site.Hours[(int)d.DayOfWeek];
                if (n.Open != string.Empty)
                {
                    return "<span class=\"rv-dot\"></span>Closed " + (h.Open == string.Empty ? "today" : "for the night") + " &middot; opens " + (i == 1 ? "tomorrow" : d.ToString("dddd", Inv)) + " at " + TimeText(n.Open);
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
            string pic = img == string.Empty ? "<span class=\"rv-sg-i\">&#127863;</span>" : "<img src=\"" + img + "\" alt=\"\">";
            return "<a class=\"rv-sg\" href=\"" + href + "\">" + pic + "<span><b>" + HtmlEncode(title) + "</b><small>" + type + " &middot; " + HtmlEncode(sub) + "</small></span></a>";
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
            sb.Append("<button type=\"button\" class=\"rv-chip" + (active == string.Empty ? " rv-act" : string.Empty) + "\" onclick=\"ReservationJs.chip(this, '')\">All</button>");
            foreach (KeyLabel k in items)
            {
                sb.Append("<button type=\"button\" class=\"rv-chip" + (k.Key == active ? " rv-act" : string.Empty) + "\" onclick=\"ReservationJs.chip(this, '" + k.Key + "')\">" + HtmlEncode(k.Label) + "</button>");
            }
            return sb.ToString();
        }

        private static string DietTags(SiteData site, Dish d)
        {
            if (d.Diets.Count == 0)
            {
                return string.Empty;
            }
            StringBuilder sb = new StringBuilder("<span class=\"rv-tags\">");
            foreach (string k in d.Diets)
            {
                sb.Append("<span class=\"rv-tag rv-tag-" + k + "\" title=\"" + HtmlEncode(LabelOf(site.Diets, k)) + "\">" + (k == "veg" ? "V" : k == "gf" ? "GF" : "NF") + "</span>");
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
                sb.Append("<article class=\"rv-card\"><div class=\"rv-card-img\"><img src=\"" + s.Image + "\" alt=\"" + HtmlEncode(s.Title) + "\" loading=\"lazy\"><span class=\"rv-flag" + (now ? " rv-flag-on" : string.Empty) + "\">" + HtmlEncode(SpecialStatus(s, today)) + "</span></div>");
                sb.Append("<div class=\"rv-card-b\"><div class=\"rv-eyebrow\">" + (s.Kind == "weekly" ? "Weekly" : "Seasonal") + "</div><h3>" + HtmlEncode(s.Title) + "</h3><p>" + HtmlEncode(s.Description) + "</p>");
                sb.Append("<div class=\"rv-card-f\"><b>" + Money(s.Price) + "</b><a href=\"Reservation\">Reserve &rarr;</a></div></div></article>");
            }
            return sb.ToString();
        }

        private static string EventCards(SiteData site, List<EventItem> list, DateTime today)
        {
            if (list.Count == 0)
            {
                return "<div class=\"rv-empty\">No events in this group right now.</div>";
            }
            StringBuilder sb = new StringBuilder();
            foreach (EventItem e in list)
            {
                DateTime d = EventDate(e, today);
                int left = e.Seats - e.Taken;
                sb.Append("<a class=\"rv-card\" href=\"Event?id=" + e.Id + "\"><div class=\"rv-card-img\"><img src=\"" + e.Image + "\" alt=\"" + HtmlEncode(e.Title) + "\" loading=\"lazy\"><span class=\"rv-date\"><b>" + d.ToString("dd", Inv) + "</b>" + d.ToString("MMM", Inv) + "</span></div>");
                sb.Append("<div class=\"rv-card-b\"><div class=\"rv-eyebrow\">" + HtmlEncode(LabelOf(site.EventKinds, e.Kind)) + " &middot; " + d.ToString("dddd", Inv) + " " + HtmlEncode(e.Time) + "</div><h3>" + HtmlEncode(e.Title) + "</h3><p>" + HtmlEncode(e.Description) + "</p>");
                sb.Append("<div class=\"rv-card-f\"><b>" + Money(e.Price) + "<small> per guest</small></b><span class=\"" + (left == 0 ? "rv-sold" : left <= 6 ? "rv-few" : "rv-left") + "\">" + (left == 0 ? "Sold out" : left + " seats left") + "</span></div></div></a>");
            }
            return sb.ToString();
        }
    }
}

namespace FineDining.Models
{
    public class SiteData
    {
        public List<KeyLabel> Courses { get; set; } = new List<KeyLabel>();
        public List<KeyLabel> Diets { get; set; } = new List<KeyLabel>();
        public List<KeyLabel> EventKinds { get; set; } = new List<KeyLabel>();
        public List<KeyLabel> WineTypes { get; set; } = new List<KeyLabel>();
        public List<KeyLabel> Regions { get; set; } = new List<KeyLabel>();
        public List<KeyLabel> Occasions { get; set; } = new List<KeyLabel>();
        public List<Dish> Dishes { get; set; } = new List<Dish>();
        public List<Tasting> Tastings { get; set; } = new List<Tasting>();
        public List<Special> Specials { get; set; } = new List<Special>();
        public List<EventItem> Events { get; set; } = new List<EventItem>();
        public List<Room> Rooms { get; set; } = new List<Room>();
        public List<DayHours> Hours { get; set; } = new List<DayHours>();
        public List<Area> Areas { get; set; } = new List<Area>();
        public List<WineItem> Wines { get; set; } = new List<WineItem>();
        public List<Design> Designs { get; set; } = new List<Design>();
        public List<Experience> Experiences { get; set; } = new List<Experience>();
    }

    public class KeyLabel
    {
        public string Key { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
    }

    public class Dish
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Course { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public List<string> Diets { get; set; } = new List<string>();
        public string Description { get; set; } = string.Empty;
        public string Image { get; set; } = string.Empty;
        public int Rank { get; set; }
        public List<string> Pairs { get; set; } = new List<string>();
    }

    public class Tasting
    {
        public string Key { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public int Courses { get; set; }
        public decimal Price { get; set; }
        public decimal Pairing { get; set; }
        public string Description { get; set; } = string.Empty;
        public List<string> Items { get; set; } = new List<string>();
        public string Image { get; set; } = string.Empty;
    }

    public class Special
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Kind { get; set; } = string.Empty;
        public List<int> Months { get; set; } = new List<int>();
        public List<int> Days { get; set; } = new List<int>();
        public decimal Price { get; set; }
        public string Description { get; set; } = string.Empty;
        public string Image { get; set; } = string.Empty;
    }

    public class EventItem
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Kind { get; set; } = string.Empty;
        public int Weekday { get; set; }
        public int Week { get; set; }
        public string Fixed { get; set; } = string.Empty;
        public string Time { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int Seats { get; set; }
        public int Taken { get; set; }
        public string Description { get; set; } = string.Empty;
        public List<string> Menu { get; set; } = new List<string>();
        public string Image { get; set; } = string.Empty;
    }

    public class Room
    {
        public string Key { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public int Min { get; set; }
        public int Max { get; set; }
        public decimal Spend { get; set; }
        public string Description { get; set; } = string.Empty;
    }

    public class DayHours
    {
        public string Day { get; set; } = string.Empty;
        public string Open { get; set; } = string.Empty;
        public string Close { get; set; } = string.Empty;
    }

    public class Area
    {
        public string Key { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public int Max { get; set; }
        public string Description { get; set; } = string.Empty;
    }

    public class WineItem
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Producer { get; set; } = string.Empty;
        public string Region { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Vintage { get; set; } = string.Empty;
        public string Grapes { get; set; } = string.Empty;
        public decimal Glass { get; set; }
        public decimal Bottle { get; set; }
        public string Note { get; set; } = string.Empty;
        public bool Pick { get; set; }
    }

    public class Design
    {
        public string Key { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public string Note { get; set; } = string.Empty;
    }

    public class Experience
    {
        public string Key { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public decimal Amount { get; set; }
    }
}

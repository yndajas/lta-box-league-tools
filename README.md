# LTA tools

## Bookings

**Prerequisites**: Ruby

With an exported list of bookings from Clubspark saved as `data.csv`, running
`bookings_summary` will count the number of bookings covering each 30-minute
slot. E.g. a 12:00-14:00 booking will be counted as 12:00, 12:30, 13:00, and
13:30.

Note: it's currently hard-coded to count only Sundays.

## Box league

Running the code in `boxLeagueSummary.js` in a browser console on a completed
box league page
([example](https://competitions.lta.org.uk/box-ladder/41263ef5-da77-4645-8a92-7174bb7f3569/event/2/round/6))
will generate HTML for a summary table. It might take a second or two to print
to the console, so be patient. The summary will show the top two players in each
box as well as match completion numbers.

The following style is recommended if adding this to a Clubspark site.

```html
<style>
  table.ckeditor-table td,
  table.ckeditor-table th {
    padding: 5px;
  }
</style>
```

**Note:** any changes to the HTML template for the LTA box league site could
break this without notice.

import mechanize
from bs4 import BeautifulSoup
import csv

URL = 'https://www.ebt.ca.gov/caebtclient/cashlocationSearch.recip'

# Hat tip to http://adesquared.wordpress.com/2013/06/16/using-python-beautifulsoup-to-scrape-a-wikipedia-table/
f = open('output.csv', 'w')
writer = csv.writer(f)

# Working from the example at http://wwwsearch.sourceforge.net/mechanize/

# Now working from http://swizec.com/blog/scraping-with-mechanize-and-beautifulsoup/swizec/5039.

# Iterate from 01 through 58.
for i in range(1, 59):
    br = mechanize.Browser()

    br.open(URL)
    br.select_form(name='cashlocationSearchForm')

    # If you want a multipage one for testing, use '38' for San Francisco.
    two_digit_i = str(i).zfill(2)
    br['countyCode'] = [two_digit_i]
    br.submit()

    soup = BeautifulSoup(br.response().read())

    # Now working from http://palewi.re/posts/2008/04/20/python-recipe-grab-a-page-scrape-a-table-download-a-file/.
    table = soup.find('table', border=1)

#    print i

    if table:
        for row in table.find_all('tr')[1:]:
            col = row.findAll('td')
            name = col[0].string
            address = col[1].string
            city = col[2].string
            # state (is irrelevant because it'll always be CALIFORNIA)
            zipcode = col[4].string
            offers_meals = col[5].string.strip()
            is_farmers_market = col[6].string.strip()

            record = (name, address, city, zipcode, offers_meals, is_farmers_market)
            writer.writerow(record)

    br.close()

f.close()

# @maybe: Write to a Google Fusion Table instead so you can immediately hook it up to the flushots codebase?

# Then fix the 'Show All' issue.

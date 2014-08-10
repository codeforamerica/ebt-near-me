import mechanize
from bs4 import BeautifulSoup
import csv

URL = 'https://www.ebt.ca.gov/caebtclient/cashlocationSearch.recip'

f = open('output.csv', 'w')
writer = csv.writer(f)

# Iterate through the countyCode options: 01 through 58.
for i in range(1, 59):
    br = mechanize.Browser()

    br.open(URL)
    br.select_form(name='cashlocationSearchForm')

    # If you want a multipage one for testing, use '38' for San Francisco.
    two_digit_i = str(i).zfill(2)
    br['countyCode'] = [two_digit_i]
    br.submit()

    # @todo: "Click" the 'Show All' link. Mechanize won't work w/ Javascript.

    soup = BeautifulSoup(br.response().read())

    table = soup.find('table', border=1)

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

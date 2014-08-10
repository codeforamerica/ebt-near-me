import mechanize
from bs4 import BeautifulSoup
import csv

# Sample complete URL: https://www.ebt.ca.gov/caebtclient/cashlocationSearch.recip?zip=&city=&countyCode=38&searchType=0&name=&startIndex=1&sortColumn=4&descending=0&showAll=1
URL_START_FRAGMENT = 'https://www.ebt.ca.gov/caebtclient/cashlocationSearch.recip?zip=&city=&countyCode='
URL_END_FRAGMENT = '&searchType=0&name=&startIndex=1&sortColumn=4&descending=0&showAll=1'

f = open('output.csv', 'w')
writer = csv.writer(f)

# Iterate through the countyCode options: 01 through 58.
for i in range(1, 59):
    br = mechanize.Browser()

    # If you want a multipage one for testing, use '38' for San Francisco.
    county_code = str(i).zfill(2)
    URL = URL_START_FRAGMENT + county_code + URL_END_FRAGMENT
    br.open(URL)

    soup = BeautifulSoup(br.response().read())

    table = soup.find('table', border=1)

    if table:
        for row in table.find_all('tr')[1:]:
            col = row.findAll('td')
            name = col[0].string
            address = col[1].string
            city = col[2].string
            state = col[3].string   # Irrelevant because it'll always be CA, but hey.
            zipcode = col[4].string
            offers_meals = col[5].string.strip()
            is_farmers_market = col[6].string.strip()

            record = (name, address, city, state, zipcode, offers_meals, is_farmers_market)
            writer.writerow(record)

    br.close()

f.close()

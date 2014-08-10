# import re
import mechanize
from bs4 import BeautifulSoup

# Hat tip to http://adesquared.wordpress.com/2013/06/16/using-python-beautifulsoup-to-scrape-a-wikipedia-table/
f = open('output.csv', 'w')

# Working from the example at http://wwwsearch.sourceforge.net/mechanize/

# Now working from http://swizec.com/blog/scraping-with-mechanize-and-beautifulsoup/swizec/5039.

br = mechanize.Browser()

br.open('https://www.ebt.ca.gov/caebtclient/cashlocationSearch.recip')
br.select_form(name='cashlocationSearchForm')

# @todo: Iterate from 01 through 58.
# for i in range(01, 58) # @todo: Pad with a preceding 0 if need be.

# For now: submit the form with San Francisco as the value.
br['countyCode'] = ['38']
br.submit()

# Then click "Show All."
# <a href="javascript:goToPageShowAll()">Show All</a>
# @todo: Add contingency in case the link doesn't exist.

#all_on_one_page = br.follow_link(text_regex="Show All")
#soup = BeautifulSoup(all_on_one_page.read())

# Was working; commented out to try to get link working.
soup = BeautifulSoup(br.response().read())

# Now working from http://palewi.re/posts/2008/04/20/python-recipe-grab-a-page-scrape-a-table-download-a-file/.
table = soup.find('table', border=1)

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
    results = ",".join(record) + '\n'
    f.write(results)

br.close()

f.close()

# @maybe: Write to a Google Fusion Table instead so you can immediately hook it up to the flushots codebase?

# Then fix the 'Show All' issue.

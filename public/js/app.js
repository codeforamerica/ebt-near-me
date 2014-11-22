ebt = {
  timeoutID:null,
  user:{
    marker: null
  },
  infoWindow : new google.maps.InfoWindow(),
  directions_pre_link:"",
  options : {
    state:'CA',
    LatLng: new google.maps.LatLng(37.7833, -122.4167), // San Francisco
    no_geolocation_zoom : 10,
    default_zoom : 18,  
    visible_atm_data:null
  }
}

ebt.fusion ={
  table : '1gTMiiUxNgLDISIymtea1gJ9oph_F4Lt7BE-FLfAe',
  apiKey : 'AIzaSyDzaRUwEz7l0m3sEbROdDNCNRmsJ-zvUUc'
}

ebt.fusion.data_layer = new google.maps.FusionTablesLayer({
  suppressInfoWindows:true,
  query: {
    select: 'geo_address',
    from: ebt.fusion.table,
    where: "state = '"+ebt.options.state+"'"},
  styles: [
    {where: "type = 'store'", markerOptions: {iconName: 'rec_convenience'}},
    {where: "type IN ('ATM', 'POS') AND surcharge = '0'", markerOptions: {iconName: 'dollar'}},
    {where: "type IN ('ATM', 'POS') AND surcharge NOT EQUAL TO '0'", markerOptions: {iconName: 'small_yellow'}}
  ]
})

ebt.googlemapOptions = {
  zoom: ebt.options.no_geolocation_zoom,
  disableDefaultUI: true,
  center: ebt.options.LatLng,
  styles: [
    {
      featureType: "poi",
      elementType: "all",
      stylers: [
        { visibility: "off" }
      ]
    }
  ]
};

ebt.utils = {
  getPhrasesFromRow : function (row_hash) {
    var phrases = {};
    type = row_hash['type']
    text_address = row_hash['text_address']
    directions_link = ebt.directions_pre_link + encodeURIComponent(text_address) + "'>" + text_address + "</a>"
    phrases["directions_link"] = directions_link;
    location_name = row_hash['location_name']
    atm_name = row_hash['atm_name']
        
    switch (type){
      case 'store':
        phrases["name_phrase"] = row_hash['store_name'];
        phrases["printable_name_phrase"] = phrases["name_phrase"];
        break;
      case 'ATM':
        if (location_name){
          phrases["name_phrase"] = 'This is an <b>ATM</b> at ' + location_name;
          phrases["printable_name_phrase"] = '<b>ATM</b> at ' + location_name;
        } 
        else {
          phrases["name_phrase"] = 'This is a ' + atm_name + ' <b>ATM</b>';
          phrases["printable_name_phrase"] = 'This is a ' + atm_name + ' <b>ATM</b>';
        }
        break;
      case 'POS':
        phrases["name_phrase"] = 'This is a cash back location at ' + location_name;
        phrases["printable_name_phrase"] = 'Cash back at ' + location_name;
        break;
    }
        
    var cost_phrase;
    surcharge = row_hash['surcharge']
    cash_limit = row_hash['cash_limit']
    if (surcharge == '0') {
      cost_phrase = "It's <b>free</b> to use and you can get up to <b>$" + cash_limit + "</b>";
    } else if (isNaN(surcharge)) {
      cost_phrase = 'You can take out <b>$' + cash_limit + '</b> but you have to pay <b>2% fee</b>.';
    } else {
      cost_phrase = 'It costs <b>$' + surcharge + '</b> to use and you can get up to <b>$' + cash_limit + '</b>';
    }
    phrases["cost_phrase"] = cost_phrase;

    // See CfA Wufoo API docs for details
    wufoo_url = 'https://codeforamerica.wufoo.com/forms/ebtnearme-feedback/def/field3=' + type + '&field2=' + text_address;
    feedback_link_html = '<a href="' + wufoo_url + '">Report a problem with this location</a>'
    phrases["feedback_link_html"] = feedback_link_html;
    return phrases;
  },
  toTitleCase : function (str) {
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
  },
  appendVisibleAtmData : function (data) {
    visible_atm_data = data;
    // Append data to printable list
    var list = $( "#printable-list-div ul" ).empty();
    var rows = visible_atm_data['rows']
    var cols = visible_atm_data['columns']
    if (rows) {
      $.each(rows, function( index, value ) {

        var row_hash = {};
        $.each( value, function( index, value ) {
          row_hash[cols[index]] = value
        });

        phrases = ebt.utils.getPhrasesFromRow(row_hash)
        if (row_hash['type'] == 'store') {
          list.append( "<li><b>" + phrases['printable_name_phrase'] + "</b><br>"
            + ebt.utils.toTitleCase(row_hash['text_address'])
            + "</li>" );
        } else {
          list.append( "<li><b>" + phrases['printable_name_phrase'] + "</b><br>"
            + phrases['cost_phrase'] + "<br>"
            + ebt.utils.toTitleCase(row_hash['text_address'])
            + "</li>" );
        }
      });
    } else {
      list.append( "<li>If you find some ATMs on the map I'll print out the details here.</li>");
    }
  },
  queryAndAppendVisibleATMData : function () {
    var bounds = ebt.map.getBounds()
    var sw = bounds.getSouthWest()
    var ne = bounds.getNorthEast()
    var r = (google.maps.geometry.spherical.computeDistanceBetween(sw, ne))/2
    var center = ebt.map.getCenter()
    var query = ['SELECT *',
                'FROM ' + ebt.fusion.table,
                'WHERE ST_INTERSECTS(geo_address, CIRCLE(LATLNG' + center + ', ' + r + '))',
                'LIMIT 12']
                .join(' ')

    // Send the JSONP request using jQuery
    $.ajax({
      data:{
        sql: query,
        key: ebt.fusion.apiKey,
      },     
      url: 'https://www.googleapis.com/fusiontables/v1/query',
      dataType: 'jsonp',
      success:ebt.utils.appendVisibleAtmData
    })
  },
  addLayersAndIdleListener : function () {
    // Start idle listener after we settle on initial location
    ebt.fusion.data_layer.setMap(ebt.map);
    google.maps.event.addListener(ebt.map, 'idle', ebt.handle.Idle);
  } 
}

ebt.handle ={
  foundLocation : function (position) {
    var pos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

    ebt.map.setZoom(ebt.options.default_zoom);
    ebt.map.setCenter(pos);
    ebt.utils.addLayersAndIdleListener();

    // Geomarker
    var GeoMarker = new GeolocationMarker();
      GeoMarker.setCircleOptions({
        visible: false});

      google.maps.event.addListenerOnce(GeoMarker, 'position_changed', function() {
        ebt.map.setCenter(this.getPosition());
      });

    GeoMarker.setMap(ebt.map);
  },
  noLocation : function () {
    infowindow = new google.maps.InfoWindow({
      map: ebt.map,
      position: ebt.map.getCenter(),
      content: "Hmmm, I couldn't detect your location.<br>Try searching for an address instead.",
    });
    infowindow.setMap(ebt.map);
    ebt.utils.addLayersAndIdleListener();
  },
  Idle: function () {
    window.clearTimeout(ebt.timeoutID);
    ebt.timeoutID = window.setTimeout(ebt.utils.queryAndAppendVisibleATMData, 2000);
  }
}

$(document).ready(function () {
  // <!-- I N J E C T   G E O M I C O N S -->
  var icons = document.querySelectorAll('.js-geomicon');
  Geomicons.inject(icons);

  if (/iPhone/i.test(navigator.userAgent)) {
    ebt.directions_pre_link = "<a href='http://maps.google.com/?saddr=Current%20Location&daddr="
  } else if (/Android/i.test(navigator.userAgent)) {
    ebt.directions_pre_link = "<a href='geo:"
  } else {
    ebt.directions_pre_link = "<a href='http://maps.google.com?q="

    // Add zoom button for laptops/desktops
    ebt.googlemapOptions.zoomControl = true
    ebt.googlemapOptions.zoomControlOptions = {
      style: google.maps.ZoomControlStyle.SMALL
    }
  }

  // <!-- S H O W   A N D   H I D E   S E A R C H -->
  $( "#toggle-target" ).click(toggleSearchBox);

  function toggleSearchBox() {
    if ($("#pac-input").is(':visible')) {
      $( "#pac-input" ).hide();
      $( "#close-icon").hide();
      $( "#search-icon").show();
    } else {
      $("#pac-input").show();
      $("#search-icon").hide();
      $("#close-icon").show();
    }
  }
  
  ebt.map = new google.maps.Map(document.getElementById('map-canvas'), ebt.googlemapOptions);

  // Try HTML5 geolocation
  navigator.geolocation.getCurrentPosition(ebt.handle.foundLocation, ebt.handle.noLocation);

  // Search
  var input = (document.getElementById('pac-input'));
  ebt.map.controls[google.maps.ControlPosition.TOP_LEFT ].push(input);
  ebt.searchBox = new google.maps.places.SearchBox(input);

  // start adding events
  google.maps.event.addListener(ebt.searchBox, 'places_changed', function() {
    place = ebt.searchBox.getPlaces()[0];

    // Get the icon, place name, and location.
    var image = {
      url: place.icon,
      size: new google.maps.Size(71, 71),
      origin: new google.maps.Point(0, 0),
      anchor: new google.maps.Point(17, 34),
      scaledSize: new google.maps.Size(25, 25)
    };

    // Remove current marker if it exists and add the new one
    marker = ebt.user.marker
    if (marker) {marker.setMap(null)};
    marker = new google.maps.Marker({
      map: ebt.map,
      icon: image,
      title: place.name,
      position: place.geometry.location
    });

    // Center and zoom map to place
    ebt.map.setCenter(place.geometry.location)
    ebt.map.setZoom(ebt.options.default_zoom);

    // Bias the SearchBox results towards places that are within the bounds of the
    // current map's viewport.
    google.maps.event.addListener(ebt.map, 'bounds_changed', function() {
      var bounds = ebt.map.getBounds();
      ebt.searchBox.setBounds(bounds);
    });
  });

  google.maps.event.addListener(ebt.fusion.data_layer, 'click', function(e) {
    var row_hash = {};
    $.each( e.row, function( key, value ) {
      row_hash[key] = value.value
    });
    
    phrases = ebt.utils.getPhrasesFromRow(row_hash);

    // Create info window
    new_info = $('<div>')
    new_info.append($('<b>').html(phrases['name_phrase']))
    new_info.append("<br><br>")

    if (type==='ATM'||type==='POS'){
      new_info.append($('<div>').html(phrases['cost_phrase']))
      new_info.append("<br>")
    }

    new_info.append(phrases['directions_link'])
    new_info.append("<br><br>")

    new_info.append(phrases['feedback_link_html'])
    new_info.append("<br><br>")
    
    ebt.infoWindow.setOptions({
      content: new_info.html(),
      position: e.latLng,
      pixelOffset: e.pixelOffset
    });
    ebt.infoWindow.open(ebt.map);
      
  });
});

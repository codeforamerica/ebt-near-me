
function Location() {
  var  dfd = new $.Deferred(),
    _pos ={},
    _onMove = function (pos) {},
    options = {
      enableHighAccuracy: true
    },
    fail = function(err) {
      if (err) {
        console.warn('ERROR(' + err.code + '): ' + err.message);
      }
      dfd.reject(err)
    };
  //set default location
  Object.defineProperty(this, "lat", {
    get: function() {return _pos.coords ? _pos.coords.latitude : 36.1587336; }
  })
  Object.defineProperty(this, "lng", {
    get: function() {return _pos.coords ? _pos.coords.longitude : -95.9940543; }
  })
  Object.defineProperty(this, "pos", {
    get: function() {
      return { lng: _pos.coords.longitude, lat: _pos.coords.latitude}; 
    },
    set: function(new_pos){ 
      _pos = new_pos
      if (_onMove){
        _onMove(pos_desc.get())
      }
      dfd.resolve(this)
    }
  })
  this.on ={}
  this.on.move = function(fn) {
     _onMove = fn; 
  }
  pos_desc = Object.getOwnPropertyDescriptor(this, 'pos');
  WatchID = navigator.geolocation.watchPosition(pos_desc.set, fail, options);
  this.ready = dfd.promise()
}


nearme = {
  map:null,
  'location': new Location(),
  total:20,
  sublayers:[],
  subLayerOptions: {
    sql: "SELECT * FROM ebt_locations_usa LIMIT 10",
    cartocss: "#ebt_locations_usa{marker-fill: #F84F40; marker-width: 8; marker-line-color: white; marker-line-width: 2; marker-clip: false; marker-allow-overlap: true;}"
  },
  updateQuery: function() {
    nearme.sublayers[0].set({
      sql: "SELECT cartodb_id, the_geom, the_geom_webmercator, store_name, address FROM ebt_locations_usa ORDER BY the_geom <-> ST_SetSRID(ST_MakePoint("+nearme.location.lng+","+nearme.location.lat+"),4326) ASC LIMIT "+nearme.total+"",
      cartocss: "#ebt_locations_usa{[mapnik-geometry-type = point]{marker-fill: #009d28; marker-line-color: #fff; marker-allow-overlap: true;}}"
    });


  
  
  },
  newPos: function () {
    nearme.updateQuery();
    nearme.map.setView(nearme.location.pos, 15);
    new L.CircleMarker(nearme.location.pos,{radius: 4}).addTo(nearme.map);
  }
}

$(document).ready(function () {

  nearme.location.ready.done(function () {
      nearme.map = new L.Map('map', {
        center: nearme.location.pos,
        zoom: 3
      })

      L.tileLayer('https://dnv9my2eseobd.cloudfront.net/v3/cartodb.map-4xtxp73f/{z}/{x}/{y}.png', {
        attribution: 'Mapbox <a href="http://mapbox.com/about/maps" target="_blank">Terms &amp; Feedback</a>'
      }).addTo(nearme.map);

      var layerUrl = 'http://cfa.cartodb.com/api/v2/viz/41b8ed52-23e4-11e4-9bed-0edbca4b5057/viz.json';
  
      cartodb.createLayer(nearme.map, layerUrl)
        .addTo(nearme.map)
        .on('done', function(layer) {
          // change the query for the first layer

          var sublayer = layer.getSubLayer(0);

          sublayer.set(nearme.subLayerOptions);
          sublayer.infowindow.set('template', $('#infowindow_template').html());
          nearme.sublayers.push(sublayer);

          nearme.newPos()

          nearme.location.on.move(nearme.newPos)


        }).on('error', function() {
          //log the error
        });
    })
})
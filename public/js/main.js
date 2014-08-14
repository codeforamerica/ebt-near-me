//  L E A F L E T   A N D   M A P B O X

// MAP GLOBALS 
var map = new L.map("map", {center: [37.783, -122.425], zoom: 13})
.addLayer( new L.TileLayer('http://{s}.tiles.mapbox.com/v3/alanjosephwilliams.j8058jhn/{z}/{x}/{y}.png'));

function main() {
	cartodb.createLayer(map, 'http://cfa.cartodb.com/api/v2/viz/41b8ed52-23e4-11e4-9bed-0edbca4b5057/viz.json')
	.addTo(map)
	.on('done', function(layer) {
		console.log("success")
		layer.setInteraction(true);
		layer.on('featureOver', function(e, pos, latlng, data) {
			cartodb.log.log(e, pos, latlng, data);
		});

		layer.on('error', function(err) {
			cartodb.log.log('error: ' + err);
			console.log('error: ' + err);
		});
	}).on('error', function() {
		cartodb.log.log("some error occurred");
		console.log("some error occurred")
	});
  }

function get_location() {
    navigator.geolocation.getCurrentPosition(on_success);
}

function on_success(currentPosition) {
	my_location = {};
	my_location = { latitude: currentPosition.coords.latitude, longitude: currentPosition.coords.longitude }
}

var my_location;
window.onload = main;
// window.onload = get_location;

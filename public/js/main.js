var map = new L.map("map", {center: [37.783, -122.425], zoom: 13})
  .addLayer( new L.TileLayer('http://{s}.tiles.mapbox.com/v3/alanjosephwilliams.j8058jhn/{z}/{x}/{y}.png'));

// var map = new L.Map("map", {center: [37.8, -96.9], zoom: 4})
//     .addLayer(new L.TileLayer("http://{s}.tiles.mapbox.com/v3/examples.map-vyofok3q/{z}/{x}/{y}.png"));



function get_location() {
    navigator.geolocation.getCurrentPosition(on_success);
}

function on_success(currentPosition) {
	my_location = {};
	my_location = { latitude: currentPosition.coords.latitude, longitude: currentPosition.coords.longitude }
}

var my_location;
window.onload = get_location;
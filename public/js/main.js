function get_location() {
    navigator.geolocation.getCurrentPosition(on_success);
}

function on_success(currentPosition) {
	my_location = {};
	my_location = { latitude: currentPosition.coords.latitude, longitude: currentPosition.coords.longitude }
	console.log(my_location);
}

var my_location;
window.onload = get_location;
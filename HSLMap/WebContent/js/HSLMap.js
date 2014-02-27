// Use SockJS
Stomp.WebSocketClass = SockJS;

// RabbitMQ connection parameters
var user = "guest",
	pass = "guest",
	vhost = "/",
	url = 'http://127.0.0.1:15674/stomp',
	queue = "/queue/HSLTrackingQueue";

var ws = new SockJS(url);
var client = Stomp.over(ws);

// Transport type icons
var tramIcon = L.icon({
	iconUrl: 'http://live.mattersoft.fi/hsl/images/vehicles/tram00.png',
	iconSize: [40, 40],
	iconAnchor: [12, 39],
	shadowUrl: null
});

var busIcon = L.icon({
	iconUrl: 'http://live.mattersoft.fi/hsl/images/vehicles/bus00.png',
	iconSize: [40, 40],
	iconAnchor: [12, 39],
	shadowUrl: null
});

var metroIcon = L.icon({
	iconUrl: 'http://live.mattersoft.fi/hsl/images/vehicles/metro00.png',
	iconSize: [40, 40],
	iconAnchor: [12, 39],
	shadowUrl: null
});

var kutsuplusIcon = L.icon({
	iconUrl: 'http://live.mattersoft.fi/hsl/images/vehicles/kutsu.png',
	iconSize: [40, 40],
	iconAnchor: [12, 39],
	shadowUrl: null
});
	
var trainIcon = L.icon({
	iconUrl: 'http://live.mattersoft.fi/hsl/images/vehicles/train0.png',
	iconSize: [40, 40],
	iconAnchor: [12, 39],
	shadowUrl: null
});
	
// Map centered in Helsinki with initial zoom set to 13
var map = L.map('map').setView([60.1708, 24.9375], 13);

// Layer from OpenStreetMaps
//L.tileLayer('http://{s}.tile.cloudmade.com/9005e2b5656c41a1ba9ee9c775de19a1/997/256/{z}/{x}/{y}.png', {
//	attribution: 'Routing powered by <a href="http://live.mattersoft.fi/hsl/defaultEn.aspx">HSL LIVE</a>, Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery &copy <a href="http://cloudmade.com">CloudMade</a>',
//	maxZoom: 18
//}).addTo(map);

// Layer from Stamen (watercolor) from http://leaflet-extras.github.io/leaflet-providers/preview/
//L.tileLayer('http://{s}.tile.stamen.com/watercolor/{z}/{x}/{y}.jpg', {
//	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
//	subdomains: 'abcd',
//	minZoom: 3,
//	maxZoom: 16
//}).addTo(map);

// Thunderforest.Transport from http://leaflet-extras.github.io/leaflet-providers/preview/
//L.tileLayer('http://{s}.tile2.opencyclemap.org/transport/{z}/{x}/{y}.png', {
//	attribution: '&copy; <a href="http://www.opencyclemap.org">OpenCycleMap</a>, &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
//}).addTo(map);

// OpenMapSurfer.Greyscale from http://leaflet-extras.github.io/leaflet-providers/preview/

var OpenMapSurfer_Grayscale = L.tileLayer('http://129.206.74.245:8008/tms_rg.ashx?x={x}&y={y}&z={z}', {
	attribution: 'Imagery from <a href="http://giscience.uni-hd.de/">GIScience Research Group @ University of Heidelberg</a> &mdash; Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
}).addTo(map);

// polyline and marker hashmaps 
var polylineHashMap = {};
var markerHashMap = {};

window.onload = function() {
	// RabbitMQ connection
	client.connect(user, pass, on_connect, on_error, vhost);
	// Get map from index.html
	//map = document.getElementById('map');
};

var on_connect = function() {
	this.debug('Connected to RabbitMQ-Web-Stomp');
    console.log(client);
    client.subscribe(queue, on_message);
};

var on_error = function() {
	//output.innerHTML += 'Connection failed!<br />';
	this.debug('Connection failed!');
};

var hslObs, vehicleId, lat, lon;


var on_message = function(msg) {
	// Get vehicleId
	hslObs = msg.body.split(" ");
	vehicleId = hslObs[0];
	lat = parseFloat(hslObs[1]);
	lon = parseFloat(hslObs[2]);
	// If vehicleId is in the list, ...
	if (vehicleId in markerHashMap) {
		// Add point to 
		markerHashMap[vehicleId].addLatLng(new L.LatLng(lon, lat));
		console.log(markerHashMap[vehicleId]);
		// Start the marker movement after having 3 points
		if (polylineHashMap[vehicleId].getLatLngs().length == 4) {
			map.addLayer(markerHashMap[vehicleId]);
		} 
	}
	// else, create a new marker located at the corresponding coordinates
	else {
		var line = L.polyline([[lon, lat], [lon, lat]]); 
		console.log(line);
		var marker;
		// check the vehicle type to assign the corresponding icon
		if (vehicleId.indexOf("RHKL") == 0) {
			marker = L.animatedMarker(line.getLatLngs(), {
				icon: tramIcon,
				autoStart: true,
				onEnd: on_marker_end(vehicleId),
				//distance: 200, // meters
				//interval: 2000, // milliseconds
			});
		}
		else if (vehicleId.indexOf("metro") == 0) {
			marker = L.animatedMarker(line.getLatLngs(), {
				icon: metroIcon,
				autoStart: true,
				onEnd: on_marker_end(vehicleId),
				//distance: 200, // meters
				//interval: 2000, // milliseconds
			});
		}
		else if ((vehicleId.indexOf("K") == 0) || (vehicleId.indexOf("k") == 0)) {
			marker = L.animatedMarker(line.getLatLngs(), {
				//icon: kutsuplusIcon,
				icon: busIcon,
				autoStart: true,
				onEnd: on_marker_end(vehicleId),
				//distance: 200, // meters
				//interval: 2000, // milliseconds
			});
		}
		else if (vehicleId.indexOf("H") == 0) {
			marker = L.animatedMarker(line.getLatLngs(), {
				icon: trainIcon,
				autoStart: true,
				onEnd: on_marker_end(vehicleId),
				//distance: 200, // meters
				//interval: 2000, // milliseconds
			});
		}
		
		polylineHashMap[vehicleId] = line;
		markerHashMap[vehicleId] = marker;
		map.addLayer(marker);
		//marker.start();
	}
	
};

//What happens when the route of a marker ends?
function on_marker_end(vehicleId) {
  $(this._shadow).fadeOut();
  $(this._icon).fadeOut(3000, function(){
	  map.removeLayer(this);
  });
  delete polylineHashMap[vehicleId];
  delete markerHashMap[vehicleId];
}

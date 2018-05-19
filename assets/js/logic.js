centerOfUS = [39.8283,-98.5795];
zoomLevel = 5;

var outdoorBaseLayer = L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/outdoors-v9/tiles/256/{z}/{x}/{y}?access_token='+accessToken)
var greyscaleBaseLayer = L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/light-v9/tiles/256/{z}/{x}/{y}?access_token='+accessToken);
var satelliteBaseLayer = L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v9/tiles/256/{z}/{x}/{y}?access_token='+accessToken);

var baseLayers = {'Greyscale': greyscaleBaseLayer,
                    'Outdoors':outdoorBaseLayer,
                    'Satellite':satelliteBaseLayer};

var map = L.map('map-id',{
    center:centerOfUS,
    zoom:zoomLevel,
    layers: [outdoorBaseLayer]
})


//Returns a color string based on magnitude.  Higher magnitudes yield a redder color
function circleColorByMag(mag) {
    switch(true) {
        case mag < 1:
            return '#0000FF';
        case mag < 2:
            return '#66FFCC';
        case mag < 3:
            return '#73E600';
        case mag < 4:
            return '#FFD11A';
        case mag < 5:
            return '#FF6600';
        default:
            return '#FF0000';
    }
}

var url = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson';
var circles = [];

d3.json(url,function(error,data) {
    if(error){console.warn(error)}
    let features = data.features;
    // console.log(features)
    // let maxMag = Math.max.apply(Math,features.map(o=>o.properties.mag)); 

    for(feature in features) {
        let event = features[feature];
        if(event.properties.mag) {
            // console.log(event.properties)
            let magnitude = event.properties.mag;
            let lat = event.geometry.coordinates[1];
            let lon = event.geometry.coordinates[0];
            // let fillRed = parseInt(magnitude/maxMag*255).toString(16);
            // let fillBlue = parseInt((maxMag-magnitude)/maxMag*255).toString(16)
            
            let circle = L.circle([lat,lon],
            {
                color: 'black',
                // fillColor: `#${fillRed}00${fillBlue}`,
                fillColor: circleColorByMag(magnitude),
                fillOpacity: 0.8,
                radius: parseInt(magnitude*20000) 
            }).bindPopup(`<h1>Magnitude: ${magnitude}</h1><h3>Coordinates: ${lat},${lon}</h3>`);
            circles.push(circle);
        }
        
    }
    let circleLayer = L.layerGroup(circles);
    circleLayer.addTo(map)
    let plates = [];
    url = 'https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json';
    d3.json(url,function(error,data) {
        if(error){console.warn(error)};
        let features = data.features;
        features.forEach(x=>plates.push(x.geometry))
        // console.log(plates)
        let plateLayer = L.geoJSON(plates)
        plateLayer.addTo(map)
        let overLayers = {'Earthquakes':circleLayer,'Techtonic Plates':plateLayer};
        L.control.layers(baseLayers,overLayers).addTo(map)
    })

    
    // circles.forEach(x=>x.addTo(map));
    
    
})

var legend = L.control({position: 'bottomright'})

legend.onAdd = function (map) {
    var div = L.DomUtil.create('div','info legend');
    var grades = [0,1,2,3,4,5];
    var labels = [];
    div.innerHTML = '<h5>Magnitude:</h5>'
    for(var i = 0;i<grades.length;i++) {
        div.innerHTML += `<i style="background:${circleColorByMag(grades[i])}"></i> ${grades[i]}${grades[i+1]?'-'+grades[i+1]+'<br>':'+'}`
    }
    return div;
}
legend.addTo(map)
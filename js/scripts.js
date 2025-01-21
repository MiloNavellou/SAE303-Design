
am5.ready(function () {
    async function loadCSV() {
        const response = await fetch('share-of-adults-defined-as-obese.csv');
        const csvText = await response.text();
        const rows = csvText.split('\n').map(row => row.split(','));

        const headers = rows[0];
        const data = rows.slice(1).map(row => {
            const obj = {};
            row.forEach((val, i) => {
                obj[headers[i]] = val;
            });
            return obj;
        });
        return data;
    }

    function getColorForObesity(value) {
        if (value >= 0 && value < 5) {       
            return am5.color(0xFFEB3B); 
        }
        if (value >= 5 && value < 15) {      
            return am5.color(0xFFC107); 
        }
        if (value >= 15 && value < 25) {
            return am5.color(0xFF9800);
        }
        if (value >= 25 && value < 35) {
            return am5.color(0xF4511E);
        }
        return am5.color(0xB71C1C); 
    }
    
    var root = am5.Root.new("chartdiv");
    root.setThemes([am5themes_Animated.new(root)]);

    var chart = root.container.children.push(am5map.MapChart.new(root, {
        panX: "rotateX",
        panY: "rotateY",
        projection: am5map.geoOrthographic()
    }));

    var polygonSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {
        geoJSON: am5geodata_worldLow
    }));

    polygonSeries.mapPolygons.template.setAll({
        fill: am5.color(0xD3D3D3),
        fillOpacity: 1,
        strokeWidth: 1, 
        stroke: am5.color(0xffffff),
        strokeOpacity: 0.5,
        tooltipText: "{name}: {value}%",
        toggleKey: "active",
        interactive: true
    });

    var backgroundSeries = chart.series.unshift(
        am5map.MapPolygonSeries.new(root, {})
    );

    // Create series for background fill
    // https://www.amcharts.com/docs/v5/charts/map-chart/map-polygon-series/#Background_polygon
    var backgroundSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {}));
    backgroundSeries.mapPolygons.template.setAll({
        fill: am5.color(0xD3D3D3), // Bleu clair pastel
        fillOpacity: 0.2, // Opacité complète pour un meilleur contraste
        strokeOpacity: 1
    });
    backgroundSeries.data.push({
        geometry: am5map.getGeoRectangle(90, 180, -90, -180)
    });

    var graticuleSeries = chart.series.unshift(
        am5map.GraticuleSeries.new(root, {
            step: 10
        })
    );

    graticuleSeries.mapLines.template.set("strokeOpacity", 0.1)

    function updateMap(year, data) {
        const obesityData = {};
        data.forEach(row => {
            const country = row["Entity"];
            const rowYear = parseInt(row["Year"], 10);
            const value = parseFloat(row['"Prevalence of obesity among adults']);
            if (rowYear === year) {
                obesityData[country] = value;
            }
        });

        polygonSeries.mapPolygons.template.adapters.add("tooltipText", (text, target) => {
            const countryName = target.dataItem.dataContext.name;
            const value = obesityData[countryName];
            if (value === undefined) {
                return `Absence de données pour ${countryName}`;
            } else {
                return `${countryName}: ${value}%`;
            }
        });

        polygonSeries.mapPolygons.template.adapters.add("fill", (fill, target) => {
            const countryName = target.dataItem.dataContext.name;
            const obesityValue = obesityData[countryName];
            if (obesityValue !== undefined) {
                return getColorForObesity(obesityValue);
            }
            return fill;
        });

        polygonSeries.data.setAll(Object.keys(obesityData).map(country => {
            return {
                id: polygonSeries.getDataItemById(country)?.get("id"),
                name: country,
                value: obesityData[country]
            };
        }));
    }

    loadCSV().then(data => {
        const range = document.getElementById("year-range");
        const display = document.getElementById("year-display");
        const display1 = document.getElementById("year-display1");

        range.addEventListener("input", function () {
            display.textContent = range.value;
            display1.textContent = range.value;
            updateMap(parseInt(range.value, 10), data);
        });

        updateMap(parseInt(range.value, 10), data);
    });

    chart.appear(1000, 100);
});

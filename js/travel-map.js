(function () {
    const destinations = [
        { name: 'France',    city: 'Paris',     coords: [  2.3522, 48.8566] },
        { name: 'Guyane',    city: 'Cayenne',   coords: [-52.3333,  4.9333] },
        { name: 'Paraguay',  city: 'Asunción',  coords: [-57.3333,-25.2867] },
        { name: 'Cap-Vert',  city: 'Praia',     coords: [-23.5133, 14.9333] },
        { name: 'Chine',     city: 'Chengdu',   coords: [104.0668, 30.5728] },
        { name: 'Rwanda',    city: 'Kigali',    coords: [ 30.1044, -1.9706] },
        { name: 'Pologne',   city: 'Varsovie',  coords: [ 21.0122, 52.2297] }
    ];

    const container = document.getElementById('travel-map');
    const width  = 1000;
    const height = 420;

    const svg = d3.select(container)
        .append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .attr('class', 'world-svg');

    const projection = d3.geoNaturalEarth1();
    const path = d3.geoPath(projection);

    d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then(world => {
        // Continents — silhouette pleine, sans Antarctique
        const geometries = world.objects.countries.geometries
            .filter(g => g.id !== '010');
        const land = topojson.merge(world, geometries);

        // Ajuster la projection à la masse terrestre réelle (sans Antarctique)
        projection.fitSize([width, height], land);

        svg.append('path')
            .datum(land)
            .attr('d', path)
            .attr('fill', '#cb8f50')
            .attr('stroke', 'none');

        // Tracé du voyage
        const route = {
            type: 'LineString',
            coordinates: destinations.map(d => d.coords)
        };

        svg.append('path')
            .datum(route)
            .attr('d', path)
            .attr('fill', 'none')
            .attr('stroke', '#CC2222')
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '1, 6')
            .attr('stroke-linecap', 'round')
            .attr('opacity', 0.85);

        // Marqueurs
        const markers = svg.append('g').attr('class', 'markers');

        destinations.forEach((d, i) => {
            const [x, y] = projection(d.coords);
            const g = markers.append('g')
                .attr('class', 'marker')
                .attr('transform', `translate(${x}, ${y})`);

            // Pin de localisation (goutte renversée, ancré en bas)
            g.append('path')
                .attr('class', 'pin-shape')
                .attr('d', 'M0,0 C-7,-9 -9,-14 -9,-18 A9,9 0 1,1 9,-18 C9,-14 7,-9 0,0 Z')
                .attr('fill', '#CC2222')
                .attr('stroke', '#8a1414')
                .attr('stroke-width', 1);

            g.append('circle')
                .attr('cy', -18)
                .attr('r', 3)
                .attr('fill', 'whitesmoke');

            // Étiquette
            const labelOffset = labelPosition(d.name);
            const label = g.append('g')
                .attr('class', 'marker-label')
                .attr('transform', `translate(${labelOffset.x}, ${labelOffset.y})`);

            label.append('text')
                .attr('text-anchor', labelOffset.anchor)
                .attr('class', 'label-name')
                .text(d.name);
        });
    });

    function labelPosition(name) {
        const map = {
            'France':   { x: -12, y: -22, anchor: 'end' },
            'Guyane':   { x: -12, y: -22, anchor: 'end' },
            'Paraguay': { x:  12, y: -22, anchor: 'start' },
            'Cap-Vert': { x: -12, y: -22, anchor: 'end' },
            'Chine':    { x:  12, y: -22, anchor: 'start' },
            'Rwanda':   { x:  12, y: -22, anchor: 'start' },
            'Pologne':  { x:  12, y: -22, anchor: 'start' }
        };
        return map[name] || { x: 12, y: -22, anchor: 'start' };
    }
})();

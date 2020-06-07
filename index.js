// setup parameters
let multiplier = 0.15;
let mallLocs;
let origImgHeight = 4500;
let origImgWidth = 7119;
let intCircScale = 0.7; // scale factor for the interation circles on the landmarks
let height = multiplier * origImgHeight;
let width = multiplier * origImgWidth;

// This will hold voronoi coordinates as an array
let cells;

// cellLiner function for getting path instrictions from coordinates
let cellLiner = d3.line()
    								.x(d => d[0])
    								.y(d => d[1]);

// important selections
let svg = d3.select('svg.voronoi');

async function readAndDraw(){
  // read in teh data of location coordinates of important landmarks
  mallLocs = await d3.csv('mall_illustrated_map.csv');

  // defining the weighted voronoi function
  let weightedVoronoi = d3.weightedVoronoi()
                          .x(d => +d.X * multiplier)
                          .y(d => +d.Y * multiplier)
                          .weight(d => +d.radius * 8) // scaling by 8 to make teh weighting more prominent
                          .clip([[0,0], [0,height], [width, height], [width,0]]);

  // using the function to compute cells
  cells = weightedVoronoi(mallLocs);

  // scale for assigning stroke widths
  let radii = mallLocs.map(d => d.radius);
  let minRad = d3.min(radii);
  let maxRad = d3.max(radii);

  let strokeSScale = d3.scaleLinear()
                        .domain([0, maxRad])
                        .range([1, 2])

  // vornoi paths will be places as paths within clipPath elements within defs
  svg
    .append('defs')
    .selectAll('clipPath')
    .data(cells)
    .enter()
    .append('clipPath')
    .attr('id', (d, i) => "index" + d.site.originalObject.idx) // unique id to identify the sites in voronoi cell data and original data
    .append('path')
    .attr('d', d => cellLiner(d) + "z")
    .style('fill', 'grey')
    .style('fill-opacity', 0.2)
    .style('stroke', 'black');

  // cirular regions for each landmark that will be clipped by the voronoi paths
  svg
    .selectAll('circle')
    .data(mallLocs)
    .enter()
    .append('circle')
    .classed('voronoiCirc', true)
    .attr('id', (d, i) => `circle${i}`)
    .attr("clip-path", function(d, i) { return "url(#index" + d.idx + ")"; })
    //Bottom line for safari, which doesn't accept attr for clip-path
    .style("clip-path", function(d, i) { return "url(#index" + d.idx + ")"; })
    .attr('cx', d => +d.X * multiplier)
    .attr('cy', d => +d.Y * multiplier)
    .attr('r', d => (+d.radius * multiplier)*1.3)
    .style('fill', 'brown')
    .style('fill-opacity', 0.0)

  // defining events

  // important selections
  let clippedCircs = svg.selectAll('circle.voronoiCirc');
  clippedCircs.on('mouseover', function(d, i){
    // getting key data
    let loc = d.Location;
    let X = +d.X;
    let Y = +d.Y;
    let radius = +d.radius;

    // appending circles on top of hovered landmark
    svg.append('circle')
      .attr('class', 'interCirc')
      .attr('cx', d => X * multiplier)
      .attr('cy', d => Y * multiplier)
      .style('fill', '#4A148C')
      .style('fill-opacity', .2)
      .style('stroke', 'black')
      .transition()
      //.ease(d3.easeElastic)
      .duration(150)
      .attr('r', d => (radius * multiplier) * intCircScale)
      .style('stroke-width', d => strokeSScale(radius) + 'px')
      .style('stroke-opacity', 0.5)

    // raise voronoi regions so that interactivity can maintain
    clippedCircs.raise();

  })

  // remove the interaction circles once the mouse goes away
  clippedCircs.on('mouseout', function(d, i){
    console.log(d.Location);
    svg.selectAll('circle.interCirc').remove();
  })


  clippedCircs.on('mousedown', function(d, i){
    console.log('click');
    svg.select('circle.interCirc')
      .style('fill-opacity', 0.6);
  })

  d3.selectAll('circle.voronoiCirc').on('mouseup', function(d, i){
    svg.select('circle.interCirc')
      .style('fill-opacity', 0.2);
  })


}

readAndDraw();

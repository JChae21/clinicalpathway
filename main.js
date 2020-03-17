

var width_dashboard = 1200,
    height_FDG = 1200

// var fitnessColor = d3.scaleSequential()
//     .interpolator(d3.interpolateMagma);

var fitnessColor = d3.scaleLinear()
// .domain([0, 100])
    .range([d3.interpolateMagma(0), d3.interpolateMagma(0.25), d3.interpolateMagma(0.5), d3.interpolateMagma(0.75), d3.interpolateMagma(1)])
    //     .range([d3.interpolatePlasma(0), d3.interpolatePlasma(0.25), d3.interpolatePlasma(0.5), d3.interpolatePlasma(0.75), d3.interpolatePlasma(0.95)])
    .interpolate(d3.interpolateHcl);

var fdg;
var gData;

function tipX(x){
    var winWidth = width;
    var tipWidth = 180;
    x > winWidth - tipWidth - 30 ? y = x-5-tipWidth : y = x+50;
    // x > winWidth - tipWidth - 30 ? y = x-45-tipWidth : y = x+10;
    return y;
}

d3.json("data/out.json", function(error, graph) {
    if (error) throw error;
    initGraph(graph)
});

function initGraph(graph){
    gData = graph;
    drawFDG(graph);
}

function drawFDG(networks){

    var graph = networks;

    var width = width_dashboard,
        height = height_FDG;

    var svg = d3.select("#fd-graph")
        .attr("width", width)
        .attr("height", height);

    svg.selectAll("g#fd-graph").remove();

    svg.append('defs').append('marker')
        .attr("id",'arrowhead')
        .attr('viewBox','-0 -5 10 10') //the bound of the SVG viewport for the current SVG fragment. defines a coordinate system 10 wide and 10 high starting on (0,-5)
         .attr('refX',24) // x coordinate for the reference point of the marker. If circle is bigger, this need to be bigger.
         .attr('refY',0)
         .attr('orient','auto')
            .attr('markerWidth',6)
            .attr('markerHeight',6)
            .attr('xoverflow','visible')
        .append('svg:path')
        .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
        .attr('fill', '#999')
        .style('stroke','none');        

    fdg = svg.append("g")
        .attr("id", "fd-graph")        

    var simulation = d3.forceSimulation()
        .force("link", d3.forceLink()
            .id(function(d) { return d.id; })
            .distance(600)
            )

        .force("charge", d3.forceManyBody().strength(-300))
        // .force("charge", d3.forceManyBody().strength(-50))
        // .force("friction", 0.7)
        .force("center", d3.forceCenter(width / 2, height / 2))

        // .force('x', d3.forceX().x(function(d) {
        //     return xCenter(d.fitness);
        //     // return xCenter(new Date('1995-12-17T'+d.time));
        // }))
        // .force('y', d3.forceY().y(function(d) {
        //     return yCenter(+d.infer_time);
        // }))        
        // .force('collision', d3.forceCollide().radius(function(d) {
        //     // return radius
        //     return scaleRadius(+d.parameters)
        // }))        

    // var scaleRadius = d3.scaleLinear()
    //     .domain([1, 5])
    //     .range([4, 40])
    //     .clamp(true);


    var node = fdg.selectAll(".nodes")
        .data(graph.nodes)
        .enter().append("g")
        .attr("class", "nodes")

    node.call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged));
         // .on("end", dragended));

    node.append("circle")
        .attr("r", 10)
        .attr("id",d=> "circle" + d.id)
        .style("stroke", "grey")
        .style("stroke-opacity",0.3)
        .style("stroke-width", 3)
        .attr("fill", "#fff")
        .on("click", onMouseClick)
        .on("mouseover", onMouseOver)
        .on("mousemove", onMouseMove)
        .on("mouseout", onMouseOut)

    node.append("text")
        .attr("dy", ".35em")
        .attr("dx", 15)
        .text(d => d.label);

    let extLink = d3.extent(graph.links, d=> {
        let res = d.label.replace(',', '')
        return +res
    })

    var scaleLink = d3.scaleLinear()
        .domain(extLink)
        .range([1, 10]);

    var link = fdg.append("g")
        .selectAll("path")
        .data(graph.links)
        .enter().append("path")
        .attr("class", "links unselected")
        .attr("stroke","#999")
        .attr("stroke-width", d=> {
            let res = d.label.replace(',', '')
            return scaleLink(+res)
        })
        .style('fill', 'none')
        .style("opacity", 0.8)
        .attr("id", d=> "line"+d.source+d.target)
        .attr('marker-end','url(#arrowhead)');

    const edgepaths = fdg.selectAll(".edgepath")
        .data(graph.links)
        .enter()
        .append('path')
        .attr('class', 'edgepath')
        .attr('fill-opacity', 0)
        .attr('stroke-opacity', 0)
        .attr('id', function (d, i) {return 'edgepath' + i})
        .style("pointer-events", "none");

    const edgelabels = fdg.selectAll(".edgelabel")
        .data(graph.links)
        .enter()
        .append('text')
        .style("pointer-events", "none")
        .attr('class', 'edgelabel')
        .attr('id', function (d, i) {return 'edgelabel' + i})
        .attr('font-size', 10)
        .attr('fill', '#aaa');

    edgelabels.append('textPath')
        .attr('xlink:href', function (d, i) {return '#edgepath' + i})
        .style("text-anchor", "middle")
        .style("pointer-events", "none")
        .attr("startOffset", "50%")
        .text(d => d.label);

    simulation
        .nodes(graph.nodes)
        .on("tick", ticked);

    simulation.force("link")
        .links(graph.links);

    // simulation
    //     .force("x", d3.forceX().x(function (d) {
    //         return xScale(new Date(d.time));
    //     }))
    //     .force("y", d3.forceY().y(function (d) {
    //         return 0;
    //     }));

    function ticked() {

        // node.each(function(d){
        //     d.x = xConstraint(new Date(d.time));
        // }) //constrains/fixes x-position

        // node
        //     .attr("cx", function(d) { return d.x })
        //     .attr("cy", function(d) { return d.y });

        node.attr("transform", d => `translate(${d.x},${d.y})`);


        // link
        //     .attr("x1", function(d) { return d.source.x; })
        //     .attr("y1", function(d) { return d.source.y; })
        //     .attr("x2", function(d) { return d.target.x; })
        //     .attr("y2", function(d) { return d.target.y; });

        link.attr("d", function(d) {
            var dx = d.target.x - d.source.x,
                dy = d.target.y - d.source.y,
                dr = Math.sqrt(dx * dx + dy * dy);
            return "M" + 
                d.source.x + "," + 
                d.source.y + "A" + 
                dr + "," + dr + " 0 0,1 " + 
                d.target.x + "," + 
                d.target.y;
        });

        edgepaths.attr("d", function(d) {
            var dx = d.target.x - d.source.x,
                dy = d.target.y - d.source.y,
                dr = Math.sqrt(dx * dx + dy * dy);
            return "M" + 
                d.source.x + "," + 
                d.source.y + "A" + 
                dr + "," + dr + " 0 0,1 " + 
                d.target.x + "," + 
                d.target.y;
        });                    

        // edgepaths.attr('d', d => 'M ' + d.source.x + ' ' + d.source.y + ' L ' + d.target.x + ' ' + d.target.y);


        // node.attr("cx", function(d) { return d.x = Math.max(10, Math.min(width - 10, d.x)); })
        //     .attr("cy", function(d) { return d.y = squeezee_factor * Math.max(10, Math.min(height - 10, d.y)); });

        // node.attr("cx", function(d) {
        //     // if( d.nChildren > 10 )
        //         // return d.fx = x(d.idx);
        //     return d.x = x(d.idx)
        // })
        //     .attr("cy", function(d) { return d.y = Math.max(10, Math.min(height - 10, d.y)); });
    }

    var zoom_handler = d3.zoom()
        .on("zoom", zoom_actions);

    zoom_handler(svg);

    // initLegend();

    function zoom_actions(){
        fdg.attr("transform", d3.event.transform)
    }

    function dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }

    function dragended(d) {
        if (!d3.event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    function selectNode(targets) {
        var sources = [];
        fdg.selectAll("line.links").filter(function (d) {
            var bResult = false;
            for(var i=0; i < targets.length; i++){
                if( targets[i] == d.target.id ){
                    if( !sources.includes(d.target.id) ) {
                        sources.push(d.source.id);
                        console.log(d.source.id)
                    }
                    bResult = true;
                    break;
                }
            }
            return bResult;
            // return node.id == d.target.id;
        }).attr("class", "links selected");

        fdg.selectAll("circle.nodes").filter(function (d) {
            var bResult = false;
            for(var i=0; i < sources.length; i++){
                if( sources[i] == d.id ){
                    bResult = true;
                    break;
                }
            }
            return bResult;
        }).attr("class", "nodes selected");

        if( sources.length > 0 )
            selectNode(sources);
    }

    function onMouseClick(node) {
        fdg.selectAll("line.links").attr("class", "links unselected");
        fdg.selectAll("circle.nodes").attr("class", "nodes unselected");
        selectNode([node.id]);

        var i;
        for(i=0; i < sortedNodes.length; i++){
            if(sortedNodes[i].id == node.id){
                break
            }
        }
        // i -= 1;

        selectNodes(i);
    }

    function onMouseOver(d) {
        var tooltip = d3.select("text#tooltip");

        // initialize if missing
        if (tooltip.size() < 1) {
            tooltip = d3.select("g#fd-graph").append("text").attr("id", "tooltip");
        }

        // calculate bounding box of plot WITHOUT tooltip
        tooltip.style("display", "none");
        onMouseMove(d);

        var bbox = {
            plot: d3.select("g#fd-graph").node().getBBox()
        }

        // restore tooltip display but keep it invisible
        tooltip.style("display", null);
        tooltip.style("visibility", "hidden");

        // now set tooltip text and attributes

        tooltip.text(d.fitness + " | " + d.time + " | " + d.id);

        tooltip.attr("text-anchor", "end");
        tooltip.attr("dx", -5);
        tooltip.attr("dy", -5);

        // calculate resulting bounding box of text
        bbox.text = tooltip.node().getBBox();

        // determine if need to show right of pointer
        if (bbox.text.x < bbox.plot.x) {
            tooltip.attr("text-anchor", "start");
            tooltip.attr("dx", 5);
        }

        // determine if need to show below pointer
        if (bbox.text.y < bbox.plot.y) {
            tooltip.attr("dy", bbox.text.height / 2);

            // also need to fix dx in this case
            // so it doesn't overlap the mouse pointer
            if (bbox.text.x < bbox.plot.x) {
                tooltip.attr("dx", 15);
            }
        }

        tooltip.style("visibility", "visible");
        d3.select(this).classed("selected", true);
    }

    function onMouseMove(d) {
        var coords = d3.mouse(d3.select("g#fd-graph").node());

        d3.select("text#tooltip")
            .attr("x", coords[0])
            .attr("y", coords[1]);
    }

    function onMouseOut(d) {
        d3.select(this).classed("selected", false);
        d3.select("text#tooltip").style("visibility", "hidden");
    }

    function initLegend() {

        var legend = d3.select('#color-scale-bar');

        var h = 15;
        var w = 350;

        var legend_data = [];
        var len = fitnessColor.domain().length - 1;
        fitnessColor.domain().forEach(function (d, i) {
            legend_data.push({offset: ((i/len)*100), color: d3.interpolateMagma(i/len), text: Math.floor(d * 100) / 100});
        });

        //Append a linearGradient element to the defs and give it a unique id
        var linearGradient = legend.append("defs")
            .append("linearGradient")
            .attr("id", "linear-gradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "0%");

        linearGradient.selectAll("stop")
            .data(legend_data)
            .enter().append("stop")
            .attr("offset", function(d) { return d.offset + "%"; })
            .attr("stop-color", function(d) { return d.color; });

        legend.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("height", h)
            .attr("width", w)
            .attr("fill", "url('#linear-gradient')");

        legend.selectAll("text")
            .data(legend_data)
            .enter().append("text")
            .attr("x", function (d) {
                return d3.min([w * d.offset/100, 330]);
            })
            .attr("y", h+12)
            .attr("font-family", "sans-serif")
            // .attr("font-size", "16px")
            // .attr("fill", "white")
            .text(function (d) {
                return d.text;
            });
    }
}

function showTooltip(mousex, values, color) {

    if( values ) {
        d3.selectAll("g#layer-tooltip").remove();

        var tooltip = d3.select("#layer-pattern")
            .append("g")
            .attr("width", 200)
            .attr("height", 100)
            .attr("id", "layer-tooltip");

        tooltip.selectAll("line")
            .data(values.filter(function(d) { return d.type != "date"; }))
            .enter().append("line")
            .attr("x1", 0)
            .attr("y1", function (d, i) {
                return i * 17 + 10;
            })
            .attr("x2", 20)
            .attr("y2", function (d, i) {
                return i * 17 + 10;
            })
            .style("stroke", function (d) {
                if( d.type == "fitness")
                    return "#6F257F";
                return color(d.type);
            })
            .style("stroke-width", 4);

        tooltip.selectAll("text")
            .data(values.filter(function(d) { return d.type != "date"; }))
            .enter().append("text")
            .attr("x", 25)
            .attr("y", function (d, i) {
                return i * 17 + 15;
            })
            .text(function (d) {
                return d.type + ": " + d.value;
            });

        tooltip.attr("transform", "translate("+ (mousex + 50) + ", 140)");
        tooltip.style("display", null);
        tooltip.style("visibility", "visible");
        // tooltip.style("left", tipX(mousex) + "px").style("visibility", "visible");

        // console.log(mousex);
    }else{
        d3.select("g#layer-tooltip").style("visibility", "hidden");
        console.log("hidden");
    }
}

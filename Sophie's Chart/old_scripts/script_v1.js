/* defining variables for the width and heigth of the SVG */
const width = document.querySelector("#chart").clientWidth;
const height = document.querySelector("#chart").clientHeight;
const margin = { top: 50, left: 150, right: 50, bottom: 80 };

const legendWidth = document.querySelector("#legend").clientWidth;
const legendHeight = document.querySelector("#legend").clientHeight;

/*creating the actual SVG */
const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

const legend = d3.select("#legend")
    .append("svg")
    .attr("width", legendWidth)
    .attr("height", legendHeight);

d3.csv("./data/U.S.TextileFiberTrade_with10YrAvg.csv", parse).then(function (data) {

    /* filter subset of data */
    const keys = ["cotton", "synthetic", "wool"]

    const filtered = data.filter(d => d.trade_type === "import");
    const cotton_only = filtered.filter(d => d.fiber_type === "cotton");
    console.log(cotton_only)

    //set out colors based on our list of keys
    const colorScale = d3.scaleOrdinal()
        .domain(keys)   
        .range(["#335145", "#2DE49B", "#D6F49D", "#EAD637", "#B86F52"])

    //group the data by continent
    const by_textile = d3.groups(filtered, d=>d.fiber_type)
    console.log(by_textile)

    //calculate the total population for each year (by continent)
    let import_by_textile = [] //an empty array to hold our new dataset
    for(let i = 0; i < by_textile.length; i++) {
        let textile = by_textile[i][0]; 
        let nested = d3.nest()
            .key(d => d.month)
            .rollup(d => d3.sum(d, g => g.value)) //add up populations of every country in that continent for each year
            .entries(by_textile[i][1])
        nested.forEach((d) => d.key = +d.key) //d3.nest generates keys as strings, we need these as numbers to use our linear xScale 
        for(let j = 0; j < nested.length; j++) {
            import_by_textile.push({ //pushes the records created by the nesting function into our new array
                textile: textile,
                month: nested[j].key,
                value: nested[j].value
            })
        }
    }
    
    //use the arquero library to pivot the data into an array of objects where each object has a year and a key for each continent
    const by_month = aq.from(import_by_textile)
        .groupby("month")
        .pivot("textile", "value")
        .objects()
    console.log(by_month)

    //generate the dataset we'll feed into our chart
    const stackedData = d3.stack()
        .keys(keys)(by_month)
        .map((d) => {
            return d.forEach(v => v.key = d.key), d;
        })
    console.log(stackedData)
    
    //scales - xScale is a linear scale of the years
    const xScale = d3.scaleLinear()
        .domain([d3.min(by_month, d => d.month), d3.max(by_month, d => d.month)])
        .range([margin.left, width - margin.right]);

    //yScale is a linear scale with a minimum value of 0 and a maximum bsed on the total population maximum
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(by_month, d => d["cotton"] + d["wool"] + d["synthetic"])])
        .range([height - margin.bottom, margin.top]);

    //draw the areas
    svg.selectAll(".path")
        .data(stackedData)
        .enter()
        .append("path")
        .attr("class", "path")
        .attr("fill", d => colorScale(d.key))
        .attr("d", d3.area()
            .x((d, i) => {
                return xScale(d.data.month);
            })
            //the starting and ending points for each section of the stack
            .y1(d => yScale(d[0])) 
            .y0(d => yScale(d[1]))
        )
        
    svg.append("line")
        .attr("class", "avg_line")
        .attr("x1", xScale(d3.min(cotton_only, d=> d.month)))
        .attr("x2", xScale(d3.max(cotton_only, d=> d.month)))
        .attr("y1", yScale(d3.min(cotton_only, d=> d.monthly_avg)))
        .attr("y2", yScale(d3.max(cotton_only, d=> d.monthly_avg)))
        .attr("stroke", "red")
        .attr("stroke-width", 2);
        
    //draw the x and y axis
    const xAxis = svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom().scale(xScale).tickFormat(d3.format("Y")));

    const yAxis = svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft()
            .scale(yScale)
            .tickFormat(d3.format(".2s"))); //use d3.format to customize your axis tick format

    const xAxisLabel = svg.append("text")
        .attr("class", "axisLabel")
        .attr("x", width / 2)
        .attr("y", height - margin.bottom / 3)
        .text("Month");

    const yAxisLabel = svg.append("text")
        .attr("class", "axisLabel")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", margin.left / 2)
        .text("Total Imports (1,000 lbs)");

    //draw the legend
    const legendRects = legend.selectAll("rect")
        .filtered(keys)
        .enter()
        .append("rect")
        .attr("x", 0)
        .attr("y", (d,i) => i * 30)
        .attr("width", 20)
        .attr("height", 20)
        .attr("fill", d => colorScale(d))

    const legendLabels = legend.selectAll("text")
        .filtered(keys)
        .enter()
        .append("text")
        .attr("class", "legendLabel")
        .attr("x", 27)
        .attr("y", (d,i) => i * 30 + 15)
        .text(d => d)

});

//get the data in the right format
function parse(d) {
    return {
        trade_type: d.trade_type, //this is a binary value
        fiber_type: d.fiber_type,
        year: +d.year,
        month: +d.month, 
        value: +d.value, 
        monthly_avg: +d.monthly_avg,
        yearly_above: +d.yearly_above,
        monthly_above: +d.monthly_above,
        value_below: +d.value_below,
        value_above: +d.value_above,
        value_below_adj: +d.value_below_adj

    }
}


//Function to set up the tabs interaction
function showVis(evt) {
    // Declare all variables
    let i, tablinks;

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    evt.currentTarget.className += " active";
}

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

// Variables for the buttons so we can set up event listeners
const btn1 = d3.select("#cotton");
const btn2 = d3.select("#synthetic");
const btn3 = d3.select("#wool");

d3.csv("./data/U.S.TextileFiberTrade_with10YrAvg.csv", parse).then(function (data) {

    /* filter subset of data */
    const keys = ["value", "value_above", "value_below", "value_below_adj"]

    /* filter subset of data */
    const cotton_only = data.filter(d => d.fiber_type === "cotton" && d.trade_type === "import");
    const synthetic_only = data.filter(d => d.fiber_type === "synthetic" && d.trade_type === "import");
    const wool_only = data.filter(d => d.fiber_type === "wool" && d.trade_type === "import");

    console.log(cotton_only)
    console.log(synthetic_only)
    console.log(wool_only)
    
    //set out colors based on our list of keys
    const colorScale = d3.scaleOrdinal()
        .domain(keys)   
        .range(["#335145", "#2DE49B", "#D6F49D", "#EAD637", "#B86F52"])

    //draw the x and y axis
    let xAxis = svg.append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${height - margin.bottom})`)

    let yAxis = svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(${margin.left},0)`)

    let path = svg.append("path").attr("class", "my_path")
    let avg_line = svg.append("line").attr("class", "avg_line")

    let xAxisLabel = svg.append("text")
        .attr("class", "axisLabel")
        .attr("x", width / 2)
        .attr("y", height - margin.bottom / 3)
        .text("Month");

    let yAxisLabel = svg.append("text")
        .attr("class", "axisLabel")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", margin.left / 2)
        .text("Total Imports (1,000 lbs)");

    //draw the legend
    let legendRects = legend.selectAll("rect")
        .enter()
        .append("rect")
        .attr("x", 0)
        .attr("y", (d,i) => i * 30)
        .attr("width", 20)
        .attr("height", 20)
        .attr("fill", d => colorScale(d))

    let legendLabels = legend.selectAll("text")
        .enter()
        .append("text")
        .attr("class", "legendLabel")
        .attr("x", 27)
        .attr("y", (d,i) => i * 30 + 15)
        .text(d => d)

    //this function handles the data-driven elements
    function draw(dataset) {
        
        console.log(dataset)

        let stack = d3.stack()
        .keys(keys)

        let stackedData = stack(dataset); 
    
        console.log(stackedData)

        //scales - xScale is a linear scale of the years
        const xScale = d3.scaleLinear()
        .domain([d3.min(dataset, d => d.month), d3.max(dataset, d => d.month)]) //If I make this stackedData it breaks!
        .range([margin.left, width - margin.right]);
        
        //yScale is a linear scale with a minimum value of 0 and a maximum bsed on the total population maximum
        const yScale = d3.scaleLinear()
        .domain([0, d3.max(dataset, d => d["value"] +d["value_above"] + d["value_below"] + d["value_below_adj"])])
        .range([height - margin.bottom, margin.top]);

        //draw the areas
        svg.selectAll(".my_path")
            .data(stackedData)
        
        path.enter()
            .attr("class", "my_path")
            .merge(path)
            .transition()
            .duration(500)
            .attr("fill", d => colorScale(d.key))  
            .attr("d", d3.area()
                .x((d, i) => {
                    return xScale(d.data.month);
                })
                //the starting and ending points for each section of the stack
                .y1(d => yScale(d[0])) 
                .y0(d => yScale(d[1]))
            )
        
        avg_line.enter().append("line")
            .attr("class", "avg_line")
            .merge(avg_line)
            //transition and duration create that smooth D3 animation we're going for
            .transition()
            .duration(500)
            .attr("class", "avg_line")
            .attr("x1", xScale(d3.min(dataset, d=> d.month)))
            .attr("x2", xScale(d3.max(dataset, d=> d.month)))
            .attr("y1", yScale(d3.min(dataset, d=> d.monthly_avg)))
            .attr("y2", yScale(d3.max(dataset, d=> d.monthly_avg)))
            .attr("stroke", "red")
            .attr("stroke-width", 2);

        //the exit function removes anything we don't need
        path.exit()
        .transition()
        .duration(500)
        .remove();

        avg_line.exit()
            .transition()
            .duration(500)
            .remove();

        //axis updates
        xAxis.transition().duration(500).call(d3.axisBottom().scale(xScale));
        yAxis.transition().duration(500).call(d3.axisLeft().scale(yScale).tickFormat(d3.format(".2s")));
    }
    //initialize with the cotton dataset
    draw(cotton_only);

    //buttons handles switching between datasets
    btn1.on("click", function () {
        draw(cotton_only);
    });
    btn2.on("click", function () {
        draw(synthetic_only);
    });
    btn3.on("click", function () {
        draw(wool_only);
    });


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


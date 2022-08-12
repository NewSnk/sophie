// //Function to set up the tabs interaction
// function showVis(evt) {
//     // Declare all variables
//     let i, tablinks;

//     // Get all elements with class="tablinks" and remove the class "active"
//     tablinks = document.getElementsByClassName("tablinks");
//     for (i = 0; i < tablinks.length; i++) {
//         tablinks[i].className = tablinks[i].className.replace(" active", "");
//     }

//     // Show the current tab, and add an "active" class to the button that opened the tab
//     evt.currentTarget.className += " active";
// }

function canvas_clear() {

    svg
        .selectAll("*")
        .remove();
}

/* defining variables for the width and heigth of the SVG */
const width = document.querySelector("#graph").clientWidth;
const height = document.querySelector("#graph").clientHeight;
const margin = { top: 50, left: 150, right: 50, bottom: 350 };


/*creating the actual SVG */
const svg = d3.select("#graph")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

// Variables for the buttons so we can set up event listeners
// const btn1 = d3.select("#raw");
// const btn2 = d3.select("#below");
// const btn3 = d3.select("#pre_adjustment");
// const btn4 = d3.select("#pre_adjustment_2");
// const btn5 = d3.select("#adjustment");
// const btn6 = d3.select("#deficit");

d3.csv("./data/U.S.TextileFiberTrade_with10YrAvg.csv", parse).then(function (data) {

    /* filter subset of data */
    const raw = ["value"]
    const below = ["value", "value_below"]
    const pre_adjustment = ["value_net_above", "value_above", "value_below"]
    const pre_adjustment_2 = ["value_net_above", "value_below_adj", "average_net_adjusted", "value_above"]
    const adjustment = ["value", "value_below_adj"]
    const deficit = ["value_below_adj"]

    const raw_colors = ["#03a1fc"]
    const below_colors = ["#a0b3b8", "#fc0318"]
    const pre_adjustment_colors = ["#a0b3b8", "#62bd74", "#ff0318"]
    const pre_adjustment_2_colors = ["#a0b3b8", "#ff0318", "#21632b", "#62bd74"]
    const adjustment_colors = ["#a0b3b8", "#f0136b"]
    const deficit_colors = ["#f0136b"]

    const opacity_scale1 = [1]
    const opacity_scale2 = [1, 0.75]
    const opacity_scale3 = [1, 0.75, 0]
    const opacity_scale4 = [0.75, 0.75, 0.2]
    const opacity_scale5 = [0.75, 0.75]
    const opacity_scale6 = [0.75]

    const series1 = 'series1'
    const series2 = 'series2'
    const series3 = 'series3'
    const series4 = 'series4'
    const series5 = 'series5'
    const series6 = 'series6'

    /* filter subset of data */
    const cotton_only = data.filter(d => d.fiber_type === "cotton" && d.trade_type === "import");
    const synthetic_only = data.filter(d => d.fiber_type === "synthetic" && d.trade_type === "import");
    const wool_only = data.filter(d => d.fiber_type === "wool" && d.trade_type === "import");

    let xAxis = svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .attr("color", "#94959c")

    let yAxis = svg.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(${margin.left},0)`)
        .attr("color", "#94959c")

    let path = svg.append("path").attr("class", "my_path")
    let line = svg.append("path").attr("class", "my_line")

    let xAxisLabel = svg.append("text")
        .attr("class", "axisLabel")
        .attr("x", width - 75)
        .attr("y", height - margin.bottom + 50)
        .attr("text-anchor", "end")
        .attr("color", "#94959c")
        .text("Month")

    let yAxisLabel = svg.append("text")
        .attr("class", "axisLabel")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2 + 250)
        .attr("y", margin.left / 2 + 20)
        .attr("text-anchor", "end")
        .attr("color", "#94959c")
        .text("Million Pounds Raw Imports")

    //this function handles the data-driven elements
    function draw(dataset, selected_key, selected_color, series, opacity_scales) {

        let stack = d3.stack()
            .keys(selected_key)

        //set out colors based on our list of keys
        const colorScale = d3.scaleOrdinal()
            .domain(selected_key)
            .range(selected_color)

        const opacityScale = d3.scaleOrdinal()
            .domain(selected_key)
            .range(opacity_scales)

        let stackedData = stack(dataset);

        //scales - xScale is a linear scale of the years
        const xScale = d3.scaleLinear()
            .domain([d3.min(dataset, d => d.month), d3.max(dataset, d => d.month)]) //If I make this stackedData it breaks!
            .range([margin.left, width - margin.right]);

        //yScale is a linear scale with a minimum value of 0 and a maximum bsed on the total population maximum
        const yScale = d3.scaleLinear()
            .domain([0, d3.max(dataset, d => d["value"] + d["value_above"] + d["value_below"] + d["value_below_adj"])])
            .range([height - margin.bottom, margin.top]);

        //draw the areas
        svg.selectAll(series)
            .data(stackedData)
            .enter()
            .append("path")
            .attr("class", series)
            .style("opacity", 0.1)
            .merge(path)
            .transition()
            .duration(500)
            .attr("fill", (d) => colorScale(d.key))
            .attr("d", d3.area()
                .x((d, i) => {
                    return xScale(d.data.month);
                })
                //the starting and ending points for each section of the stack
                .y1(d => yScale(d[0]))
                .y0(d => yScale(d[1]))
            )
            .style("opacity", (d) => opacityScale(d.key))

        svg.selectAll(series)
            .data(stackedData)
            .enter()
            .append("line")
            .attr("class", "avg_line")
            .merge(line)
            .attr("x1", xScale(d3.min(dataset, d => d.month)))
            .attr("x2", xScale(d3.max(dataset, d => d.month)))
            .attr("y1", yScale(d3.min(dataset, d => d.monthly_avg)))
            .attr("y2", yScale(d3.max(dataset, d => d.monthly_avg)))
            .attr("stroke", "#0c0c8a")
            .attr("stroke-width", 7);

        svg.selectAll(series)
            .data(stackedData)
            .enter()
            .append("line")
            .attr("class", "cases_confirmed")
            .merge(line)
            .transition()
            .duration(500)
            .attr("x1", xScale(1.5))
            .attr("x2", xScale(1.5))
            .attr("y1", yScale(0))
            .attr("y2", yScale(500))
            .attr("stroke", "#bd2439")
            .attr("stroke-width", 5);

        svg.selectAll(series)
            .data(stackedData)
            .enter()
            .append("line")
            .attr("class", "covid_start_line")
            .merge(line)
            .transition()
            .attr("x1", xScale(3.5))
            .attr("x2", xScale(3.5))
            .attr("y1", yScale(0))
            .attr("y2", yScale(500))
            .attr("stroke", "#cf276a")
            .attr("stroke-width", 5);

        svg.selectAll(series)
            .data(stackedData)
            .enter()
            .append("line")
            .attr("class", "covid_restrict_end_line")
            .merge(line)
            .transition()
            .duration(500)
            .attr("x1", xScale(4.9))
            .attr("x2", xScale(4.9))
            .attr("y1", yScale(0))
            .attr("y2", yScale(500))
            .attr("stroke", "#858894")
            .attr("stroke-width", 5);

        const type = d3.annotationLabel

        const line_annot = [{
            note: {
                title: "Ten Year Historical Import Average",
                wrap: 200,
                padding: 20,
            },
            connector: {
                end: "dot",        // Can be none, or arrow or dot
                endScale: 10     // dot size
            },
            color: '#0c0c8a',
            x: 800,
            y: 175,
            dy: 50,
            dx: 70
        }]

        const makeAnnotations = d3.annotation()
            .annotations(line_annot)

        d3.select("svg")
            .append("g")
            .attr("class", "avg_line_comment")
            .call(makeAnnotations)

        console.log(makeAnnotations)

        const deficit1_note = [{
            note: {
                title: "Shorfall Relative to Annual Average",
                label: "Significant shortfalls in beginning 2020",
                padding: 10,
                wrap: 400,
            },
            connector: {
                end: "dot",        // Can be none, or arrow or dot
                endScale: 10         // dot size
            },
            color: '#ffffff',
            x: 550,
            y: 255,
            dy: 50,
            dx: 70
        }]



        const makeAnnotations1 = d3.annotation()
            .annotations(deficit1_note)

        d3.select("svg")
            .append("g")
            .attr("class", "deficit1_note")
            .call(makeAnnotations1)

        console.log(makeAnnotations1)

        const surplus_note = [{
            note: {
                title: "Trading Surpluses in EOY2020",
                padding: 10,
                wrap: 400,
            },
            connector: {
                end: "dot",        // Can be none, or arrow or dot
                endScale: 10         // dot size
            },
            color: '#209936',
            x: 1000,
            y: 140,
            dy: -50,
            dx: -70
        }]

        const makeAnnotations2 = d3.annotation()
            .annotations(surplus_note)

        d3.select("svg")
            .append("g")
            .attr("class", "surplus_note")
            .call(makeAnnotations2)

        const adjustment_note = [{
            note: {
                title: "Shortfalls Adjusted Down",
                label: "(at the Surplus Quantity)",
                padding: 10,
                wrap: 500,
            },
            connector: {
                end: "dot",        // Can be none, or arrow or dot
                endScale: 3         // dot size
            },
            color: '#98b39c',
            x: 650,
            y: 190,
            dy: -60,
            dx: 50
        }]

        const makeAnnotations3 = d3.annotation()
            .annotations(adjustment_note)

        d3.select("svg")
            .append("g")
            .attr("class", "adjustment_note")
            .call(makeAnnotations3)

        const final_reduction_note = [{
            note: {
                title: "Seasonally Adjusted U.S. Import Shortfalls",
                padding: 10,
                wrap: 300,
            },
            connector: {
                end: "dot",        // Can be none, or arrow or dot
                endScale: 3         // dot size
            },
            color: 'white',
            x: 600,
            y: 250,
            dy: 60,
            dx: 50
        }]

        const makeAnnotations4 = d3.annotation()
            .annotations(final_reduction_note)

        d3.select("svg")
            .append("g")
            .attr("class", "final_reduction_note")
            .call(makeAnnotations4)

        const covid1_note = [{
            note: {
                title: "January 20",
                label: "First U.S. case of COVID-19",
                padding: 10,
                wrap: 200,
            },
            connector: {
                end: "dot",        // Can be none, or arrow or dot
                endScale: 3         // dot size
            },
            color: '#db256e',
            x: 200  ,
            y: 250,
            dy: 40,
            dx: 20
        }]

        const makeAnnotations5 = d3.annotation()
            .annotations(covid1_note)

        d3.select("svg")
            .append("g")
            .attr("class", "covid1_note")
            .call(makeAnnotations5)

        const covid2_note = [{
            note: {
                title: "March 15",
                label: "U.S. States Start to Set Restrictions",
                padding: 10,
                wrap: 200,
            },
            connector: {
                end: "dot",        // Can be none, or arrow or dot
                endScale: 3         // dot size
            },
            color: '#db256e',
            x: 393,
            y: 250,
            dy: -50,
            dx: 30
        }]

        const makeAnnotations6 = d3.annotation()
            .annotations(covid2_note)

        d3.select("svg")
            .append("g")
            .attr("class", "covid2_note")
            .call(makeAnnotations6)

        const covid3_note = [{
            note: {
                title: "March 28",
                label: "Most U.S. States Begin to Lift Restrictions",
                padding: 10,
                wrap: 220,
            },
            connector: {
                end: "dot",        // Can be none, or arrow or dot
                endScale: 3         // dot size
            },
            color: '#858894',
            x: 530,
            y: 250,
            dy: 0,
            dx: 80
        }]

        const makeAnnotations7 = d3.annotation()
            .annotations(covid3_note)

        d3.select("svg")
            .append("g")
            .attr("class", "covid3_note")
            .call(makeAnnotations7)


        //axis updates
        xAxis.transition().duration(500).call(d3.axisBottom().scale(xScale));
        yAxis.transition().duration(500).call(d3.axisLeft().scale(yScale).tickFormat(d3.format(".2s")));

    }


    //buttons handles switching between datasets
    function start() {
        d3.selectAll(".series2").remove();
        d3.selectAll(".series3").remove();
        d3.selectAll(".series4").remove();
        d3.selectAll(".series5").remove();
        d3.selectAll(".series6").remove();
        draw(cotton_only, raw, raw_colors, series1, opacity_scale1);
        d3.selectAll(".avg_line").remove();
        d3.selectAll(".adjustment_note").remove();
        d3.selectAll(".final_reduction_note").remove();
        d3.selectAll(".avg_line_comment").remove();
        d3.selectAll(".surplus_note").remove();
        d3.selectAll(".deficit1_note").remove();
        d3.selectAll(".cases_confirmed").remove();
        d3.selectAll(".covid_start_line").remove();
        d3.selectAll(".covid_restrict_end_line").remove();
        d3.selectAll(".covid1_note").remove();
        d3.selectAll(".covid2_note").remove();
        d3.selectAll(".covid3_note").remove();
    }


    function sec_1() {
        d3.selectAll(".series2").remove();
        d3.selectAll(".series3").remove();
        d3.selectAll(".series4").remove();
        d3.selectAll(".series5").remove();
        d3.selectAll(".series6").remove();
        draw(cotton_only, raw, raw_colors, series1, opacity_scale1);
        d3.selectAll(".surplus_note").remove();
        d3.selectAll(".final_reduction_note").remove();
        d3.selectAll(".adjustment_note").remove();
        d3.selectAll(".deficit1_note").remove();
        d3.selectAll(".cases_confirmed").remove();
        d3.selectAll(".covid_start_line").remove();
        d3.selectAll(".covid_restrict_end_line").remove();
        d3.selectAll(".covid1_note").remove();
        d3.selectAll(".covid2_note").remove();
        d3.selectAll(".covid3_note").remove();
    }

    function sec_2() {
        d3.selectAll(".series1").remove();
        d3.selectAll(".series3").remove();
        d3.selectAll(".series4").remove();
        d3.selectAll(".series5").remove();
        d3.selectAll(".series6").remove();
        draw(cotton_only, below, below_colors, series2, opacity_scale2);
        d3.selectAll(".avg_line").remove();
        d3.selectAll(".final_reduction_note").remove();
        d3.selectAll(".adjustment_note").remove();
        d3.selectAll(".avg_line_comment").remove();
        d3.selectAll(".series1").remove();
        d3.selectAll(".surplus_note").remove();
        d3.selectAll(".cases_confirmed").remove();
        d3.selectAll(".covid_start_line").remove();
        d3.selectAll(".covid_restrict_end_line").remove();
        d3.selectAll(".covid1_note").remove();
        d3.selectAll(".covid2_note").remove();
        d3.selectAll(".covid3_note").remove();
    }

    function sec_3() {
        d3.selectAll(".series1").remove();
        d3.selectAll(".series2").remove();
        d3.selectAll(".series4").remove();
        d3.selectAll(".series5").remove();
        d3.selectAll(".series6").remove();
        draw(cotton_only, pre_adjustment, pre_adjustment_colors, series3, opacity_scale3);
        d3.selectAll(".avg_line").remove();
        d3.selectAll(".avg_line_comment").remove();
        d3.selectAll(".final_reduction_note").remove();
        d3.selectAll(".adjustment_note").remove();
        d3.selectAll(".deficit1_note").remove();
        d3.selectAll(".series1").remove();
        d3.selectAll(".series2").remove();
        d3.selectAll(".cases_confirmed").remove();
        d3.selectAll(".covid_start_line").remove();
        d3.selectAll(".covid_restrict_end_line").remove();
        d3.selectAll(".covid1_note").remove();
        d3.selectAll(".covid2_note").remove();
        d3.selectAll(".covid3_note").remove();
    }

    function sec_4() {
        d3.selectAll(".series1").remove();
        d3.selectAll(".series2").remove();
        d3.selectAll(".series3").remove();
        d3.selectAll(".series5").remove();
        d3.selectAll(".series6").remove();
        draw(cotton_only, pre_adjustment_2, pre_adjustment_2_colors, series4, opacity_scale4);
        d3.selectAll(".avg_line").remove();
        d3.selectAll(".avg_line_comment").remove();
        d3.selectAll(".deficit1_note").remove();
        d3.selectAll(".surplus_note").remove();
        d3.selectAll(".final_reduction_note").remove();
        d3.selectAll(".series1").remove();
        d3.selectAll(".series2").remove();
        d3.selectAll(".series3").remove();
        d3.selectAll(".cases_confirmed").remove();
        d3.selectAll(".covid_start_line").remove();
        d3.selectAll(".covid_restrict_end_line").remove();
        d3.selectAll(".covid1_note").remove();
        d3.selectAll(".covid2_note").remove();
        d3.selectAll(".covid3_note").remove(); 
        }

        function sec_5() { 
            d3.selectAll(".series1").remove();
            d3.selectAll(".series2").remove();
            d3.selectAll(".series3").remove();
            d3.selectAll(".series4").remove();
            d3.selectAll(".series6").remove();
            draw(cotton_only, adjustment, adjustment_colors, series5, opacity_scale5);
            d3.selectAll(".deficit1_note").remove();
            d3.selectAll(".surplus_note").remove();
            d3.selectAll(".avg_line_comment").remove();
            d3.selectAll(".avg_line").remove();
            d3.selectAll(".series1").remove();
            d3.selectAll(".series2").remove();
            d3.selectAll(".series3").remove();
            d3.selectAll(".series4").remove();
            d3.selectAll(".cases_confirmed").remove();
            d3.selectAll(".covid_start_line").remove();
            d3.selectAll(".covid_restrict_end_line").remove();
            d3.selectAll(".covid1_note").remove();
            d3.selectAll(".covid2_note").remove();
            d3.selectAll(".covid3_note").remove();
            d3.selectAll(".adjustment_note").remove();
        }

        function sec_6() { 
            d3.selectAll(".series1").remove();
            d3.selectAll(".series2").remove();
            d3.selectAll(".series3").remove();
            d3.selectAll(".series4").remove();
            d3.selectAll(".series5").remove();
            draw(cotton_only, deficit, deficit_colors, series6, opacity_scale6);
            d3.selectAll(".avg_line").remove();
            d3.selectAll(".final_reduction_note").remove();
            d3.selectAll(".adjustment_note").remove();
            d3.selectAll(".deficit1_note").remove();
            d3.selectAll(".surplus_note").remove();
            d3.selectAll(".avg_line_comment").remove();
        }

        var gs = d3.graphScroll()
            .container(d3.select('#container'))
            .graph(d3.selectAll('#graph'))
            .sections(d3.selectAll('#sections > div'))
            .eventId('uniqueId1')
            .on('active', function (i) {

                console.log(i);

                [
                    start,
                    sec_1,
                    sec_2,
                    sec_3,
                    sec_4,
                    sec_5,
                    sec_6
                ][i]();

            });
    })


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
        value_below_adj: +d.value_below_adj,
        value_net_above: +d.value_net_above,
        average_net_adjusted: +d.average_net_adjusted
    }
}


import React, {Component} from "react";
import * as d3 from "d3";

class Child1 extends Component
{
    componentDidMount()
    {
        if (this.props.csv_data.length > 0)
            this.renderStreamGraph();
    }

    componentDidUpdate(prevProps)
    {
        if (prevProps.csv_data !== this.props.csv_data)
            this.renderStreamGraph();
    }

    renderStreamGraph()
    {
        let data = this.props.csv_data;

        const aiModels = ["GPT-4", "Gemini", "PaLM-2", "Claude", "LLaMA-3.1"];
        const colors = ["#e41a1c", "#377eb8", "#4daf4a", "#984ea3", "#ff7f00"];

        const margin = {
            top: 20,
            right: 150,
            bottom: 50,
            left: 50
        };

        const width = 800 - margin.left - margin.right;
        const height = 400 - margin.top - margin.bottom;

        const svg = d3
            .select(".chart")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const stack = d3
            .stack()
            .keys(aiModels)
            .order(d3.stackOrderNone)
            .offset(d3.stackOffsetWiggle);

        const layers = stack(data);

        const x = d3
            .scaleTime()
            .domain(d3.extent(data, (d) => d.Date))
            .range([0, width]);

        const y = d3
            .scaleLinear()
            .domain([
                d3.min(layers, (layer) => d3.min(layer, (d) => d[0])),
                d3.max(layers, (layer) => d3.max(layer, (d) => d[1])),
            ])
            .range([height, 0]);

        const area = d3
            .area()
            .x((d) => x(d.data.Date))
            .y0((d) => y(d[0]))
            .y1((d) => y(d[1]))
            .curve(d3.curveBasis);

        svg.selectAll(".layer")
            .data(layers)
            .enter()
            .append("path")
            .attr("class", "layer")
            .attr("d", area)
            .style("fill", (d, i) => colors[i]);

        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(
                d3
                    .axisBottom(x)
                    .ticks(d3.timeMonth.every(1))
                    .tickFormat(d3.timeFormat("%b"))
            )
            .selectAll("text")
            .style("text-anchor", "middle")
            .style("font-size", "12px");

        svg.append("g")
            .call(d3.axisLeft(y).ticks(0))
            .style("opacity", 0);

        const tooltip = d3.select(".tooltip");

        const getEndOfMonth = (date) =>
        {
            const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
            return new Date(Date.UTC(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate(), 23, 59, 59));
        }

        svg.selectAll(".layer")
            .on("mousemove", (event, layer) =>
            {
                const [xPosition] = d3.pointer(event);
                const hoveredDate = x.invert(xPosition);

                const normalizedHoveredDate = getEndOfMonth(hoveredDate);

                const threshold = 24 * 60 * 60 * 1000;

                const hoveredData = layer.find((d) =>
                {
                    const dataDate = getEndOfMonth(d.data.Date);

                    const timeDiff = Math.abs(normalizedHoveredDate - dataDate);
                    return timeDiff <= threshold;
                });

                if (hoveredData)
                {
                    const modelIndex = layers.indexOf(layer);
                    const model = aiModels[modelIndex];
                    const count = hoveredData.data[model];

                    const miniBarData = aiModels.map((m) => ({
                        model: m,
                        count: hoveredData.data[m],
                    }));

                    tooltip
                        .style("opacity", 1)
                        .style("left", `${event.pageX + 15}px`)
                        .style("top", `${event.pageY - 90}px`);

                    tooltip.select(".mini-bar-chart").remove();

                    const miniChart = tooltip
                        .append("svg")
                        .attr("class", "mini-bar-chart")
                        .attr("width", 120)
                        .attr("height", 80);

                    const miniX = d3
                        .scaleBand()
                        .domain(miniBarData.map((d) => d.model))
                        .range([0, 120])
                        .padding(0.2);

                    const miniY = d3
                        .scaleLinear()
                        .domain([0, d3.max(miniBarData, (d) => d.count)])
                        .range([70, 0]);

                    miniChart
                        .selectAll("rect")
                        .data(miniBarData)
                        .enter()
                        .append("rect")
                        .attr("x", (d) => miniX(d.model))
                        .attr("y", (d) => miniY(d.count))
                        .attr("width", miniX.bandwidth())
                        .attr("height", (d) => 70 - miniY(d.count))
                        .attr("fill", (d, i) => colors[i]);

                    miniChart
                        .append("g")
                        .attr("transform", "translate(0,70)")
                        .call(d3.axisBottom(miniX).tickSize(0));

                    miniChart.append("g").call(d3.axisLeft(miniY).ticks(3).tickSize(0));
                } else
                {
                    tooltip.style("opacity", 0);
                }
            })
            .on("mouseout", () =>
            {
                tooltip.style("opacity", 0).select(".mini-bar-chart").remove();
            });

        const legend = svg.append("g").attr("transform", `translate(${width + 20}, 10)`);

        aiModels.forEach((key, i) =>
        {
            const legendRow = legend.append("g").attr("transform", `translate(0,${i * 20})`);

            legendRow.append("rect")
                .attr("width", 15)
                .attr("height", 15)
                .attr("fill", colors[i]);

            legendRow.append("text")
                .attr("x", 20)
                .attr("y", 12)
                .style("text-anchor", "start")
                .style("font-size", "12px")
                .text(key);
        });
    }

    render()
    {
        return (
            <div>
                <svg className="chart"></svg>
                <div className="tooltip"></div>
            </div>
        );
    }
}

export default Child1;

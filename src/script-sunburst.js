import { select } from "d3-selection";
import { partition as d3partition, hierarchy as d3hierarchy } from "d3-hierarchy";
import { arc as d3arc } from "d3-shape";
import { scaleLinear, scaleSqrt } from "d3-scale";
import { format as formatBytes } from "bytes";

import color from "./color";

import "./style/style-sunburst.scss";

const WIDTH = window.chartParameters.width || 700;
const HEIGHT = window.chartParameters.height || 700;
const RADIUS = Math.min(WIDTH, HEIGHT) / 2 - 10;

const x = scaleLinear().range([0, 2 * Math.PI]);
const y = scaleSqrt().range([0, RADIUS]);

const mainContainer = document.querySelector("main");

for (const data of window.nodesData) {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div class="chart">
      <div class="details" style="display: none;">
        <div class="details-name" ></div>
        <div class="details-percentage" ></div>
        of bundle size
        <div class="details-size" ></div>
      </div>
    </div>
    `;
  const chartNode = wrapper.querySelector(".chart");
  mainContainer.appendChild(chartNode);

  const g = select(chartNode)
    .append("svg")
    .attr("viewBox", [0, 0, WIDTH, HEIGHT])
    .append("g")
    .attr("transform", `translate(${WIDTH / 2},${HEIGHT / 2})`);

  const root = d3hierarchy(data)
    .sum(d => {
      if (d.children && d.children.length) {
        return 0;
      } else {
        return d.size;
      }
    })
    .sort();

  const arc = d3arc()
    .startAngle(d => Math.max(0, Math.min(2 * Math.PI, x(d.x0))))
    .endAngle(d => Math.max(0, Math.min(2 * Math.PI, x(d.x1))))
    .innerRadius(d => y(d.y0))
    .outerRadius(d => y(d.y1));

  const partition = d3partition();

  partition(root);

  const showDetails = d => {
    const percentageNum = (100 * d.value) / totalSize;
    const percentage = percentageNum.toFixed(2);
    const percentageString = percentage + "%";

    select(chartNode)
      .select(".details-name")
      .text(d.data.name);

    select(chartNode)
      .select(".details-percentage")
      .text(percentageString);

    select(chartNode)
      .select(".details-size")
      .text(formatBytes(d.value));

    select(chartNode)
      .select(".details")
      .style("display", "block");
  };

  g.selectAll("path")
    .data(partition(root).descendants())
    .enter()
    .append("path")
    .attr("d", arc)
    .attr("fill-rule", "evenodd")
    .style("stroke", "#fff")
    .style("fill", d => color(d))
    .on("mouseover", d => {
      showDetails(d);

      const sequenceArray = d.ancestors();
      //updateBreadcrumbs(sequenceArray, percentageString);

      // Fade all the segments.
      g.selectAll("path").style("opacity", 0.3);

      // Then highlight only those that are an ancestor of the current segment.
      g.selectAll("path")
        .filter(node => sequenceArray.indexOf(node) >= 0)
        .style("opacity", 1);
    });

  const totalSize = root.value;

  select(chartNode).on("mouseleave", () => {
    g.selectAll("path").style("opacity", 1);

    select(".details").style("display", "none");
  });

  showDetails(root);
}

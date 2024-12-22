let mobileExists = false,
  desktopExists = false;

function checkIfGraphNeeded() {
  if (window.innerWidth < 640 && !mobileExists) {
    mobileExists = true;
    makeGraph("chart-container-mobile");
  } else if (window.innerWidth > 640 && !desktopExists) {
    desktopExists = true;
    makeGraph("chart-container");
  }
}

function makeGraph(containerId) {
  const container = document.getElementById(containerId);
  const width = container.clientWidth;
  const height = container.clientHeight;

  const nodeRadius = 8;
  const defaultNodeColor = "#B8B8B8";
  const highlighedNodeColor = "#294B63";
  const defaultEdgeColor = "#E5E5E5";

  const svg = d3
    .select(`#${containerId}`)
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .style("background-color", "#FAF8F8")
    .style("cursor", "move");

  const g = svg.append("g");

  const zoom = d3
    .zoom()
    .scaleExtent([0.1, 4])
    .on("zoom", (event) => {
      g.attr("transform", event.transform);
    });

  svg.call(zoom);

  const tooltip = d3
    .select("body")
    .append("div")
    .attr(
      "class",
      "bg-navy-400 px-2 text-sm font-latinMonoCondOblique text-white rounded-sm"
    )
    .style("opacity", 0)
    .style("position", "fixed");

  webringData.sites.forEach((site, index) => {
    site.id = `node-${index}`;
  });

  const simulation = d3
    .forceSimulation()
    .force(
      "link",
      d3
        .forceLink()
        .id((d) => d.id)
        .distance(100)
    ) // Increased from 50 to 100
    .force("charge", d3.forceManyBody().strength(-100)) // Increased repulsion from -100 to -200
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collision", d3.forceCollide().radius(nodeRadius * 2)) // Increased from 1.2 to 2
    .alphaDecay(0.02) // Increased from 0.01 to 0.02 for less momentum
    .velocityDecay(0.4); // Increased from 0.3 to 0.4 for more damping

  const links = webringData.sites.map((site, index) => ({
    source: site.id,
    target: webringData.sites[(index + 1) % webringData.sites.length].id,
  }));

  const link = g
    .append("g")
    .selectAll("line")
    .data(links)
    .enter()
    .append("line")
    .attr("stroke", defaultEdgeColor)
    .attr("stroke-opacity", 1)
    .attr("stroke-width", 1);

  const node = g
    .append("g")
    .selectAll("g")
    .data(webringData.sites)
    .enter()
    .append("g")
    .call(
      d3
        .drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
    );

  node
    .append("circle")
    .attr("r", nodeRadius)
    .attr("fill", defaultNodeColor)
    .on("mouseover", handleMouseOver)
    .on("mouseout", handleMouseOut)
    .on("click", handleClick);

  simulation.nodes(webringData.sites).on("tick", ticked);

  simulation.force("link").links(links);

  // Add fitToView function definition earlier
  function fitToView() {
    let minX = Infinity,
      minY = Infinity;
    let maxX = -Infinity,
      maxY = -Infinity;

    node.each((d) => {
      minX = Math.min(minX, d.x);
      minY = Math.min(minY, d.y);
      maxX = Math.max(maxX, d.x);
      maxY = Math.max(maxY, d.y);
    });

    const padding = 50;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scale = Math.min(width / (maxX - minX), height / (maxY - minY)) * 0.7; // Reduced from 0.9 to 0.7 for a more zoomed-out view

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    svg
      .transition()
      .duration(750)
      .call(
        zoom.transform,
        d3.zoomIdentity
          .translate(width / 2, height / 2)
          .scale(scale)
          .translate(-centerX, -centerY)
      );
  }

  function ticked() {
    link
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);
    node.attr("transform", (d) => `translate(${d.x},${d.y})`);
  }

  function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    svg.style("cursor", "grabbing");
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    svg.style("cursor", "grab");
    d.fx = null;
    d.fy = null;
  }

  function handleMouseOver(event, d) {
    d3.select(this).attr("fill", highlighedNodeColor);

    svg.style("cursor", "pointer");
    const trimmedUrl = d.website.replace(/^https?:\/\//, "");
    tooltip.transition().duration(200).style("opacity", 0.9);
    tooltip
      .html(trimmedUrl)
      .style("left", event.pageX + 20 + "px")
      .style("top", event.pageY - 20 + "px")
      .style("z-index", "30");
  }

  function handleMouseOut(event, d) {
    d3.select(this).attr("fill", getNodeColor(d));
    svg.style("cursor", "move");
    tooltip.transition().duration(500).style("opacity", 0);
  }

  function handleClick(event, d) {
    window.open(d.website, "_blank");
  }

  function getNodeColor(d) {
    const searchInput = document.getElementById("search");
    const searchTerm = searchInput.value.toLowerCase();

    if (searchTerm === "") {
      return defaultNodeColor;
    } else {
      return d.name.toLowerCase().includes(searchTerm) ||
        d.year.toString().includes(searchTerm) ||
        d.website.toLowerCase().includes(searchTerm)
        ? highlighedNodeColor
        : defaultNodeColor;
    }
  }

  // Update node colors when search input changes
  document.getElementById("search").addEventListener("input", (e) => {
    highlightAndZoomToNodes(e.target.value);
  });

  // Add this function near the top of the file
  function highlightAndZoomToNodes(searchTerm) {
    searchTerm = searchTerm.toLowerCase();

    // Highlight nodes
    node.selectAll("circle").attr("fill", (d) => {
      if (searchTerm === "") {
        return defaultNodeColor;
      }
      const matches =
        d.name.toLowerCase().includes(searchTerm) ||
        d.year.toString().includes(searchTerm) ||
        d.website.toLowerCase().includes(searchTerm);
      return matches ? highlighedNodeColor : defaultNodeColor;
    });

    // Count total and highlighted nodes
    const totalNodes = webringData.sites.length;
    const highlightedNodes = searchTerm
      ? node
          .filter(
            (d) =>
              d.name.toLowerCase().includes(searchTerm) ||
              d.year.toString().includes(searchTerm) ||
              d.website.toLowerCase().includes(searchTerm)
          )
          .size()
      : 0;

    // Update stats display
    const statsText = searchTerm
      ? `Sites: ${totalNodes} | Highlighted: ${highlightedNodes}`
      : `Sites: ${totalNodes}`;

    const statsDisplay = svg.select("#stats-display");
    statsDisplay.text(statsText);

    // Update background width based on text
    const textWidth = statsDisplay.node().getComputedTextLength();
    const statsBackground = svg.select("#stats-background");
    statsBackground.attr("width", textWidth + 20).attr("height", 25);

    if (searchTerm) {
      // Find matching nodes
      const matchingNodes = node.filter(
        (d) =>
          d.name.toLowerCase().includes(searchTerm) ||
          d.year.toString().includes(searchTerm) ||
          d.website.toLowerCase().includes(searchTerm)
      );

      if (matchingNodes.size() > 0) {
        // Calculate bounds for zooming
        let minX = Infinity,
          minY = Infinity;
        let maxX = -Infinity,
          maxY = -Infinity;

        matchingNodes.each((d) => {
          minX = Math.min(minX, d.x);
          minY = Math.min(minY, d.y);
          maxX = Math.max(maxX, d.x);
          maxY = Math.max(maxY, d.y);
        });

        const padding = 100;
        minX -= padding;
        minY -= padding;
        maxX += padding;
        maxY += padding;

        const scale =
          Math.min(width / (maxX - minX), height / (maxY - minY)) * 0.9;

        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        // Zoom to the matching nodes
        svg
          .transition()
          .duration(750)
          .call(
            zoom.transform,
            d3.zoomIdentity
              .translate(width / 2, height / 2)
              .scale(scale)
              .translate(-centerX, -centerY)
          );
      }
    } else {
      fitToView(); // Reset view if no search term
    }
  }
  // Add a hash change listener
  window.addEventListener("hashchange", () => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      setTimeout(() => {
        highlightAndZoomToNodes(decodeURIComponent(hash));
      }, 2000);
    }
  });

  // Handle initial hash on load
  if (window.location.hash) {
    const hash = window.location.hash.slice(1);
    setTimeout(() => {
      highlightAndZoomToNodes(decodeURIComponent(hash));
    }, 2000);
  }

  // Call fitToView after simulation has settled a bit
  simulation.on("tick", () => {
    ticked();
    if (simulation.alpha() < 0.1) {
      simulation.alphaTarget(0);
      fitToView();
      simulation.on("tick", ticked); // Reset to just ticking
    }
  });

  // Resize handler
  window.addEventListener("resize", () => {
    const newWidth = container.clientWidth;
    const newHeight = container.clientHeight;
    svg.attr("viewBox", `0 0 ${newWidth} ${newHeight}`);

    // Update stats position
    statsDisplay.attr("y", newHeight - 10);
    statsBackground.attr("y", newHeight - 30);

    simulation.force("center", d3.forceCenter(newWidth / 2, newHeight / 2));
    simulation.alpha(0.3).restart();
  });

  // After creating the svg but before creating the g element
  const statsDisplay = svg
    .append("text")
    .attr("class", "font-latinMonoCondOblique italic")
    .attr("id", "stats-display")
    .attr("x", 10)
    .attr("y", height - 13)
    .attr("fill", "white")
    .attr("font-size", "1rem");

  // Create a background rectangle for the stats
  const statsBackground = svg
    .append("rect")
    .attr("id", "stats-background")
    .attr("fill", "#4F587C")
    .attr("opacity", 0.5)
    .attr("x", 5)
    .attr("y", height - 30)
    .attr("rx", 5)
    .attr("ry", 5);

  // Move both elements to front
  statsBackground.raise();
  statsDisplay.raise();

  // After creating the statsDisplay and statsBackground elements
  // Initialize the stats display with total number of sites
  const totalNodes = webringData.sites.length;
  statsDisplay.text(`Sites: ${totalNodes}`);

  // Set initial background width based on text
  const textWidth = statsDisplay.node().getComputedTextLength();
  statsBackground.attr("width", textWidth + 20).attr("height", 25);
}

document.addEventListener("DOMContentLoaded", checkIfGraphNeeded);
window.addEventListener("resize", checkIfGraphNeeded);

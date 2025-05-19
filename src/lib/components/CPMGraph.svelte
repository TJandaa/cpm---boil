<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import * as d3 from 'd3';
  import type { Task, CPMResult } from '$lib/types/project';

  export let tasks: Task[] = [];
  export let cpmResults: Record<string, CPMResult> = {};
  export let criticalPath: string[] = [];

  let container: HTMLElement;
  let svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  let simulation: d3.Simulation<GraphNode, GraphLink> | null = null;
  let width = 800;
  let height = 600;

  interface GraphNode extends d3.SimulationNodeDatum {
    id: string;
    label: string;
    duration: number;
    es: number;
    ef: number;
    ls: number;
    lf: number;
    slack: number;
    isCritical: boolean;
  }

  interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
    id: string;
    source: string | GraphNode;
    target: string | GraphNode;
    isCritical: boolean;
  }

  let graphNodes: GraphNode[] = [];
  let graphLinks: GraphLink[] = [];

  onMount(() => {
    if (tasks.length > 0 && Object.keys(cpmResults).length > 0) {
      createGraph();
      drawGraph();
    }
  });

  onDestroy(() => {
    if (simulation) {
      simulation.stop();
    }
  });

  function createGraph() {
    // Create nodes from tasks
    graphNodes = tasks.map(task => {
      const result = cpmResults[task.id];
      const isCritical = criticalPath.includes(task.id);
      return {
        id: task.id,
        label: task.name,
        duration: task.duration,
        es: result?.earliestStart || 0,
        ef: result?.earliestFinish || 0,
        ls: result?.latestStart || 0,
        lf: result?.latestFinish || 0,
        slack: result?.slack || 0,
        isCritical
      };
    });

    // Create links from dependencies
    graphLinks = [];
    tasks.forEach(task => {
      task.dependencies.forEach(depId => {
        const isCritical = criticalPath.includes(depId) && criticalPath.includes(task.id);
        graphLinks.push({
          id: `${depId}-${task.id}`,
          source: depId,
          target: task.id,
          isCritical
        });
      });
    });
  }

  function drawGraph() {
    if (!container) return;

    // Clear previous graph
    d3.select(container).selectAll('*').remove();

    // Get container dimensions
    const rect = container.getBoundingClientRect();
    width = rect.width || 800;
    height = rect.height || 600;

    // Create SVG element
    svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Create main group for zoom/pan
    const g = svg.append('g');

    // Define arrow markers
    svg.append('defs').selectAll('marker')
      .data(['arrow', 'arrow-critical'])
      .enter()
      .append('marker')
      .attr('id', d => d)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 15)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', d => d === 'arrow-critical' ? '#dc3545' : '#999');

    // Create force simulation
    simulation = d3.forceSimulation<GraphNode>(graphNodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(graphLinks)
        .id(d => d.id)
        .distance(150))
      .force('charge', d3.forceManyBody().strength(-1000))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide().radius(70));

    // Create links
    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(graphLinks)
      .enter()
      .append('line')
      .attr('stroke', d => d.isCritical ? '#dc3545' : '#999')
      .attr('stroke-width', d => d.isCritical ? 3 : 1.5)
      .attr('marker-end', d => d.isCritical ? 'url(#arrow-critical)' : 'url(#arrow)');

    // Create node groups
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('.node')
      .data(graphNodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .call(drag(simulation));

    // Node rectangles
    node.append('rect')
      .attr('width', 120)
      .attr('height', 80)
      .attr('x', -60)
      .attr('y', -40)
      .attr('rx', 5)
      .attr('fill', d => d.isCritical ? '#fff3cd' : '#f8f9fa')
      .attr('stroke', d => d.isCritical ? '#dc3545' : '#6c757d')
      .attr('stroke-width', d => d.isCritical ? 2 : 1);

    // Task name
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', -20)
      .attr('font-weight', 'bold')
      .attr('font-size', '12px')
      .text(d => d.label.length > 12 ? d.label.substring(0, 12) + '...' : d.label);

    // Task ID
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', -5)
      .attr('font-size', '10px')
      .attr('fill', '#666')
      .text(d => `ID: ${d.id}`);

    // Duration
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', 10)
      .attr('font-size', '11px')
      .text(d => `Duration: ${d.duration}`);

    // ES and EF
    node.append('text')
      .attr('text-anchor', 'start')
      .attr('x', -55)
      .attr('y', 25)
      .attr('font-size', '10px')
      .attr('fill', '#666')
      .text(d => `ES: ${d.es}`);

    node.append('text')
      .attr('text-anchor', 'end')
      .attr('x', 55)
      .attr('y', 25)
      .attr('font-size', '10px')
      .attr('fill', '#666')
      .text(d => `EF: ${d.ef}`);

    // LS and LF
    node.append('text')
      .attr('text-anchor', 'start')
      .attr('x', -55)
      .attr('y', 37)
      .attr('font-size', '10px')
      .attr('fill', '#666')
      .text(d => `LS: ${d.ls}`);

    node.append('text')
      .attr('text-anchor', 'end')
      .attr('x', 55)
      .attr('y', 37)
      .attr('font-size', '10px')
      .attr('fill', '#666')
      .text(d => `LF: ${d.lf}`);

    // Slack (centered at bottom)
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', 37)
      .attr('font-size', '10px')
      .attr('fill', d => d.slack === 0 ? '#dc3545' : '#666')
      .attr('font-weight', d => d.slack === 0 ? 'bold' : 'normal')
      .text(d => `Slack: ${d.slack}`);

    // Add title for hover information
    node.append('title')
      .text(d => `Task: ${d.label}
ID: ${d.id}
Duration: ${d.duration}
Early Start: ${d.es}
Early Finish: ${d.ef}
Late Start: ${d.ls}
Late Finish: ${d.lf}
Slack: ${d.slack}
Critical Path: ${d.isCritical ? 'Yes' : 'No'}`);

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as GraphNode).x!)
        .attr('y1', d => (d.source as GraphNode).y!)
        .attr('x2', d => (d.target as GraphNode).x!)
        .attr('y2', d => (d.target as GraphNode).y!);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Auto-zoom to fit content
    setTimeout(() => {
      const bounds = g.node()?.getBBox();
      if (bounds) {
        const fullWidth = bounds.width;
        const fullHeight = bounds.height;
        const midX = bounds.x + fullWidth / 2;
        const midY = bounds.y + fullHeight / 2;
        
        const scale = 0.9 / Math.max(fullWidth / width, fullHeight / height);
        const translate = [width / 2 - scale * midX, height / 2 - scale * midY];
        
        svg.transition()
          .duration(750)
          .call(zoom.transform, d3.zoomIdentity
            .translate(translate[0], translate[1])
            .scale(scale));
      }
    }, 500);
  }

  // Drag behavior for nodes
  function drag(simulation: d3.Simulation<GraphNode, GraphLink>) {
    function dragstarted(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: d3.D3DragEvent<SVGGElement, GraphNode, GraphNode>) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return d3.drag<SVGGElement, GraphNode>()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended);
  }

  // Reactive statement to update graph when tasks or cpmResults change
  $: if (tasks && cpmResults && container) {
    createGraph();
    drawGraph();
  }
</script>

<div class="cpm-graph">
  <h3>Network Diagram</h3>
  
  {#if tasks.length === 0}
    <p>Add tasks to see the network diagram.</p>
  {:else if Object.keys(cpmResults).length === 0}
    <p>Calculate CPM to see the network diagram.</p>
  {:else}
    <div class="network-diagram" bind:this={container}></div>
    
    <div class="legend">
      <div class="legend-item">
        <div class="legend-color critical"></div>
        <span>Critical Path</span>
      </div>
      <div class="legend-item">
        <div class="legend-color normal"></div>
        <span>Regular Task</span>
      </div>
    </div>
  {/if}
</div>

<style>
  .cpm-graph {
    margin-bottom: 1.5rem;
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    padding: 1rem;
  }
  
  h3 {
    margin-top: 0;
    margin-bottom: 1rem;
    font-size: 1.25rem;
    color: #333;
  }
  
  .network-diagram {
    width: 100%;
    height: 600px;
    border: 1px solid #ddd;
    margin-bottom: 1rem;
    background-color: #fafafa;
    overflow: hidden;
    position: relative;
  }
  
  .legend {
    display: flex;
    gap: 1.5rem;
    justify-content: center;
    margin-top: 1rem;
  }
  
  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
  }
  
  .legend-color {
    width: 20px;
    height: 10px;
    border-radius: 2px;
  }
  
  .critical {
    background-color: #fff3cd;
    border: 2px solid #dc3545;
  }
  
  .normal {
    background-color: #f8f9fa;
    border: 1px solid #6c757d;
  }

  :global(.nodes text) {
    user-select: none;
    pointer-events: none;
  }

  :global(.node) {
    cursor: move;
  }

  :global(.node rect) {
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  }

  :global(.node:hover rect) {
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15));
  }

  @media (max-width: 768px) {
    .network-diagram {
      height: 400px;
    }
  }
</style>
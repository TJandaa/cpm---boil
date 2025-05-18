<script lang="ts">
  import { onMount, onDestroy, afterUpdate } from 'svelte';
  import { Task, CPMResult, ProjectCPMResults } from '$lib/types/project';

  export let tasks: Task[] = [];
  export let cpmResults: ProjectCPMResults | null = null;
  export let width: number = 800;
  export let height: number = 500;

  // References
  let container: HTMLDivElement;
  let svg: any;
  let simulation: any;
  let zoom: any;
  let d3Graph: { nodes: any[], links: any[] } = { nodes: [], links: [] };
  
  // D3 modules are loaded dynamically in onMount
  let d3: any;

  // Graph data
  type GraphNode = {
    id: string;
    label: string;
    duration: number;
    x?: number;
    y?: number;
    criticalPath: boolean;
    es: number;
    ef: number;
    ls: number;
    lf: number;
    slack: number;
  };

  type GraphLink = {
    id: string;
    source: string;
    target: string;
    criticalPath: boolean;
  };

  let nodes: GraphNode[] = [];
  let links: GraphLink[] = [];

  // Build the graph data
  function buildGraphData() {
    if (!tasks.length) {
      nodes = [];
      links = [];
      return;
    }

    // Create nodes from tasks
    nodes = tasks.map(task => {
      const result = cpmResults?.taskResults[task.id];
      const isCritical = result?.isCritical || false;
      
      return {
        id: task.id,
        label: task.name,
        duration: task.duration,
        criticalPath: isCritical,
        es: result?.earliestStart || 0,
        ef: result?.earliestFinish || 0,
        ls: result?.latestStart || 0,
        lf: result?.latestFinish || 0,
        slack: result?.slack || 0
      };
    });

    // Create links from dependencies
    links = [];
    tasks.forEach(task => {
      task.dependencies.forEach(depId => {
        const sourceResult = cpmResults?.taskResults[depId];
        const targetResult = cpmResults?.taskResults[task.id];
        const isCritical = sourceResult?.isCritical && targetResult?.isCritical;
        
        links.push({
          id: `${depId}-${task.id}`,
          source: depId,
          target: task.id,
          criticalPath: isCritical || false
        });
      });
    });
  }

  // When tasks or cpmResults change, rebuild the graph data
  $: if (tasks || cpmResults) {
    buildGraphData();
    if (d3 && container) {
      updateGraph();
    }
  }

  // Render the graph
  function renderGraph() {
    if (!d3 || !container) return;
    
    // Clear previous graph
    d3.select(container).select('svg').remove();
    
    // Create SVG container
    svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height])
      .attr('style', 'max-width: 100%; height: auto;');
    
    // Add zoom and pan behavior
    zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event: any) => {
        g.attr('transform', event.transform);
      });
    
    svg.call(zoom);
    
    // Create main group for zoom/pan
    const g = svg.append('g');
    
    // Create arrow marker for links
    svg.append('defs').append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .append('path')
      .attr('d', 'M 0,-5 L 10,0 L 0,5')
      .attr('fill', '#999');
    
    // Create critical path marker
    svg.select('defs').append('marker')
      .attr('id', 'arrowhead-critical')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .append('path')
      .attr('d', 'M 0,-5 L 10,0 L 0,5')
      .attr('fill', '#dc3545');
    
    // Create links
    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke-width', d => d.criticalPath ? 2 : 1)
      .attr('stroke', d => d.criticalPath ? '#dc3545' : '#999')
      .attr('marker-end', d => d.criticalPath ? 'url(#arrowhead-critical)' : 'url(#arrowhead)');
    
    // Create nodes
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .call(d3.drag()
        .on('start', dragStarted)
        .on('drag', dragged)
        .on('end', dragEnded)
      );
    
    // Node circles
    node.append('circle')
      .attr('r', 20)
      .attr('fill', d => d.criticalPath ? '#fff3cd' : '#e9ecef')
      .attr('stroke', d => d.criticalPath ? '#dc3545' : '#6c757d')
      .attr('stroke-width', d => d.criticalPath ? 2 : 1);
    
    // Node labels
    node.append('text')
      .attr('dy', 4)
      .attr('text-anchor', 'middle')
      .text(d => d.label.substring(0, 10))
      .style('font-size', '10px')
      .style('font-weight', d => d.criticalPath ? 'bold' : 'normal');
    
    // Task details as tooltip on hover
    node.append('title')
      .text(d => {
        return `Task: ${d.label}\nDuration: ${d.duration} days\n` +
          `ES: ${d.es} | EF: ${d.ef}\n` +
          `LS: ${d.ls} | LF: ${d.lf}\n` +
          `Slack: ${d.slack}\n` +
          `Critical Path: ${d.criticalPath ? 'Yes' : 'No'}`;
      });
    
    // Force directed simulation
    simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-500))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide().radius(40));
    
    // Update positions on each tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);
      
      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });
    
    // Drag functions
    function dragStarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    
    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }
    
    function dragEnded(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
    
    // Auto zoom to fit all nodes
    setTimeout(() => {
      const bounds = g.node().getBBox();
      const padding = 40;
      
      const scale = Math.min(
        width / (bounds.width + padding * 2),
        height / (bounds.height + padding * 2)
      );
      
      const transform = d3.zoomIdentity
        .translate(
          width / 2 - scale * (bounds.x + bounds.width / 2),
          height / 2 - scale * (bounds.y + bounds.height / 2)
        )
        .scale(scale * 0.95);
      
      svg.transition().duration(750).call(zoom.transform, transform);
    }, 100);
  }

  // Update graph when data changes
  function updateGraph() {
    if (!d3 || !container) return;
    
    if (simulation) {
      simulation.stop();
    }
    
    renderGraph();
  }

  // Reset zoom level
  export function resetZoom() {
    if (svg && zoom) {
      svg.transition().duration(750).call(
        zoom.transform,
        d3.zoomIdentity.scale(0.8)
      );
    }
  }

  // Zoom controls
  function zoomIn() {
    if (svg && zoom) {
      svg.transition().duration(300).call(
        zoom.scaleBy,
        1.2
      );
    }
  }

  function zoomOut() {
    if (svg && zoom) {
      svg.transition().duration(300).call(
        zoom.scaleBy,
        0.8
      );
    }
  }

  function zoomReset() {
    resetZoom();
  }

  // Load D3.js dynamically
  async function loadD3() {
    if (!d3) {
      const module = await import('https://cdn.jsdelivr.net/npm/d3@7/+esm');
      d3 = module;
      renderGraph();
    }
  }

  onMount(async () => {
    try {
      await loadD3();
    } catch (error) {
      console.error('Failed to load D3.js:', error);
    }
  });

  onDestroy(() => {
    if (simulation) {
      simulation.stop();
    }
  });
</script>

<div class="cpm-graph-container">
  <div class="graph-header">
    <h3>Network Diagram</h3>
    <div class="graph-controls">
      <button class="zoom-btn" on:click={zoomIn} title="Zoom In">+</button>
      <button class="zoom-btn" on:click={zoomReset} title="Reset Zoom">↻</button>
      <button class="zoom-btn" on:click={zoomOut} title="Zoom Out">-</button>
    </div>
  </div>
  
  {#if !tasks.length}
    <div class="empty-graph">
      <p>Add tasks to see the network diagram</p>
    </div>
  {:else if !cpmResults}
    <div class="empty-graph">
      <p>Calculate CPM to visualize the network</p>
    </div>
  {:else}
    <div class="graph-container" bind:this={container}></div>
    
    <div class="graph-legend">
      <div class="legend-item">
        <div class="node-sample regular"></div>
        <span>Regular Task</span>
      </div>
      <div class="legend-item">
        <div class="node-sample critical"></div>
        <span>Critical Path Task</span>
      </div>
      <div class="legend-item">
        <div class="link-sample regular"></div>
        <span>Dependency</span>
      </div>
      <div class="legend-item">
        <div class="link-sample critical"></div>
        <span>Critical Path</span>
      </div>
    </div>
  {/if}
  
  <div class="graph-instructions">
    <p>Drag nodes to reposition them. Use scroll wheel or buttons to zoom. Click and drag background to pan.</p>
  </div>
</div>

<style>
  .cpm-graph-container {
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
    margin-bottom: 2rem;
  }
  
  .graph-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  
  h3 {
    margin: 0;
    color: #333;
  }
  
  .graph-container {
    width: 100%;
    height: 500px;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    overflow: hidden;
  }
  
  .empty-graph {
    width: 100%;
    height: 500px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 6px;
  }
  
  .empty-graph p {
    font-size: 1.1rem;
    color: #6c757d;
  }
  
  .graph-controls {
    display: flex;
    gap: 0.5rem;
  }
  
  .zoom-btn {
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    border: none;
    background-color: #e9ecef;
    color: #333;
    font-size: 1.2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .zoom-btn:hover {
    background-color: #dee2e6;
  }
  
  .graph-legend {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 1.5rem;
    margin-top: 1rem;
    padding: 0.75rem;
    background-color: #f8f9fa;
    border-radius: 6px;
  }
  
  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    color: #495057;
  }
  
  .node-sample {
    width: 20px;
    height: 20px;
    border-radius: 50%;
  }
  
  .node-sample.regular {
    background-color: #e9ecef;
    border: 1px solid #6c757d;
  }
  
  .node-sample.critical {
    background-color: #fff3cd;
    border: 2px solid #dc3545;
  }
  
  .link-sample {
    width: 20px;
    height: 2px;
  }
  
  .link-sample.regular {
    background-color: #999;
  }
  
  .link-sample.critical {
    background-color: #dc3545;
    height: 3px;
  }
  
  .graph-instructions {
    text-align: center;
    margin-top: 1rem;
    font-size: 0.85rem;
    color: #6c757d;
  }
  
  @media (max-width: 768px) {
    .graph-container, .empty-graph {
      height: 400px;
    }
  }
</style>
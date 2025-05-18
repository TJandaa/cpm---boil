<script>
  // Podstawowy układ aplikacji
</script>

<header>
  <div class="container">
    <h1>Critical Path Method (CPM) Application</h1>
    <nav>
      <ul>
        <li><a href="/">Home</a></li>
        <li><a href="/projects">Projects</a></li>
      </ul>
    </nav>
  </div>
</header>

<main>
  <div class="container">
    <slot></slot>
  </div>
</main>

<footer>
  <div class="container">
    <p>CPM Calculator &copy; 2025</p>
  </div>
</footer>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
      Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    line-height: 1.5;
    color: #333;
  }
  
  :global(*) {
    box-sizing: border-box;
  }
  
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
  }
  
  header {
    background-color: #333;
    color: white;
    padding: 1rem 0;
  }
  
  h1 {
    margin: 0;
    font-size: 1.5rem;
  }
  
  nav {
    margin-top: 0.5rem;
  }
  
  nav ul {
    display: flex;
    list-style: none;
    margin: 0;
    padding: 0;
  }
  
  nav li {
    margin-right: 1rem;
  }
  
  nav a {
    color: white;
    text-decoration: none;
  }
  
  nav a:hover {
    text-decoration: underline;
  }
  
  main {
    min-height: calc(100vh - 120px);
    padding: 2rem 0;
  }
  
  footer {
    background-color: #f5f5f5;
    padding: 1rem 0;
    text-align: center;
    font-size: 0.9rem;
    color: #666;
  }
</style>

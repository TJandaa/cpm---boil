<script lang="ts">
  export let title = 'CPM Application';
</script>

<header>
  <div class="logo">
    <a href="/">CPM App</a>
  </div>
  <h1>{title}</h1>
  <nav>
    <ul>
      <li><a href="/">Home</a></li>
      <li><a href="/projects">Projects</a></li>
    </ul>
  </nav>
</header>

<style>
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background-color: #f8f9fa;
    border-bottom: 1px solid #dee2e6;
  }

  .logo a {
    font-weight: bold;
    font-size: 1.5rem;
    text-decoration: none;
    color: #3b5998;
  }

  h1 {
    font-size: 1.2rem;
    margin: 0;
  }

  nav ul {
    display: flex;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  nav li {
    margin-left: 1rem;
  }

  nav a {
    text-decoration: none;
    color: #333;
  }

  nav a:hover {
    color: #3b5998;
  }
</style>
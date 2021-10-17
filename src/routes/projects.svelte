<script lang="ts">
    import Header from "../components/header.svelte";
    import Footer from "../components/footer.svelte";
    import {fly} from "svelte/transition";
    import { projects } from "../stores/dbProjects";
</script>

<Header></Header>
<div class="wrapper"><h1 style="color: white; font-family:'Courier New', Courier, monospace">Projects</h1></div>
<div class="wrapper">
    <div class="container">
        <div class="row row-cols-1 row-cols-lg-2">
        
        {#each $projects as project}
                <div class="col">
                <div class="card" in:fly style="border-color: white;  min-height: 275px ;border-width:1px; transition: .3s transform cubic-bezier(.155,1.105,.295,1.12); background-color:black">
                    <a href="{project.git}" class="stretched-link"><img class="card-img mx-auto" style="width: 100%; min-height: 275px;"src="{project.img}" alt=""></a>
                </div>
                <h5 style="color:white; text-align: center; font-family:'Courier New', Courier, monospace" >{project.name}</h5>
            </div> 
        {/each}

        </div>
    </div>
</div>
<Footer></Footer>
<style>
    .wrapper{
        display: flex;
        background-color: black;
        justify-content: center;
        width: 100%;
        padding-bottom: 10%;
    }
    .card:hover{
     transform: scale(1.05);
     box-shadow: 0 10px 20px rgba(0,0,0,.12), 0 4px 8px rgba(0,0,0,.06);
}
    :root {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
        Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif, 'Courier New', monospace;
      background-color: black;
    }
</style>
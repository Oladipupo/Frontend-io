<script lang="ts">
    import Header from "../components/header.svelte";
    import Footer from "../components/footer.svelte";
    import {fly} from "svelte/transition";
    import { pieces } from "../stores/dbArt";

    let start:boolean = false;
    setTimeout(()=>{start = true}, 100);
</script>

<Header></Header>

<div class="wrapper"><h1 style="color: white; font-family:'Courier New', Courier, monospace">Fine Art</h1></div>


{#if start}
<!-- Gallery -->
<div class="wrapper">
<div class="row justify-content-center " style="width: 75%;">


    {#each $pieces as piece}
    <!-- Modal -->
     <div class="modal fade" id="{piece.name}" tabindex="-1" role="dialog" aria-labelledby="exampleModalCenterTitle" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content" style="background-color:black; border-width: 1px;">
            <div class="modal-body">
                <img src="{piece.img}" class="w-100 shadow-1-strong rounded mb-4" alt=""/>
                <h4 style="color:white; font-family:'Courier New', Courier, monospace; font-weight: 500;">Title: {piece.name}</h4>
                <p class="des">Description: {piece.des}</p>
                <a href="{piece.link}"><p style="text-align: center; font-family:'Courier New', Courier, monospace; font-weight: 700;">LINK</p></a>
            </div>
        </div>
        </div>
    </div>
    <!--Modal -->
    {/each}
    
    <div class="col-lg-4 col-md-12 mb-(4 mb-lg-0">
    {#each $pieces.filter((v, i) => i%3 === 0) as piece}
    <a data-bs-toggle="modal" data-bs-target="#{piece.name}"><img src="{piece.img}" in:fly class="w-100 shadow-1-strong rounded mb-4 pop" alt=""/></a>
    {/each}
    </div>
    
    
    <div class="col-lg-4 col-md-12 mb-4 mb-lg-0">
    {#each $pieces.filter((v, i) => i%3 === 1) as piece, i}
    <a data-bs-toggle="modal" data-bs-target="#{piece.name}"><img src="{piece.img}" in:fly class="w-100 shadow-1-strong rounded mb-4 pop" alt=""/></a>
    {/each}
    </div>
   
    <div class="col-lg-4 col-md-12 mb-4 mb-lg-0">
    {#each $pieces.filter((v, i) => i%3 === 2) as piece, i}
    <a data-bs-toggle="modal" data-bs-target="#{piece.name}"><img src="{piece.img}" in:fly class="w-100 shadow-1-strong rounded mb-4 pop" alt=""/></a>
    {/each}


    </div>
  </div>
</div>
{/if}
  <!-- Gallery -->

<Footer></Footer>
<style>
    .wrapper{
        display: flex;
        background-color: black;
        justify-content: center;
        width: 100%;
        padding-bottom: 10%;
    }
    .pop{
        transition: .3s transform cubic-bezier(.155,1.105,.295,1.12);
    }
    .pop:hover{
     transform: scale(1.05);
     box-shadow: 0 10px 20px rgba(0,0,0,.12), 0 4px 8px rgba(0,0,0,.06);
    }
    .des{
        color: white;
        font-family:'Courier New', Courier, monospace;
    }
    :root {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
        Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif, 'Courier New', monospace;
      background-color: black;
    }
</style>
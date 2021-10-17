<script lang="ts">
    import Header from "../components/header.svelte";
    import Footer from "../components/footer.svelte";
    import {fly} from "svelte/transition";
    import { music } from "../stores/dbMusic";

    class Project{
        name: string = "";
        img: string = "";
        link: string = "";
        clicked: boolean = false;
        constructor(name: string, img: string, link: string){
            this.name = name;
            this.img = img;
            this.link = link;
        }

    }

    function click(p: Project){
        if(!p.clicked){
            document.getElementById(`project${p.name}`).style.display = "inline"; 
            setTimeout(()=>{
                document.getElementById(`project${p.name}`).style.opacity = "1";
            }, 100)
            p.clicked = true;
        }
        else{
            document.getElementById(`project${p.name}`).style.opacity = "0";
            setTimeout(()=>{
                document.getElementById(`project${p.name}`).style.display = "none"; 
            }, 200)
            p.clicked = false;}
    }
    
    
</script>

<Header></Header>
<div class="wrapper"><h1 style="color: white; font-family:'Courier New', Courier, monospace">Music</h1></div>
<div class="wrapper">
    <div class="container">
        <div class="row row-cols-1 " style=" align-items: center; justify-content:center; width:100%">
        {#each $music as project, i}
            
                <div class="col d-flex justify-content-center align-items-center mb-5" >
                <div class="card " in:fly style=" transition: .3s transform cubic-bezier(.155,1.105,.295,1.12); width:40%; background-color:black ">
                    <h5  style="color:white; text-align: center; font-family:'Courier New', Courier, monospace;" >{project.name}</h5>
                    <img class="card-img mx-auto" style="width: 100%; min-height: 50px;"src="{project.img}" alt="" on:click={()=>click(project)}>
                    
                </div>
            </div> 
            <div id="project{project.name}" class="sp">
                <div in:fly>
                    <iframe title={project.name} src={project.link} width="100%" height="380" frameBorder="0" allow="encrypted-media" ></iframe>
                </div>
                
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
    .sp{
        align-items: center; 
        justify-content:center; 
        align-self: center; 
        display:none;
        opacity: 0;
        transition: all 200ms linear;
    }
</style>
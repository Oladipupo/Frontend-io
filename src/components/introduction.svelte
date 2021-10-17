<script lang="ts">
    import {fly} from "svelte/transition"
    import {loaded} from "../stores/loadedIcon"


    let runAni:boolean = false;

    (async () => {
    const img = new Image();
    img.src = "https://drive.google.com/uc?id=1puNagIXyYtNyVqkaFIZQ8M-OsOsR6mPW";
    await img.decode();
    // img is ready to use
    if($loaded){
        runAni = true;  
    }
    setTimeout(()=>{
        runAni = true;
        loaded.set(true);
    }, 1000)   
    })();
</script>

{#if runAni}
<div  class="wrapper">
    <div class="intro" in:fly="{{ y: 50, duration: 2000 }}">
        <div>
            <img src="https://drive.google.com/uc?id=1puNagIXyYtNyVqkaFIZQ8M-OsOsR6mPW" id="me" alt="me"/>
        </div>
        <div class="mov">
            My name is Oladipupo Ogundipe. I graduated from Denison University with a degree in Computer Science and minor in Music Composition.
            I am a software engineer, musician, thinker and artist. This site was made with <h2><a href="https://kit.svelte.dev" class="kit">SvelteKit</h2>
            for the frontend. <h2><a href="https://expressjs.com" class="express">ExpressJS</a></h2> for the backend.
            <h2><a href="https://www.mongodb.com" class="mongo">MongoDB</a></h2> for database storage. <h2><a href="https://getbootstrap.com" class="boot">Bootstrap</a></h2>
            and <h2><a href="https://purecss.io" class="pure">PureCSS</a></h2> for styling. With <h2><a href="https://www.typescriptlang.org" class="type">Typescript</a></h2>
            and <h2><a href="https://www.javascript.com" class="javascript">Javascript</a></h2> as the coding languages of choice. If you want to get in touch, enter your name, email, and 
            phone number below and I will reach back to you when I can. You can also call or email me.
        </div>
    </div>   
</div>
{/if}

<style>
.wrapper {
        display: flex;
        background-color: black;
        justify-content: center;
        align-items: center;
        color: white;
        margin-top: 20px;
        width: 100%;
    }
.intro {
    justify-content: center;
    align-items: center;
    justify-self: center;
    width: 70%;
    height: 70%;
    float:left;
    font-family: 'Courier New', Courier, monospace;
}
img {
            float: left; 
            margin: 5px;
            min-width: 200px; 
            min-height: 140px;
            height: 30%;
            width: 30%;
}
.mov {
    color: white;
    text-align: justify;
    font-size: 25px;
    text-align: center;
    font-family: 'Courier New', Courier, monospace;
}
h2{
    display: inline-block;
    transition: .3s transform cubic-bezier(.155,1.105,.295,1.12);
}
h2:hover{
    transform: scale(1.1);
}
a{
    text-decoration:none;
}
.kit{
    color: rgb(255,62,0);

}
.express{
    color: rgb(65,126,56);
}
.pure{
    color: rgb(164,212,232);
}
.mongo{
    color: rgb(19,170,82);
}
.boot{
    color: rgb(121,82,179);
}
.type{
    color: rgb(49,120,198);
}
.javascript{
    color: rgb(252,220,0);
}

</style>
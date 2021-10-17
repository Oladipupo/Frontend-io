<script lang="ts">
    async function getGreeting() {
        const response = await fetch("http://127.0.0.1:8000/greeting") //direct connection to the backend api
        return await response.json();
        
    }

    let greeting:String = "";
    let display: boolean = false; 
    

    function  displayGreeting(){
        display = !display;
        if (display){
            getGreeting().then((res:any) =>{
                greeting = res.message;
            });
        }
        else{
            greeting = "";
        }
    }

    
</script>

<div>
<h1>Hi {greeting}!</h1>
<button on:click={displayGreeting}>Toggle World</button>
</div>

<style>
    button{
        display:inline-block;
        padding:0.35em 1.2em;
        border:0.1em solid #FFFFFF;
        margin:0 0.3em 0.3em 0;
        border-radius:0.12em;
        box-sizing: border-box;
        text-decoration:none;
        font-family: 'Courier New', monospace;
        font-weight:300;
        color:#FFFFFF;
        background-color: #000000;
        text-align:center;
        transition: all 0.2s;
    }
    button:hover{
        color:#000000;
        background-color:#FFFFFF;

    }
    h1{
        font-family: 'Courier New', monospace;
        color: white;
    }
</style>


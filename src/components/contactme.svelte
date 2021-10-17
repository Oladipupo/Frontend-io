<script lang="ts" >

    import {fly,fade} from "svelte/transition"
    import {loaded} from "../stores/loadedIcon"
    

    $: name  = "";
    $: email = "";
    $: phone = "";
    $: msg = "";
    $: contact = {"name":name, "email":email, "phone":  phone, "msg": msg}
    $: sent = false;

    async function send(){
        await fetch("http://127.0.0.1:8080/api/v1/sendContact", {
            method:"Post",
            mode: 'no-cors',
            credentials: 'omit',
            body: new URLSearchParams(contact),
            headers: {
            //'Content-Type': 'application/json'
            'Content-Type': 'application/x-www-form-urlencoded',
            },

            
        }).then(() => {sent = true})
    }
    
    
    let y = 0;
    let runAni:boolean = false;
    



    

    $: if (y>500 && $loaded){
        runAni = true;
    }
    

</script>

<svelte:window bind:scrollY={y} />

{#if runAni && $loaded}
<div  class="wrapper"  in:fly="{{ y: 50, duration: 2000 }}">
    <h1>Contact Me</h1>
</div>
<div class="wrapper"  in:fly="{{ y: 50, duration: 2000 }}">
    <div style="margin-right:7%">
        <ul>
            <h4 class="colorText">Phone: +1 (617) 322 4097</h4>
            <h4 class="colorText">Email: Oladipupo.Ogundipe@gmail.com</h4>
        </ul>
    </div>
    <div style="width: 50%">
    <form class="mb-5" action="#" id="contactForm" name="contactForm">
        <div class="col-md-12 form-group">
            <label for="name" class="col-form-label colorText">Name</label>
            <input type="text" class="form-control" name="name" id="name" bind:value={name}>
        </div>
        <div class="col-md-12 form-group">
            <label for="email" class="col-form-label colorText">Email</label>
            <input type="text" class="form-control" name="email" id="email" bind:value={email}>
        </div>
        <div class="col-md-12 form-group">
            <label for="phone" class="col-form-label colorText">Phone</label>
            <input type="text" class="form-control" name="phone" id="phone" bind:value={phone}>
        </div>
        <div class="col-md-12 form-group">
            <label for="message" class="col-form-label colorText">Message</label>
            <textarea class="form-control" name="message" id="message" cols="30" rows="7" bind:value={msg}></textarea>
        </div>
        <div class="sub">
            <input type="button" value="Send Message" class="btn btn-primary rounded-0 py-2 px-4 b" on:click={send}>

        </div>
    </form>
    

    {#if sent}
    <div id="form-message-warning mt-4" in:fade></div>
    <div style="color:rgb(19,170,82);" id="form-message-success">
        Your message was sent, thank you!
    </div>
    {/if}
    </div>
    


</div>
{/if}
<style>
    .wrapper{
        display: flex;
        flex-wrap:wrap;
        background-color: black;
        justify-content: center;
        align-items: center;
        width: 100%;
        margin-top: 5%;
    }
    .sub{
        display: flex;
        flex-wrap:wrap;
        background-color: black;
        justify-content: center;
        align-items: center;
        width: 100%;
    }
    h1{
        color: white;
        font-family: 'Courier New', Courier, monospace;
        font-size: 70px;
    }
    .colorText{
        color: white;
        font-family: 'Courier New', Courier, monospace;
    }
    .b{
        display:inline-block;
        padding:.75em 1.2em;
        border:0.1em solid #FFFFFF;
        margin: 0 70px 0;
        border-radius:0.12em;
        box-sizing: border-box;
        text-decoration:none;
        font-family: 'Courier New', monospace;
        font-weight:300;
        color:#FFFFFF;
        background-color: #000000;
        text-align:center;
        transition: all 0.2s;
        width: auto;
        margin-top: 1%;
    }
    .b:hover{
        color:#000000;
        background-color:#FFFFFF;
        border:0.3em solid #FFFFFF;
    }
</style>
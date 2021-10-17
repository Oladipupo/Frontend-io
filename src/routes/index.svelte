<script lang="ts">
import Hello from '../components/hello.svelte';
import Header from "../components/header.svelte";
import Footer from "../components/footer.svelte";
import Introduction from '../components/introduction.svelte';
import Contactme from '../components/contactme.svelte';
import Socials from '../components/socials.svelte';
import { pieces } from "../stores/dbArt";
import {music} from "../stores/dbMusic";
import {projects} from "../stores/dbProjects"

function load(){
  $pieces;
  $music;
  $projects
}
load()
</script>

<Header></Header>
<div>
  <Hello />
  <Introduction />
  <Socials />
  <Contactme />

</div>

  
  
  
 <Footer></Footer>
  <style>
    div {
      text-align: center;
      margin: 0 auto;
      background-color: black;
      min-height: 1400px;
    }
  </style>
  
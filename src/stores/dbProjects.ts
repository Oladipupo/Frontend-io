import { writable } from "svelte/store";
const fetchProjects = async () =>{
    const url = "https://oladipupo.io/api/v1/getproject";
    const res = await fetch(url);
    const data = await res.json();
    const loadedProjects = data.map((data) => {
        return {
            name: data.name,
            img: data.img,
            des: data.des,
            git: data.git 
       };
   });
   projects.set(loadedProjects);
}
fetchProjects()
export const projects = writable([])

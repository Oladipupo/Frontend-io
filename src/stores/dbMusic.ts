import { writable } from "svelte/store";
export const music = writable([])
const fetchProjects = async () =>{
    const url = "https://oladipupo.io/api/v1/getmusic" //backend url goes here
    const res = await fetch(url);
    const data = await res.json();
    const loadedProjects = data.map((data, index) => {
        return {
            name: data.name,
            img: data.img,
            link: data.link
        };
    });
    music.set(loadedProjects)
}
fetchProjects()
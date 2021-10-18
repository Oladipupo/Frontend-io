import { writable } from "svelte/store";
export const pieces = writable([])
const fetchPieces = async () =>{
    const url = "https://backend.oladipupo.io/api/v1/getart" //backend url goes here
    const res = await fetch(url);
    const data = await res.json();
    const loadedPieces = data.map((data, index) => {
        return {
            name: data.name,
            img: data.img,
            des: data.des,
            link: data.link
        };
    });
    pieces.set(loadedPieces)
}
fetchPieces()
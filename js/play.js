

//Import all things needed from PIXI
import { Application, Assets, Sprite, Container, Text, Texture, VERSION, Graphics } from "../libraries/pixi.mjs"
console.log(VERSION)
class Player {
    constructor(render) {
        this.inventory = new Map;
        this.inventoryRender = render;
    }
    // get inventory(){
    //     return this.inventory
    // }
    hasItem(key) {
        return this.inventory.has(key)
    }
    getInventoryItem(key) {
        if (this.hasItem(key)) {
            return this.inventory.get(key);
        }
    }
    setInventoryItem(key, value) {
        this.inventory.set(key, value)
    }
}

// On document load run function
document.addEventListener("DOMContentLoaded", function () {
    // Add listener to create start button
    if ( document.getElementById('createPanel') !== null) {
        let startBtn = document.getElementById('createPanel');
        startBtn.addEventListener('click', startGame);
    }
});

// Starts Game (What did you think it'd do)
function startGame() {
    document.getElementById('createGame').style.display = 'none';
    document.getElementById('game').style.display = 'flex';
};

class Placer{
    constructor(x,y){
        this.sprite = Sprite.from("placer");
        this.sprite.scale = .15;
        this.sprite.anchor.set(.5);
        this.sprite.position.set(x,y);
        this.sprite.interactive = true;
    }
    setInteraction(event,onEvent){
        this.sprite.on(event,onEvent);
    }
}

class HexTile{
    constructor(texture,text,hexTile){
        this.container = new Container();
        this.sprite = Sprite.from(texture);
        this.hex = hexTile;
        this.tileText = new Text({
            text: text,
            style: {
                fontFamily: 'Arial'
            }
        });
        this.container.addChild(this.sprite,this.tileText);
        this.tileText.anchor.set(.5);
        this.sprite.anchor.set(.5);
        this.tileText.position.set(0);
        this.tilePlacers = [];
    }
    addPlacer(place){
        this.tilePlacers.push(place)
    }
    set placers(places){
        this.tilePlacers = places;
    }
    set text(newText){
        this.tileText.text = newText;
    }
}

class HexBoard{
    constructor(dimensions,orientation,radius,origin,parent){
        this.board = new Container();
        this.boardTiles = [];
        const hex = Honeycomb.defineHex({
            dimensions: dimensions,
            orientation: Honeycomb.Orientation[orientation || "POINTY"],
            offset: 1,
            origin: origin
        });
        this.hexGrid = new Honeycomb.Grid(hex, Honeycomb.spiral({ radius: radius }));
        (parent || app.stage).addChild(this.board);
    }
    buildTiles(texture,text){
        this.hexGrid.forEach(gridHex=>{
            const tile = new HexTile(texture,text,gridHex);
            const tileContainer = tile.container;
            tileContainer.position.set(gridHex.x,gridHex.y);
            this.board.addChild(tileContainer);
            this.boardTiles.push(tile);
        })
    }
    get tiles(){
        return this.boardTiles;
    }
}

//Create a new application
const app = new Application;

//Setup function that adds the canvas to the body and starts the game loop
async function setup() {
    const board = await getElementPromiseBySelctor("#gameboard");
    await app.init({ background: 'white', antialias: true, autoDensity: true, resolution: 2 });
    board.appendChild(app.canvas);
    globalThis.__PIXI_APP__ = app;

}

//Preloads the assets needed
async function preload() {
    let assets = [
        { alias: "hex", src: "../assets/polygon4.svg" },
        { alias: "placer", src: "../assets/polygon4.svg" },
        { alias: "outpost", src: "../assets/house.svg" },
        { alias: "road", src: "../assets/ryantile.png" }


    ]
    await Assets.load(assets);
}
function directionFromPoints(point1,point2){
    return Math.atan(point1.y-point2.y/point1.x-point2.x)
}

//Get the midpoint of 2 points
function getMidpoint(point1, point2) {
    if (point1 == null || point2 == null) return;
    return [(point2.x + point1.x) / 2, (point2.y + point1.y) / 2]
}

function getMidpoints(points) {
    let midpoints = [];
    for (let point = 0; point < points.length-1; point++) {
        midpoints.push(getMidpoint(points[point+1],points[point]));
    }
    midpoints.push(getMidpoint(points[points.length-1],points[0]));
    return midpoints
}

//Immedietly invoke a async function that runs both the setup and preload
let building = "outpost";
let selected;

(async () => {

    await preload();
    await setup();
    const origin = {x:-window.innerWidth/2,y:-window.innerHeight/2}
    const mainBoard = new HexBoard(100,"POINTY",2,origin);    
    mainBoard.buildTiles("hex","3");
    for (const tile of mainBoard.tiles) {
        tile.text = Math.floor(Math.random() * 4) + 1 
        tile.placers = createPlacers(tile);
    }
    const popup = await getElementPromiseBySelctor("#placepop");
    const building = await getElementPromiseBySelctor("#building");

    building.addEventListener("click",()=>{
        if(selected){
            selected.sprite.texture = Texture.from(building)
        }
    popup.classList.toggle("flex",false)
    })
})()

function addPlacers(places) {
    let placers = [];
    for (const place of places) {
        let placed = new Placer(place.x,place.y);
        app.stage.addChild(placed.sprite);
        placers.push(placed);
    }
    return placers;
}

function modifyPopup(popup,resources,text){
    // let outpost = {mushroom:1,log:1}
    //     modifyPopup(popup,outpost,"Place Outpost");
    //     popup.classList.toggle("flex");
    let use = document.getElementById("resources");
    let building = document.getElementById("building");
    console.log(use.children);
    building.innerText = text
}

async function createPlacers(tile){
    const hex = tile.hex;
    let corners = hex.corners;
    let midpoints = getMidpoints(corners).map(point=> {return {x:point[0], y:point[1]}});
    let cornerPlacers = addPlacers(corners)
    let edgePlacers = addPlacers(midpoints)
    const popup = await getElementPromiseBySelctor("#placepop");
    cornerPlacers.forEach(x=>x.setInteraction("pointerdown",(e)=>{
        selected = x
        building = "outpost"
        let outpost = {mushroom:1,log:1}
        modifyPopup(popup,outpost,"Place Outpost");
        popup.classList.toggle("flex");
    }))
    edgePlacers.forEach(x=>x.setInteraction("pointerdown",(e)=>{
        selected = x
        building = "road"
        let road = {mushroom:1,log:1}
        modifyPopup(popup,road,"Place Road");
        popup.classList.toggle("flex");

        
    }))
    let allPlacers = cornerPlacers.concat(edgePlacers)
    allPlacers.forEach(x=>x.setInteraction("pointerenter",(e)=>{x.sprite.tint = "green"}))
    allPlacers.forEach(x=>x.setInteraction("pointerleave",(e)=>{x.sprite.tint = 0xffffff}))

    return allPlacers
}


function getElementPromiseBySelctor(selector) {
    return new Promise((resolve, reject) => {
        const element = document.querySelector(selector);
        if (element !== null) {
            resolve(element)
        } else {
            reject(`selector: "${selector}" queried null`)
        }
    });
}


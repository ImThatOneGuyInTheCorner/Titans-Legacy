document.addEventListener("DOMContentLoaded", function () {
    // Points slider
    document.getElementById('pointsSlider').addEventListener('change', function (eventData) {
        let pointRangeCont = document.getElementById('pointRangeCont');
        pointRangeCont.innerText = eventData.target.value;
    });
});

//Import all things needed from PIXI
import { Application, Assets, Sprite, Container, Text, Texture, VERSION, TilingSprite, Ticker, Circle } from "../libraries/pixi.mjs"
console.log(VERSION)
class Player {
    constructor(render) {
        this.inventory = new Map;
        this.inventoryRender = render;
        this.roads = [];
        this.outposts = [];
        this.resources = new Map;
        this.resources.set("wood",0)
        this.resources.set("mushroom",0)
        this.resources.set("orange",0)
        this.resources.set("gem",0)
        this.resources.set("stone",0)
        this.titan;
        this.name;
    }
    // get inventory(){
    //     return this.inventory
    // }
    hasResource(key) {
        return this.resources.has(key)
    }
    hasResourceAmount(key,amount) {
        return this.hasResource(key) && this.getResource(key) >= amount
    }
    setResource(key, value) {
        this.resources.set(key, value)
    }
    addResource(key, value) {
        this.resources.set(key, +this.getResource(key)+value)
    }
    getResource(key) {
        if (this.hasResource(key)) {
            return this.resources.get(key);
        }
    }
    get resourceEntires(){
        return this.resources.entries()
    }

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


class Titan {
    constructor(name, stats) {
        this.name = name;
        this.stats = stats
    }
}
const turnEvent = new Event("turnEvent", { cancelable: true })

class Turn {
    constructor() {
        this.event = turnEvent;
        this.finished = false;
    }

    turnFinished() {
        return new Promise(async (resolve, reject) => {
            if (this.finished == true) {
                resolve()
            }
        });
    }
    finshTurn() {
        document.dispatchEvent(this.event)
        this.finished = true;
    }
}

class Placer {
    constructor(x, y) {
        this.sprite = Sprite.from("placer");
        this.sprite.scale = .35;
        this.sprite.alpha = .75
        this.sprite.anchor.set(.5);
        this.sprite.position.set(x, y);
        this.sprite.interactive = true;
        this.sprite.hitArea = new Circle(0, 0, this.sprite.width * 1.5)
    }
    setInteraction(event, onEvent) {
        this.sprite.on(event, onEvent);
    }
}

class HexTile {
    constructor(texture, text, hexTile) {
        this.container = new Container();
        this.sprite = Sprite.from(texture);
        this.hex = hexTile;
        this.tileText = new Text({
            text: text,
            style: {
                fontFamily: 'Arial'
            }
        });
        this.container.addChild(this.sprite, this.tileText);
        this.tileText.anchor.set(.5);
        this.sprite.anchor.set(.5);
        this.tileText.position.set(0);
        this.tilePlacers = [];
    }
    addPlacer(place) {
        this.tilePlacers.push(place)
    }
    set placers(places) {
        this.tilePlacers = places;
    }
    set text(newText) {
        this.tileText.text = newText;
    }
}

class HexBoard {
    constructor(dimensions, orientation, radius, origin, parent) {
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
    buildTiles(texture, text) {
        this.hexGrid.forEach(gridHex => {
            const tile = new HexTile(texture, text, gridHex);
            const tileContainer = tile.container;
            tileContainer.position.set(gridHex.x, gridHex.y);
            this.board.addChild(tileContainer);
            this.boardTiles.push(tile);
        })
    }
    get tiles() {
        return this.boardTiles;
    }
}
//Define variables
let playersNum;
let durationTurn;
let winningpoints = 10;

let placing = false;
let restrictRoad = false;
let restrictOutpost = false;
let ticker = Ticker.shared;

let currentTurn = 0;
let buildingCurrent = "outpost";
let selected;
let selectedTitans = [];
let players = [];
const gameboard = await getElementPromiseBySelctor("#gameboard");
let titans = { "bandit": { health: 20, maxhealth: 20, dmg: 2, def: 1, special: () => { console.log("i do stuff") } } }
// let resources = {
// "mushroom":"asset",
// "deer":"asset",
// "wood":"asset",
// "clay":"asset",
// "rock":"asset"
//}
let buildings = {
    "outpost": {
        "texture": "assetoutpost",
        "costs": {
            "stone": 1,
            "wood": 1,
            "orange": 1
        }
    },
    "road": {
        "texture": "assetroad",
        "costs": {
            "stone": 1,
            "wood": 1
        }
    }
}
//Create a new application
const app = new Application;

//Setup function that adds the canvas to the body and starts the game loop
async function setup() {
    for (const [titan, stats] of Object.entries(titans)) {
        titans[titan] = createTitan(titan, stats);
    }
    await app.init({ background: 'white', antialias: true, autoDensity: true, resolution: 2 });

    gameboard.appendChild(app.canvas);
    globalThis.__PIXI_APP__ = app;


}

//Preloads the assets needed
async function preload() {
    let assets = [
        { alias: "hex", src: "../assets/polygon4.svg" },
        { alias: "placer", src: "../assets/placer.svg" },
        { alias: "outpost", src: "../assets/house.svg" },
        { alias: "road", src: "../assets/ryantile.png" },
        { alias: "bg", src: "../assets/background.png" }


    ]
    await Assets.load(assets);
}

function directionFromPoints(point1, point2) {
    return Math.atan(point1.y - point2.y / point1.x - point2.x)
}

//Get the midpoint of 2 points
function getMidpoint(point1, point2) {
    if (point1 == null || point2 == null) return;
    return [(point2.x + point1.x) / 2, (point2.y + point1.y) / 2]
}

function getMidpoints(points) {
    let midpoints = [];
    for (let point = 0; point < points.length - 1; point++) {
        midpoints.push(getMidpoint(points[point + 1], points[point]));
    }
    midpoints.push(getMidpoint(points[points.length - 1], points[0]));
    return midpoints
}

function createTitan(name, stats) {
    let titan = new Titan(name, stats)
    return titan;
}



function modifyPopup(popup, resources, text) {
    // let outpost = {mushroom:1,log:1}
    //     modifyPopup(popup,outpost,"Place Outpost");
    //     popup.classList.toggle("flex");
    let use = document.getElementById("resources");
    let building = document.getElementById("building");
    console.log(use.children);
    building.innerText = text
}

async function addPlacers(places) {
    let placers = [];
    for (const place of places) {
        let placed = new Placer(place.x, place.y);
        app.stage.addChild(placed.sprite);
        placers.push(placed);
    }
    return placers;
}
let toResolve = []

async function place(placeOn) {
    let player = players[currentTurn]
    const popup = await getElementPromiseBySelctor("#popcontainer");
    let current = buildings[buildingCurrent];
    let costs = current.costs
    let canBuild = [];
    for (const [resource,cost] of Object.entries(costs)) {
        //let player = new Player();
        let buildCost = {}
        buildCost[resource] = player.hasResourceAmount(resource,cost);
        canBuild.push(buildCost)
    }
    canBuild = canBuild.every(x=>{
        return Object.values(x)[0] == true
    })
    if(canBuild !== true) return;
    for(const [resource,cost] of Object.entries(costs)){
        player.addResource(resource,-cost);
    }
    
    switch (buildingCurrent) {
        case "outpost":
            modifyPopup(popup, costs, "Place Outpost");
            popup.classList.toggle("hidden", false);
            
            break;
        case "road":
            modifyPopup(popup, costs, "Place Road");
            popup.classList.toggle("hidden", false);
            break;
        default:
            break;
    }
}
// app.stage.interactive = true
// app.stage.on("pointerdown",(e)=>{
//         // Get the click position
//         const clickPosition = e.data.global;
//         // Check if the click position intersects with any sprite
//         app.stage.children.forEach((sprite) => {
//             const localPosition = sprite.toLocal(clickPosition);
//             if (sprite.hitArea && sprite.hitArea.contains(localPosition.x, localPosition.y)) {
//                 console.log(`Sprite at (${sprite.x}, ${sprite.y}) clicked!`);
//                 place(sprite);
//                 // Perform actions based on the sprite clicked
//             }
//         });
// })
async function createPlacers(tile) {
    const hex = tile.hex;
    let corners = hex.corners;
    let midpoints = getMidpoints(corners).map(point => { return { x: point[0], y: point[1] } });
    let cornerPlacers = await addPlacers(corners);
    let edgePlacers = await addPlacers(midpoints);
    cornerPlacers.forEach(x => x.setInteraction("pointerdown", (e) => {
        if (placing == false || restrictOutpost == true) return;
        selected = x
        if (selected && selected.sprite.texture != Texture.from("placer")) {
            return
        }
        //placing = false
        place(x)
        buildingCurrent = "outpost"

    }))
    edgePlacers.forEach(x => x.setInteraction("pointerdown", (e) => {
        if (placing == false || restrictRoad == true) return;
        selected = x
        if (selected && selected.sprite.texture != Texture.from("placer")) {
            return
        }
        //placing = false
        place(x)
        buildingCurrent = "road"



    }))
    let allPlacers = cornerPlacers.concat(edgePlacers)
    allPlacers.forEach(x => x.setInteraction("pointerenter", (e) => { x.sprite.tint = "green" }))
    allPlacers.forEach(x => x.setInteraction("pointerleave", (e) => { x.sprite.tint = 0xffffff }))

    return allPlacers
}


function getElementPromiseBySelctor(selector) {
    return new Promise((resolve, reject) => {
        const element = document.querySelector(selector);
        if (element !== null) {
            resolve(element)
        } else {
            reject(`selector: "${selector}" queried null`)
            return
        }
    });
}

// On document load run function
document.addEventListener("DOMContentLoaded", async function () {

    let createPanel = await getElementPromiseBySelctor('#createPanel');
    if (createPanel !== null) {
        createPanel.addEventListener('click', startGame);
    }
    let playerSelector = await getElementPromiseBySelctor('#playerSelector');
    let durationSelector = await getElementPromiseBySelctor('#durationSelector');
    playerSelector.addEventListener("click", addSelector)
    durationSelector.addEventListener("click", addSelector)
});

function addSelector(e) {
    if (e.target.tagName !== "BUTTON") return;
    let selector = e.target.parentElement;
    for (const button of selector.querySelectorAll(".selected")) {
        button.classList.toggle("selected", false);
    }
    e.target.classList.toggle("selected", true);
}

// Starts Game (What did you think it'd do)
async function startGame() {

    await getElementPromiseBySelctor('#createGame').then(async x => {
        x.classList.toggle("hidden", true);
        await getElementPromiseBySelctor('#playerSelector .selected').then(x => playersNum = x.innerText.trim()).catch(console.error)
        await getElementPromiseBySelctor('#durationSelector .selected').then(x => durationTurn = x.innerText.trim()).catch(console.error)
    }).catch(console.error);
    console.log(durationTurn, playersNum)

    getElementPromiseBySelctor('#titanSelect').then(x => {
        x.classList.toggle("hidden", false)
    }).catch(console.error);

    let titans = await getElementPromiseBySelctor('#titanCards').then(x => x.children)
    titans = [...titans];
    let index = 0;
    console.log(titans)
    getElementPromiseBySelctor('#nextTitan').then(x => x.addEventListener("click", e => { index = toTitanCard(index, titans, 1) }))
    getElementPromiseBySelctor('#prevTitan').then(x => x.addEventListener("click", e => { index = toTitanCard(index, titans, -1) }))
    let selected = 0;
    getElementPromiseBySelctor('#selectTitan').then(x => {
        x.addEventListener("click", async e => {
            selected++
            titanSelected(...titans.splice(index, 1))
            index = 0;
            toTitanCard(0, titans, 0);
            if (selected >= playersNum) {

                getElementPromiseBySelctor('#titanSelect').then(x => x.classList.toggle("hidden", true)).catch(console.error);
                await getElementPromiseBySelctor('#playing').then(x => x.classList.toggle("hidden", false)).catch(console.error);
                startGameLoop();
                return
            }
        })
    }).catch(console.error);
}

function toTitanCard(currentIndex, cards, moveAmount) {
    if (cards[currentIndex + moveAmount] == null) return currentIndex;
    for (const card of cards) {
        card.classList.toggle("hidden", true);
    }
    cards[currentIndex + moveAmount].classList.toggle("hidden", false);
    return currentIndex + moveAmount
}

async function titanSelected(currentCard) {
    console.log(currentCard)
    let titanName = currentCard.getElementsByTagName("figcaption")[0].innerText
    let titanImg = currentCard.getElementsByTagName("img")[0].src
    titanName = titanName.toLowerCase()
    let player = new Player();
    player.titan = titanName;
    player.name = "player" + players.length
    player.img = titanImg
    players.push(player);
    currentCard.classList.toggle("hidden", true)

};

//Loads in the canvas for the board game
(async () => {

    await preload();
    await setup();



    const popup = await getElementPromiseBySelctor("#popcontainer");
    const building = await getElementPromiseBySelctor("#building");

    building.addEventListener("click", () => {
        if (selected && selected.sprite.texture != Texture.from(buildingCurrent)) {
            selected.sprite.texture = Texture.from(buildingCurrent)
        }
        popup.classList.toggle("hidden", true)
    })
})()
let notification = await getElementPromiseBySelctor("#notify");
function notify(message) {
    notification.innerText = message;
}

async function nextTurn() {
    currentTurn++;
    currentTurn = currentTurn%playersNum;
    let currentPlayer = players[currentTurn];
    console.log(currentPlayer)
    getElementPromiseBySelctor("#playerCard > img:nth-child(1)").then(img => img.src = currentPlayer.img)
    notify(`${currentPlayer.name} (${currentPlayer.titan}) place your first outpost & road`);
    placing = true
}

async function startGameLoop() {


    app.renderer.resize(gameboard.getBoundingClientRect().width, gameboard.getBoundingClientRect().height);
    const tilingSprite = new TilingSprite({
        texture: Texture.from("bg"),
        width: app.screen.width,
        height: app.screen.height,
    });
    app.stage.addChild(tilingSprite)
    const origin = { x: -app.canvas.width / 4, y: -app.canvas.height / 4 }
    const tileHeight = app.canvas.height / 20;
    const mainBoard = new HexBoard(tileHeight, "POINTY", 2, origin);

    mainBoard.buildTiles("hex", "3");
    for (const tile of mainBoard.tiles) {
        tile.sprite.scale.set(tileHeight / 100)
        tile.text = Math.floor(Math.random() * 4) + 1
        tile.placers = createPlacers(tile);
    }
    let currentZoom = 0;
    window.addEventListener('wheel', (event) => {
        const zoom = 0.1;
        const zoomFactor = event.deltaY < 0 ? zoom : -zoom; // Zoom in if scrolling up, zoom out if scrolling down
        currentZoom += zoomFactor;
        currentZoom = Math.min(Math.max(currentZoom, -.5), 2);
        app.view.style.transform = `scale(${1 + currentZoom})`;
        app.render(app.stage)
    });
    // let isDragging = false;
    // let startX, startY;

    // app.stage.on('pointerdown', (event) => {
    //     startX = event.clientX;
    //     startY = event.clientY;
    //     app.view.style.transformOrigin = `${startX}px ${startY}px `;
    //     isDragging = true;
    // });

    // app.canvas.addEventListener('pointermove', (event) => {
    //     if (!isDragging) return;

    //     const dx = event.clientX - startX;
    //     const dy = event.clientY - startY;

    //     // Update the view's position based on the drag
    //     app.view.style.transform = `translate(${dx}px, ${dy}px)`;
    //     // Optionally, update the transform-origin for zooming

    // });

    // app.canvas.addEventListener('pointerup', () => {
    //     isDragging = false;
    // });

    for (const [building,properties] of Object.entries(buildings)) {
        let costs = properties.costs
        for (const [resource,cost] of Object.entries(costs)) {
            // let player = new Player();
            players.forEach(player=>{
                player.addResource(resource,cost)
                console.log(player.hasResourceAmount(resource,cost));
            })
           
        }
    }
    currentTurn = -1;
    getElementPromiseBySelctor("#endturn").then(x=>x.addEventListener("click", nextTurn));
    nextTurn();
}

document.addEventListener("DOMContentLoaded", function () {
    // How to play screen
    if (document.getElementById('create-trade-overlay') !== null) {
        let offerBtn = document.getElementById('offerBtn');
        offerBtn.addEventListener('click', overlayShuffle)
    }
    if (document.getElementById('closeCreateTrade') !== null) {
        let offerBtn = document.getElementById('closeCreateTrade');
        offerBtn.addEventListener('click', overlayShuffle)
    }
});

function overlayShuffle() {
    document.getElementById("create-trade-overlay").classList.toggle("hidden");
    document.getElementById("create-trade-overlay").classList.toggle("flex");
}
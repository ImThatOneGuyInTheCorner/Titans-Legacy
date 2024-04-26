document.addEventListener("DOMContentLoaded", function () {
    // Points slider
    document.getElementById('pointsSlider').addEventListener('change', function (eventData) {
        let pointRangeCont = document.getElementById('pointRangeCont');
        pointRangeCont.innerText = eventData.target.value;
    });
});

//Import all things needed from PIXI
import { Application, Assets, Sprite, Container, Text, Texture, VERSION, TilingSprite, Ticker, Circle, textureFrom, Rectangle } from "../libraries/pixi.mjs"
console.log(VERSION)
class Player {
    constructor(render) {
        this.inventory = new Map;
        this.inventoryRender = render;
        this.roads = [];
        this.outposts = [];
        this.resources = new Map;
        this.resources.set("log", 0)
        this.resources.set("mushroom", 0)
        this.resources.set("orange", 0)
        this.resources.set("gem", 0)
        this.resources.set("stone", 0)
        this.titan;
        this.name;
    }
    // get inventory(){
    //     return this.inventory
    // }
    hasResource(key) {
        return this.resources.has(key)
    }
    hasResourceAmount(key, amount) {
        return this.hasResource(key) && this.getResource(key) >= amount
    }
    setResource(key, value) {
        this.resources.set(key, value)
    }
    addResource(key, value) {
        this.resources.set(key, +this.getResource(key) + value)
    }
    getResource(key) {
        if (this.hasResource(key)) {
            return this.resources.get(key);
        }
    }
    get resourceEntires() {
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


class Placer {
    constructor(x, y) {
        this.sprite = Sprite.from("placer");
        this.sprite.scale = .35;
        this.sprite.alpha = .75
        this.sprite.anchor.set(.5);
        this.sprite.position.set(x, y);
        this.sprite.interactive = true;
        this.sprite.buttonMode = true;
        this.sprite.cursor = "pointer";
        // this.sprite.hitArea = this
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
let isDragging = false;

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
        "costs": {
            "stone": 1,
            "log": 1,
            "orange": 1
        }
    },
    "road": {
        "costs": {
            "stone": 1,
            "log": 1
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
        { alias: "outpost", src: "../assets/outpost.svg" },
        { alias: "road", src: "../assets/road.svg" },
        { alias: "bg", src: "../assets/background.png" },
        { alias: "orange", src: "../assets/orange-resource.png" },
        { alias: "wood", src: "../assets/log-resource.png" },
        { alias: "mushroom", src: "../assets/mushroom.png" },
        { alias: "stone", src: "../assets/stone.png" },
        { alias: "gem", src: "../assets/gem.png" }


    ]
    await Assets.load(assets);
}

function directionFromPoints(point1, point2) {

    return Math.atan2(point2.y - point1.y, point2.x - point1.x)
}

//Get the midpoint of 2 points
function getMidpoint(point1, point2) {
    if (point1 == null || point2 == null) return;
    return [(point2.x + point1.x) / 2, (point2.y + point1.y) / 2, directionFromPoints(point1, point2)]
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
        console.log(place)
        let placed = new Placer(place.x, place.y);
        if (place.r) {
            placed.sprite.rotation = place.r + (90 * Math.PI / 180);
        }
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
    isDragging = false
    if (player.roads == 0 && player.outposts == 1 && buildingCurrent == "outpost") {
        return
    }
    if (player.roads == 0 && player.outposts == 0 && buildingCurrent == "road") {
        return
    }
    let placer = [];
    let rect = placeOn.sprite.getBounds().rectangle;
    rect.width *= 2;
    rect.height *= 2;

    rect.x -= (rect.width - 50) / 2;
    rect.y -= (rect.height - 50) / 2;
    for (const child of app.stage.children) {
        
        
        if (rect && child.getBounds() && rect.intersects(child.getBounds().rectangle)) {
            let texture = buildingCurrent == "outpost" ? "road" : "outpost";
            // console.log("what",texture,child,child.texture,child.texture == Texture.from(texture));
            placer.push(child.texture == Texture.from(texture))
        }
    }
    let nextTo = placer.some(x => x == true)
    if (nextTo == false && player.outposts > 0) {
        return
    }
    let canBuild = [];
    for (const [resource, cost] of Object.entries(costs)) {
        //let player = new Player();
        let buildCost = {}
        buildCost[resource] = player.hasResourceAmount(resource, cost);
        canBuild.push(buildCost);
    }
    canBuild = canBuild.every(x => {
        return Object.values(x)[0] == true
    })
    if (canBuild !== true) return;

    switch (buildingCurrent) {
        case "outpost":
            modifyPopup(popup, costs, "Place Outpost");
            player.outposts++
            popup.classList.toggle("hidden", false);
            break;
        case "road":

            modifyPopup(popup, costs, "Place Road");
            player.roads++
            popup.classList.toggle("hidden", false);
            break;
        default:
            break;
    }
}
app.stage.interactive = true
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
    let midpoints = getMidpoints(corners).map(point => { return { x: point[0], y: point[1], r: point[2] } });
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
    // allPlacers.forEach(x => x.setInteraction("pointerenter", (e) => { x.sprite.tint = players[currentTurn].color }))
    // allPlacers.forEach(x => x.setInteraction("pointerleave", (e) => { x.sprite.tint = 0xffffff }))

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
        await getElementPromiseBySelctor('#durationSelector .selected').then(x => durationTurn = x.innerText.trim().split(":").reduce((a, b) => 60 * +a + +b)).catch(console.error)
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
let playerColors = [0x2D7EAB, 0xAB2D2D, 0x2DAB3A, 0x992DAB]
async function titanSelected(currentCard) {
    console.log(currentCard);
    let titanName = currentCard.getElementsByTagName("figcaption")[0].innerText;
    let titanImg = currentCard.getElementsByTagName("img")[0].src;
    titanName = titanName.toLowerCase();
    let player = new Player();
    player.titan = titanName;
    player.name = "player" + players.length;
    player.img = titanImg;
    player.color = playerColors[players.length] || 0xfff;
    players.push(player);
    currentCard.classList.toggle("hidden", true);

};

//Loads in the canvas for the board game
(async () => {

    await preload();
    await setup();
    const popup = await getElementPromiseBySelctor("#popcontainer");
    const building = await getElementPromiseBySelctor("#building");

    building.addEventListener("click", () => {
       
        if (selected && selected.sprite.texture != Texture.from(buildingCurrent)) {
            let player = players[currentTurn];
            let costs = buildings[buildingCurrent].costs
            
            for (const [resource, cost] of Object.entries(costs)) {
                player.addResource(resource, -cost);
            }
    
            updateResourceCounters(player);
            selected.sprite.texture = Texture.from(buildingCurrent);
            selected.sprite.tint = players[currentTurn].color
            selected.sprite.alpha = 1;
            selected.sprite.scale = 1.35
            //this is horrible but i want to finish this
            for (const x of app.stage.children) {
                for (const y of app.stage.children) {
                    if(selected.sprite)
                    if (y !== x && x.texture == Texture.from("placer") && y.texture == Texture.from("placer") && x.getBounds().rectangle.intersects(y.getBounds().rectangle)) {
                        app.stage.removeChild(y);
                        // console.log("removed",y)
                    }
                }
            }
        }
        popup.classList.toggle("hidden", true)
    })
})()
let notification = await getElementPromiseBySelctor("#notify");
function notify(message) {
    notification.innerText = message;
}
let captialize = x => x.charAt(0).toUpperCase() + x.slice(1);
let activeTimers = [];
function purgeTimers() {
    for (const timer of activeTimers) {
        ticker.remove(timer);
    }
}
let elapsedTime = 0;

async function nextTurn() {

    purgeTimers();
    ticker.stop()
    let lastsec = 0;
    let turnTimer = (deltaMS) => {
        elapsedTime += deltaMS.elapsedMS;
        // console.log(elapsedTime)
        let sec = Math.floor(elapsedTime / 1000);
        if (lastsec != sec) {
            lastsec = sec
            notify(`${captialize(currentPlayer.titan)} (${durationTurn - sec}s)`);

        }
        if (elapsedTime >= durationTurn * 1000) {
            console.log(currentPlayer.titan, 'Timer finished');
            nextTurn();
            purgeTimers();
        }
    }
    activeTimers.push(turnTimer);
    ticker.add(turnTimer);
    ticker.start()

    currentTurn++;
    currentTurn = currentTurn % playersNum;
    let currentPlayer = players[currentTurn];
    console.log(currentPlayer)
    getElementPromiseBySelctor("#playerCard > img:nth-child(1)").then(img => img.src = currentPlayer.img)
    notify(`${captialize(currentPlayer.titan)}'s turn!`);
    placing = true
    updateResourceCounters(currentPlayer);
}

// Finn Checkpoint (isaac fixy :3)
function updateResourceCounters(player) {
    for (const [resource, amount] of player.resourceEntires) {
        console.log(resource)
        document.getElementById(`${resource}Count`).innerText = amount;
    }
    // document.getElementById('mushroomCount').innerText = player.getResource("mushroom");
    // document.getElementById('logCount').innerText = player.resources[1];
    // document.getElementById('orangeCount').innerText = player.resources[2];
    // document.getElementById('stoneCount').innerText = player.resources[3];
    // document.getElementById('gemCount').innerText = player.resources[4];
};

async function startGameLoop() {


    app.renderer.resize(gameboard.getBoundingClientRect().width, gameboard.getBoundingClientRect().height);
    const tilingSprite = new TilingSprite({
        texture: Texture.from("bg"),
        width: app.screen.width,
        height: app.screen.height,
    });
    app.stage.addChild(tilingSprite);
    const origin = { x: -app.canvas.width / 4, y: -app.canvas.height / 4 };
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
        app.stage.scale.set(1 + currentZoom);
        // tilingSprite.width = app.stage.width

        app.render(app.stage)
    });
    let startX, startY;

    app.stage.on('pointerdown', (event) => {
        console.log(event)
        startX = event.global.x;
        startY = event.global.y;
        isDragging = true;
    });

    app.stage.on('pointermove', (event) => {
        if (!isDragging) return;

        const dx = event.global.x - startX;
        const dy = event.global.y - startY;

        // app.stage.position.x += dx;
        // app.stage.position.y += dy;
        // Clamping to the edges of the stage
        const newX = Math.max(Math.min(app.stage.position.x + dx, app.renderer.width * 1.5 - app.stage.width), -app.stage.width / 2);
        const newY = Math.max(Math.min(app.stage.position.y + dy, app.renderer.height * 1.5 - app.stage.height), -app.stage.height / 2);

        app.stage.position.set(newX, newY);
        startX = event.global.x;
        startY = event.global.y;
    });

    app.stage.on('pointerup', () => {
        isDragging = false;
    });

    for (const [building, properties] of Object.entries(buildings)) {
        let costs = properties.costs
        for (const [resource, cost] of Object.entries(costs)) {
            // let player = new Player();
            players.forEach(player => {
                player.addResource(resource, cost)
                console.log(player.hasResourceAmount(resource, cost));
            })

        }
    }
    currentTurn = -1;
    getElementPromiseBySelctor("#endturn").then(x => x.addEventListener("click", nextTurn));
    for (const x of app.stage.children) {
        for (const y of app.stage.children) {
            if (y !== x && x.texture == Texture.from("placer") && y.texture == Texture.from("placer") && x.getBounds().rectangle.intersects(y.getBounds().rectangle)) {
                app.stage.removeChild(y);
            }
        }
    }

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

//PvE


let enemyDiff = "hard";


function checkResult(enemyHealth, playerHealth) {
    console.log("Enemy Health:", enemyHealth);
    console.log("Player Health:", playerHealth);
    if (enemyHealth <= 0) {
        console.log("win");
        return;
    }
    if (playerHealth <= 0) {
        console.log("loss");
        return;
    }
    else {
        return;
    }
}

function enemyAttack(brace) {
    let atkDmg;
    if (brace === "braced") {
        atkDmg = Math.floor(Math.random() * 10);
    } else {
        atkDmg = Math.floor(Math.random() * 20) + 10;
    }
    return (playerHealth -= atkDmg);
}

function banditTBC(enemyDiff) {
    const attackBtn = document.getElementById("playerAttackBtn");
    const dodgeBtn = document.getElementById("playerDodgeBtn");
    const braceBtn = document.getElementById("playerBraceBtn");
    const healBtn = document.getElementById("playerHealBtn");

    let enemyHealth = 100;
    if (enemyDiff === "hard") {
        enemyHealth = 130;
    }
    if (enemyDiff === "easy") {
        enemyHealth = 80;
    }
    let playerHealth = 100;

    function attack() {
        if (playerHealth || enemyHealth <= 0) {
            return;
        }
        let atkDmg = Math.floor(Math.random() * 20 + 10);
        enemyHealth -= atkDmg;
        checkResult(enemyHealth, playerHealth);
        enemyAttack();
    }

    function dodge() {
        if (playerHealth || enemyHealth <= 0) {
            return;
        }
        let dodgeChance = Math.random();
        if (dodgeChance < 0.3) {
            enemyAttack("notBraced");
        }
        checkResult(enemyHealth, playerHealth);
    }

    function brace() {
        if (playerHealth || enemyHealth <= 0) {
            return;
        }
        let braceChance = Math.random();
        if (braceChance < 0.7) {
            enemyAttack("braced");
        } else {
            enemyAttack();
        }
        checkResult(enemyHealth, playerHealth);
    }

    function heal() {
        if (playerHealth || enemyHealth <= 0) {
            return;
        }
        let healNmb = Math.floor(Math.random() * 20) + 10;
        playerHealth += healNmb;
        if (playerHealth > 100) {
            playerHealth = 100;
        }
        checkResult(enemyHealth, playerHealth);
        enemyAttack();
    }

    attackBtn.addEventListener("click", attack);
    dodgeBtn.addEventListener("click", dodge);
    braceBtn.addEventListener("click", brace);
    healBtn.addEventListener("click", heal);
}

banditTBC(enemyDiff);

function ravangeTBC(enemyDiff) {
    const attackBtn = document.getElementById("playerAttackBtn");
    const dodgeBtn = document.getElementById("playerDodgeBtn");
    const braceBtn = document.getElementById("playerBraceBtn");
    const healBtn = document.getElementById("playerHealBtn");

    // function endTBC(result) {
    //     if (result === "win") {
    //         //GIVE PLAYER RESOURCES
    //     } else if (result === "lose") {
    //         //CLOSE PVE OVERLAY
    //     }
    //     //CLOSE PVE OVERLAY
    // }


    // function checkResult() {
    //     console.log("Enemy Health,", enemyHealth);
    //     console.log("Player Health,", playerHealth);
    //     if (enemyHealth <= 0) {
    //         endTBC("win");
    //     }
    //     if (playerHealth <= 0) {
    //         endTBC("lose");
    //     }
    // }

    // function enemyAttack(brace, enemyDiff) {
    //     if (brace === "braced") {
    //         let atkDmg = Math.floor(Math.random() * 10);
    //         playerHealth -= atkDmg;
    //     } else {
    //         let atkDmg = Math.floor(Math.random() * 20) + 10;
    //         playerHealth -= atkDmg;
    //     }
    //     checkResult();
    // }


    let enemyHealth = 100;
    if (enemyDiff === "hard") {
        enemyHealth = 130;
    }
    if (enemyDiff === "easy") {
        enemyHealth = 80;
    }
    let playerHealth = 80;

    function attack() {
        let atkDmg = 0;
        let doubleAttack = Math.random();
        if (doubleAttack > 0.7) {
            atkDmg = Math.floor(Math.random() * 20) + Math.floor(Math.random() * 10)
        } else {
            atkDmg = Math.floor(Math.random() * 20);
        }
        enemyHealth -= atkDmg;
        checkResult();
        enemyAttack();
    }

    function dodge() {
        let dodgeChance = Math.random();
        if (dodgeChance > 0.3) {
            enemyAttack();
        }
        checkResult();

    }

    function brace() {
        let braceChance = Math.random();
        if (braceChance < 0.7) {
            enemyAttack("braced");
        } else {
            enemyAttack();
        }
        checkResult();

    }

    function heal() {
        let healNmb = Math.floor(Math.random() * 20) + 10;
        playerHealth += healNmb;
        if (playerHealth > 100) {
            playerHealth = 100;
        }
        checkResult();
        enemyAttack();
    }



    attackBtn.addEventListener("click", attack);
    dodgeBtn.addEventListener("click", dodge);
    braceBtn.addEventListener("click", brace);
    healBtn.addEventListener("click", heal);
}


function brutusTBC(enemyDiff) {
    const attackBtn = document.getElementById("playerAttackBtn");
    const dodgeBtn = document.getElementById("playerDodgeBtn");
    const braceBtn = document.getElementById("playerBraceBtn");
    const healBtn = document.getElementById("playerHealBtn");

    // function endTBC(result) {
    //     if (result === "win") {
    //         //GIVE PLAYER RESOURCES
    //     } else if (result === "lose") {
    //         //CLOSE PVE OVERLAY
    //     }
    //     //CLOSE PVE OVERLAY
    // }


    // function checkResult() {
    //     console.log("Enemy Health,", enemyHealth);
    //     console.log("Player Health,", playerHealth);
    //     if (enemyHealth <= 0) {
    //         endTBC("win");
    //     }
    //     if (playerHealth <= 0) {
    //         endTBC("lose");
    //     }
    // }

    // function enemyAttack(brace, enemyDiff) {
    //     if (brace === "braced") {
    //         let atkDmg = Math.floor(Math.random() * 10);
    //         playerHealth -= atkDmg;
    //     } else {
    //         let atkDmg = Math.floor(Math.random() * 20) + 10;
    //         playerHealth -= atkDmg;
    //     }
    //     checkResult();
    // }

    let enemyHealth = 100;
    if (enemyDiff === "hard") {
        enemyHealth = 130;
    }
    if (enemyDiff === "easy") {
        enemyHealth = 80;
    }
    let playerHealth = 120;

    function attack() {
        const atkDmg = Math.floor(Math.random() * 20) + 10;
        enemyHealth -= atkDmg;
        checkResult();
        enemyAttack();
    }

    function dodge() {
        let dodgeChance = Math.random();
        if (dodgeChance > 0.3) {
            enemyAttack();
        }
        checkResult();

    }

    function brace() {
        let braceChance = Math.random();
        if (braceChance < 0.7) {
            enemyAttack("braced");
        } else {
            enemyAttack();
        }
        checkResult();

    }

    function heal() {
        let healNmb = Math.floor(Math.random() * 20) + 10;
        playerHealth += healNmb;
        if (playerHealth > 100) {
            playerHealth = 100;
        }
        checkResult();
        enemyAttack();
    }

    attackBtn.addEventListener("click", attack);
    dodgeBtn.addEventListener("click", dodge);
    braceBtn.addEventListener("click", brace);
    healBtn.addEventListener("click", heal);
}


function magnificusTBC(enemyDiff) {
    const attackBtn = document.getElementById("playerAttackBtn");
    const dodgeBtn = document.getElementById("playerDodgeBtn");
    const braceBtn = document.getElementById("playerBraceBtn");
    const healBtn = document.getElementById("playerHealBtn");

    // function endTBC(result) {
    //     if (result === "win") {
    //         //GIVE PLAYER RESOURCES
    //     } else if (result === "lose") {
    //         //CLOSE PVE OVERLAY
    //     }
    //     //CLOSE PVE OVERLAY
    // }


    // function checkResult() {
    //     console.log("Enemy Health,", enemyHealth);
    //     console.log("Player Health,", playerHealth);
    //     if (enemyHealth <= 0) {
    //         endTBC("win");
    //     }
    //     if (playerHealth <= 0) {
    //         endTBC("lose");
    //     }
    // }

    // function enemyAttack(brace, enemyDiff) {
    //     if (brace === "braced") {
    //         let atkDmg = Math.floor(Math.random() * 10);
    //         playerHealth -= atkDmg;
    //     } else {
    //         let atkDmg = Math.floor(Math.random() * 20) + 10;
    //         playerHealth -= atkDmg;
    //     }
    //     checkResult();
    // }

    let enemyHealth = 100;
    if (enemyDiff === "hard") {
        enemyHealth = 130;
    }
    if (enemyDiff === "easy") {
        enemyHealth = 80;
    }
    let playerHealth = 100;

    function attack() {
        const atkDmg = Math.floor(Math.random() * 20) + 10;
        enemyHealth -= atkDmg;
        checkResult();
        enemyAttack();
    }

    function dodge() {
        let dodgeChance = Math.random();
        if (dodgeChance > 0.2) {
            enemyAttack();
        }
        checkResult();

    }

    function brace() {
        let braceChance = Math.random();
        if (braceChance < 0.7) {
            enemyAttack("braced");
        } else {
            enemyAttack();
        }
        checkResult();

    }

    function heal() {
        let healNmb = Math.floor(Math.random() * 20) + 10;
        playerHealth += healNmb;
        if (playerHealth > 100) {
            playerHealth = 100;
        }
        checkResult();
        enemyAttack();
    }

    attackBtn.addEventListener("click", attack);
    dodgeBtn.addEventListener("click", dodge);
    braceBtn.addEventListener("click", brace);
    healBtn.addEventListener("click", heal);
}

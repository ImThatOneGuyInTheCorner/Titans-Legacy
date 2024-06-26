document.addEventListener("DOMContentLoaded", function () {
    // Points slider
    document.getElementById('pointsSlider').addEventListener('change', function (eventData) {
        let pointRangeCont = document.getElementById('pointRangeCont');
        pointRangeCont.innerText = eventData.target.value;
    });
});

//Import all things needed from PIXI
import { Application, Assets, Sprite, Container, Text, Texture, VERSION, TilingSprite, Ticker, Rectangle } from "../libraries/pixi.mjs"
console.log(`Pixi.js [${VERSION}]`)
import Player from "./player.js"
class Battle {
    constructor(diff, player) {
        this.diff = diff;
        this.player = player;
        this.enemyHP = 80 + (this.diff == "hard" ? 70 : this.diff == "medium" ? 20 : 0);
        this.enemymaxHP = this.enemyHP;
        this.bracing = false;
        this.dodge = false;
        this.cb = ()=>{}
    }
    induceDamage(dmg, toPlayer) {
        if (toPlayer) {
            console.log(`Induced ${dmg} damage to player`)
            this.player.hp -= dmg;
        }
        else {
            console.log(`Induced ${dmg} damage to enemy`)
            this.enemyHP -= dmg;
        }
    }
    didPlayerWin() {
        return this.enemyHP <= 0;
    }
    didEnemyWin() {
        return this.enemyHP > 0 && this.player.hp <= 0;
    }
    stepTurn() {
        console.log(this.player)
        this.cb(this.didPlayerWin());
        if (this.diff == 'hard') {
            var audio = new Audio(`../audio/perry${Math.floor(Math.random() * (3 - 1 + 1)) + 1}.mp3`);
            audio.play();
        }
        if (this.didPlayerWin()) {
            console.log("plr won")
            return
        }
        if (this.didEnemyWin()) {
            console.warn("player dead")
            return
        }
        console.log(`plr ${this.bracing ? "is" : "is not"} bracing`)
        let damage = this.bracing == true ? Math.floor(Math.random() * 10) : Math.floor(Math.random() * 20) + 10
        let dodgeChance = Math.random();
        if (dodgeChance > 0.3 * this.player.dodgeChance && this.dodge == true) {
            this.induceDamage(damage, true);

        } else if (this.dodge == false) {
            this.induceDamage(damage, true);
        } else {
            notify(`${this.player.titan} dodged ${damage} damage`)
        }
        this.bracing = false;
        this.dodge = false;
        notify(`${this.player.titan}: ${this.player.hp}/${this.player.maxhp} enemy: ${this.enemyHP}/${this.enemymaxHP}`)
        console.log("<|-|>".repeat(25))
        if (this.didEnemyWin()) {
            console.warn("player dead")
            return
        }
    }
    set turncb(cb) {
        this.cb = cb
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



function modifyPopup(popup, resources, text, fightpop) {
    // let outpost = {mushroom:1,log:1}
    //     modifyPopup(popup,outpost,"Place Outpost");
    //     popup.classList.toggle("flex");
    let use = document.getElementById("resources");
    let building = document.getElementById("building");
    // let fight = document.getElementById("whole");
    console.log(use.children);
    building.innerText = text
    // fight.addEventListener('click')
}

async function addPlacers(places) {
    let placers = [];
    for (const place of places) {
        //console.log(place)
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

function rectOnSprite(placeOn, radius) {
    let r = new Rectangle(placeOn.sprite.x, placeOn.sprite.y, placeOn.sprite.width * radius, placeOn.sprite.height * radius);
    r.x -= r.width / 2
    r.y -= r.height / 2
    return r
}

async function place(placeOn) {

    let player = players[currentTurn]
    const popup = await getElementPromiseBySelctor("#popcontainer");
    // const fightpop = getElementById('whole');
    let current = buildings[buildingCurrent];
    let costs = current.costs
    isDragging = false
    if (player.roads == 0 && player.outposts == 1 && buildingCurrent == "outpost") {
        return
    }
    if (player.roads == 0 && player.outposts == 0 && buildingCurrent == "road") {
        return
    }
    if (player.roads == 0 && player.outposts == 1 && buildingCurrent == "fight") {
        return
    }

    let placer = [];
    let rect = rectOnSprite(placeOn, 3.5)
    let rect2 = rectOnSprite(placeOn, 6)
    let self = [];
    for (const child of app.stage.children) {
        if (child != placeOn.sprite && child.texture == Texture.from("outpost") && buildingCurrent == "outpost") {
            if (rect2.intersects(child.getBounds())) {
                return
            }
        }
        if (rect && child.getBounds() && rect.intersects(child.getBounds().rectangle)) {
            let texture = buildingCurrent == "outpost" ? "road" : "outpost";
            // console.log("what",texture,child,child.texture,child.texture == Texture.from(texture));
            self.push(child.tint == player.color);
            placer.push(child.texture == Texture.from(texture));
        }
    }
    let selfPlace = self.some(x => x == true)
    let nextTo = placer.some(x => x == true)
    if (selfPlace == false && player.outposts > 0) {
        console.log("not next to own stuff")
        return
    }
    if (self.every(x => x == false) && player.outposts > 0) {
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

let fight
let PvEcontainer = await getElementPromiseBySelctor("#PvEContainer");

async function PvE(plr) {
    PvEcontainer.classList.toggle("hidden", false);
    let randNum = Math.floor(Math.random() * 2) + 1;
    switch (randNum) {
        case 0:
            var difficulty = "easy";
            document.getElementById("slime").classList.toggle('hidden');
            break;
        case 1:
            var difficulty = "medium";
            document.getElementById("wolf").classList.toggle('hidden');
            break;
        case 2:
            var difficulty = "hard";
            document.getElementById("perry").classList.toggle('hidden');
            var audio = new Audio(`../audio/perry${Math.floor(Math.random() * (3 - 1 + 1)) + 1}.mp3`);
            audio.play();
            break;
        default:
            console.log("Error: No difficulty for battle");
    }
    plr.hp = 100;
    let fight = new Battle(difficulty, plr);
    
    let moveFunctions = {
        brace: () => {
            fight.bracing = true;
            fight.stepTurn();
        },
        heal: (plr) => {
            plr.hp = Math.min(plr.hp + 10, plr.maxhp);
            fight.stepTurn();
        },
        dodge: (plr) => {
            fight.dodge = true;
            fight.stepTurn();
        },
        attack: (plr) => {
            let dmg = Math.floor(Math.random() * 20) * plr.dmgModifier + 10;
            fight.induceDamage(dmg, false);
            fight.stepTurn();
        }
    }
    let events = [];
    function doMove(btn) {
        let event = () => {
            let move = btn.id.substring(6).slice(0, -3).toLowerCase();
            if (fight) {
                moveFunctions[move](fight.player);
            }
        }
        btn.addEventListener("click", event)
        console.log(btn)
        events.push([event,btn]);
    }
    let buttons = document.querySelectorAll("section .btn");
    for (const btn of buttons) {
        doMove(btn);
    }
    fight.cb = () => {
        if(fight.didPlayerWin() == true){
            let resources = randResource(4)
            resources.forEach(x=>fight.player.addResource(x,Math.floor(Math.random()*2+1)))
            updateResourceCounters(fight.player);
        }
        if (fight.didEnemyWin() == true || fight.didPlayerWin() == true) {
            fight.player.health = fight.player.maxhealth;
            fight = null;
            PvEcontainer.classList.toggle("hidden", true);
            events.forEach(x => x[1].removeEventListener("click",x[0]))
        }
        
    }

}

function randResource(amount){
    let ret = [];
    for (let i = 0; i < amount; i++) {
        let res = Math.floor(Math.random() * players[currentTurn].resources.size);
        let values = Object.keys(Object.fromEntries(players[currentTurn].resourceEntires))[res];
        ret.push(values);
       
    }
    console.log(ret)
    return ret;
}

let mainBoard;
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
            console.log(buildingCurrent)
            player[buildingCurrent + "s"]++
            if(player[buildingCurrent + "s"] == 10){
                document.write(`${player.titan} won the game!`)
            }
            selected.sprite.texture = Texture.from(buildingCurrent);
            selected.sprite.tint = players[currentTurn].color
            selected.sprite.alpha = 1;
            selected.sprite.scale = 1.35
            //this is horrible but i want to finish this
            let rect = selected.sprite.getBounds().rectangle;
            rect.width *= 1.5;
            rect.height *= 1.5;

            rect.x -= (rect.width - 50) / 2;
            rect.y -= (rect.height - 50) / 2;

            for (const x of mainBoard.board.children) {
                if (selected.sprite.getBounds().rectangle.intersects(x.getBounds().rectangle)) {
                    x.interactive = true;
                    x.on("pointerdown", () => {
                        if (PvEcontainer.classList.hidden != null) {
                            return
                        }
                        // console.log(PvEcontainer.classList.hidden)
                        PvE(player);

                    });
                }
            }

            for (const x of app.stage.children) {

                if (x.texture == Texture.from("placer") && rect.intersects(x.getBounds().rectangle)) {
                    console.log(buildingCurrent, "hittin something...", x);
                    if (buildingCurrent == "road") {
                        selected.sprite.scale.y += .5
                        // app.stage.removeChild(x);
                    } else {

                    }
                }
                for (const y of app.stage.children) {
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
        activeTimers.splice(activeTimers.indexOf(timer), 1);
    }

}
let elapsedTime = 0;

async function nextTurn() {
    PvEcontainer.classList.toggle("hidden","true");
    ticker.stop()
    purgeTimers();
    elapsedTime = 0
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
            purgeTimers();
            nextTurn();
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
    updateColors(currentPlayer);

    if (currentPlayer.titan == "ravange") {
        // console.log(Math.floor(Math.random() * (3 - 1 + 1)) + 1);
        var audio = new Audio(`../audio/ravange${Math.floor(Math.random() * (3 - 1 + 1)) + 1}.mp3`);
        audio.play();
    };
}

// UI colors for each player
function updateColors(player) {
    console.log("COLOR UPDATE");
    // 0x2D7EAB, 0xAB2D2D, 0x2DAB3A, 0x992DAB
    switch (player.color) {
        case 0x2D7EAB:
            colorSwitch('#2D7EAB', '#248596');
            break;
        case 0xAB2D2D:
            colorSwitch('#AB2D2D', '#9e263e');
            break;
        case 0x2DAB3A:
            colorSwitch('#2DAB3A', '#3a9423');
            break;
        case 0x992DAB:
            colorSwitch('#992DAB', '#762599');
            break;
        default:
            console.log("Error: no color found")
    }
};

function colorSwitch(color1, color2) {
    document.getElementById('bottombar').style.backgroundColor = color1;
    document.getElementById('sidebar').style.backgroundColor = color1;
    document.getElementById('trades').style.backgroundColor = color2;
    document.getElementById('inventory').style.backgroundColor = color2;


};

function updateResourceCounters(player) {
    for (const [resource, amount] of player.resourceEntires) {
        console.log(resource)
        document.getElementById(`${resource}Count`).innerText = amount;
    }
};
let diffculties = {
    "hard": "BE6A6A",
    "medium": "BE926A",
    "easy": "6ABE7D"
}
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
    mainBoard = new HexBoard(tileHeight, "POINTY", 2, origin);

    mainBoard.buildTiles("hex", "3");
    for (const tile of mainBoard.tiles) {
        tile.sprite.scale.set(tileHeight / 100);
        tile.text = Math.floor(Math.random() * 4) + 1
        tile.placers = createPlacers(tile);
        let diff = Math.floor(Math.random() * 3)
        tile.sprite.tint = Object.values(diffculties)[diff];
    }



    // let currentZoom = 0;
    // window.addEventListener('wheel', (event) => {
    //     const zoom = 0.1;
    //     const zoomFactor = event.deltaY < 0 ? zoom : -zoom; // Zoom in if scrolling up, zoom out if scrolling down
    //     currentZoom += zoomFactor;
    //     currentZoom = Math.min(Math.max(currentZoom, -.5), 2);
    //     app.stage.scale.set(1 + currentZoom);
    //     // tilingSprite.width = app.stage.width

    //     app.render(app.stage)
    // });
    // let startX, startY;

    // app.stage.on('pointerdown', (event) => {
    //     console.log(event)
    //     startX = event.global.x;
    //     startY = event.global.y;
    //     isDragging = true;
    // });

    // app.stage.on('pointermove', (event) => {
    //     if (!isDragging) return;

    //     const dx = event.global.x - startX;
    //     const dy = event.global.y - startY;

    //     // app.stage.position.x += dx;
    //     // app.stage.position.y += dy;
    //     // Clamping to the edges of the stage
    //     const newX = Math.max(Math.min(app.stage.position.x + dx, app.renderer.width * 1.5 - app.stage.width), -app.stage.width / 2);
    //     const newY = Math.max(Math.min(app.stage.position.y + dy, app.renderer.height * 1.5 - app.stage.height), -app.stage.height / 2);

    //     app.stage.position.set(newX, newY);
    //     startX = event.global.x;
    //     startY = event.global.y;
    // });

    // app.stage.on('pointerup', () => {
    //     isDragging = false;
    // });

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

document.addEventListener("DOMContentLoaded", function () {
    if (document.getElementById('whole') != null) {


    }
})


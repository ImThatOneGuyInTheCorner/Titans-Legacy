

//Import all things needed from PIXI
import { Application, Assets, Sprite, Container, Text, Texture } from "../libraries/pixi.mjs"

class Player {
    constructor() {
        this.inventory = new Map;
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

//Create a new application
const app = new Application;
window.__PIXI_DEVTOOLS__ = {app: app}
globalThis.__PIXI_APP__ = app;
//Setup function that adds the canvas to the body and starts the game loop
async function setup() {
    await app.init({ background: 'white', resizeTo: window, antialias: true, autoDensity: true, resolution: 2 });
    const main = document.getElementById("game");
    getElementPromiseBySelctor("#game").then(x=>x.appendChild(app.canvas)).catch(console.error);

}
//Preloads the assets needed
async function preload() {
    let assets = [
        { alias: "hex", src: "../assets/polygon4.svg" },
        { alias: "house", src: "../assets/ryantile.png" }

    ]
    await Assets.load(assets);
}
//Get the midpoint of 2 points
function getMidpoint(point1, point2) {
    if (point1 == null || point2 == null) return;
    return [(point2.x + point1.x) / 2, (point2.y + point1.y) / 2]
}

//Immedietly invoke a async function that runs both the setup and preload
(async () => {

    await preload();
    await setup();

    grid()
})()


function grid() {
    //Using honeycomb js define the options for a new hex tile
    const CustomHex = Honeycomb.defineHex({
        dimensions: 100,
        orientation: Honeycomb.Orientation.POINTY,
        offset: 1,
        origin: { x: -window.innerWidth / 2, y: -window.innerHeight / 2 }
    })
    //Create the grid of hexagons using a spiral transverser
    const grid = new Honeycomb.Grid(CustomHex, Honeycomb.spiral({ radius: 2 }))
    //Create a new container with pixi to act as our board
    const gameBoard = new Container;
    // gameBoard.position.set(window.innerWidth /2,window.innerHeight / 2)
    //Using pixi graphics we can draw polygons
    // let tile = new Graphics()
    // tile
    //     .setStrokeStyle({ color: "black", width: 3, alignment:.5 })
    //     .setFillStyle("white")
    //     .poly(grid.getHex({q:0,r:0}).corners)
    //     .fill()
    //     .stroke();
    // app.stage.addChild(tile)
    // const tileTexture = app.renderer.generateTexture(tile);

    //Loops through the hexgonal grid and draws hex tiles from the points
    grid.forEach(hex => {
        const tileContainer = new Container;

        let tile = Sprite.from("hex");//tileTexture
        let tileText = new Text({
            text: Math.floor(Math.random() * 9)+1,
            style: {
                fontFamily: 'Arial'
            }
        });
        tileText.anchor.set(.5);
        tile.scale = 1;
        tile.anchor.set(.5);
        tile.interactive = true;
        tile.on("click", () => {
            console.log(tile);
            tile.tint = 0xff0000;
        })
        tile.position.set(hex.x, hex.y);
        tileText.position.set(hex.x, hex.y+tile.height/4.5);
        tile.on("pointerdown", () => {
            tile.texture = Texture.from('house')
            tile.tint = 0xFFFFFF;

        })
        tileContainer.addChild(tile, tileText);
        for (let i = 0; i < hex.corners.length; i++) {
            let midpoints = getMidpoint(hex.corners[i], hex.corners[i + 1])
            if (midpoints == null) { midpoints = getMidpoint(hex.corners[0], hex.corners[hex.corners.length - 1]) };
            let edge = Sprite.from("hex");
            edge.scale.set(.15);
            edge.anchor.set(.5);
            edge.position.set(midpoints[0], midpoints[1]);
            edge.tint = "purple"

            edge.interactive = true;

            edge.on("mouseover", () => {
                edge.tint = "red";
            })
            edge.on("mouseleave", () => {
                edge.tint = "purple";
            })

            let corner = Sprite.from("hex");
            corner.scale.set(.15);
            corner.anchor.set(.5);
            corner.position.set(hex.corners[i].x, hex.corners[i].y);
            corner.interactive = true;
            corner.tint = "white"

            corner.on("mouseover", () => {
                corner.tint = "green";
            })
            corner.on("mouseleave", () => {
                corner.tint = "white";
            })
            corner.on("pointerdown", () => {
                corner.texture = Texture.from('house')
                corner.tint = 0xFFFFFF;

            })
            tileContainer.addChild(edge, corner);
        }
        gameBoard.addChild(tileContainer);
        // console.log(hex)
        // graphics
        //     .setStrokeStyle({ color: "black", width: 3, alignment:.5 })
        //     .setFillStyle("purple")
        //     .poly(hex.corners)
        //     .fill()
        //     .stroke();
        // //Create circles for placement of pieces
        // for (let i = 0; i < hex.corners.length; i++) {
        //     graphics
        //         .circle(hex.corners[i].x,hex.corners[i].y, 5)
        //         .fill("white")
        //         .stroke({ width: 1, color: "black" });
        //     //circles on the edges of all hexagons
        //     if(!hex.corners[i+1]) {
        //         const midpoints = getMidpoint(hex.corners[0],hex.corners[i])
        //         graphics
        //             .circle(midpoints[0], midpoints[1], 5)
        //             .fill("red")
        //             .stroke({ width: 1, color: "black" });
        //         break
        //     }
        // }
        // gameBoard.addChild(graphics);
    });
    app.stage.addChild(gameBoard);

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



class Player {
    constructor(){
        this.inventory = new Map;
    }
    // get inventory(){
    //     return this.inventory
    // }
    hasItem(key){
        return this.inventory.has(key)
    }
    getInventoryItem(key){
        if(this.hasItem(key)){
            return this.inventory.get(key);
        }
    }
    setInventoryItem(key,value){
        this.inventory.set(key,value)
    }
}

//Import all things needed from PIXI
import { Application, Assets, Sprite, Graphics, Polygon, Container, hslWgsl } from "../libraries/pixi.mjs"
//Create a new application
const app = new Application;
//Setup function that adds the canvas to the body and starts the game loop
async function setup() {
    await app.init({ background: 'white', resizeTo: window, antialias: true, autoDensity: true, resolution: 2 });
    const main = document.getElementById("game");
    if(main){
        main.appendChild(app.canvas);
    }
}
//Preloads the assets needed
async function preload() {
    Assets.add({alias: 'bunnyBooBoo', src: 'bunny.png'});
    await Assets.load('bunnyBooBoo');

}
//Get the midpoint of 2 points
function getMidpoint(point1,point2){
    return [(point2.x+point1.x)/2,(point2.y+point1.y)/2]
}

//Immedietly invoke a async function that runs both the setup and preload
(async ()=>{
    
    await preload();
    await setup();
    //Using honeycomb js define the options for a new hex tile
    const CustomHex = Honeycomb.defineHex({
        dimensions: 100,
        orientation: Honeycomb.Orientation.POINTY,
        offset: 1,
        origin: {x:-window.innerWidth / 2,y:-window.innerHeight / 2}
    })
    //Create the grid of hexagons using a spiral transverser
    const grid = new Honeycomb.Grid(CustomHex, Honeycomb.spiral({ radius: 2 }))    
    //Create a new container with pixi to act as our board
    const gameBoard = new Container;
    //Using pixi graphics we can draw polygons
    let graphics = new Graphics()
    //Loops through the hexgonal grid and draws hex tiles from the points
    grid.forEach(hex => {
        console.log(hex)
        graphics
            .setStrokeStyle({ color: "black", width: 3, alignment:.5 })
            .setFillStyle("purple")
            .poly(hex.corners)
            .fill()
            .stroke();
        //Create circles for placement of pieces
        for (let i = 0; i < hex.corners.length; i++) {
            graphics
                .circle(hex.corners[i].x,hex.corners[i].y, 5)
                .fill("white")
                .stroke({ width: 1, color: "black" });
            //circles on the edges of all hexagons
            if(!hex.corners[i+1]) {
                const midpoints = getMidpoint(hex.corners[0],hex.corners[i])
                graphics
                    .circle(midpoints[0], midpoints[1], 5)
                    .fill("red")
                    .stroke({ width: 1, color: "black" });
                break
            }
           //circles on the edges of all hexagons
            const midpoints = getMidpoint(hex.corners[i+1],hex.corners[i])
            let edge = Sprite.from("bunnyBooBoo")
            app.stage.addChild(edge)
        }
        gameBoard.addChild(graphics);
        app.stage.addChild(gameBoard);
    });
   
    document.addEventListener('click', ({ offsetX, offsetY }) => {
        const hex = grid.pointToHex(
            { x: offsetX , y: offsetY},
            { allowOutside: false }
        )
        if(!hex) return;
        graphics
                .poly(hex.corners)
                .fill(`green`)
                .stroke();
        console.log(hex)
    })
})()

function getElementPromiseBySelctor(selector){
    return new Promise((resolve,reject)=>{
        const element = document.querySelector(selector);
        if(element !== null){
            resolve(element)
        }else{
            reject()
        }

    });
}

document.addEventListener("DOMContentLoaded",()=>{
    getElementPromiseBySelctor("#createPanel button").then(startBtn=>{
    })
})
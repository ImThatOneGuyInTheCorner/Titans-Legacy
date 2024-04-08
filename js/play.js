import { Application, Assets, Sprite, Graphics, Polygon, Container, hslWgsl } from "../libraries/pixi.mjs"
const app = new Application;

async function setup() {
    await app.init({ background: 'white', resizeTo: window, antialias: true, autoDensity: true, resolution: 2 });
    document.body.appendChild(app.canvas);
}

async function preload() {
    const assets = [
        { alias: 'mushroom', src: './mush.jpg' },
    ];
    // Load the assets defined above.
    await Assets.load(assets);
}

function getMidpoint(point1,point2){
    return [(point2.x+point1.x)/2,(point2.y+point1.y)/2]
}


(async ()=>{
    await setup();
    await preload();
    const CustomHex = Honeycomb.defineHex({
        dimensions: 100,
        orientation: Honeycomb.Orientation.POINTY,
        offset: 1,
        origin: {x:-window.innerWidth / 2,y:-window.innerHeight / 2}
    })
    const grid = new Honeycomb.Grid(CustomHex, Honeycomb.spiral({ radius: 2 }))    
    const gameBoard = new Container;
    let graphics = new Graphics()
    grid.forEach(hex => {
        
        graphics
            .setStrokeStyle({ color: "black", width: 3, alignment:.5 })
            .setFillStyle("purple")
            .poly(hex.corners)
            .fill()
            .stroke();
        for (let i = 0; i < hex.corners.length; i++) {
            if(!hex.corners[i+1]) {
                const midpoints = getMidpoint(hex.corners[0],hex.corners[i])
                graphics
                    .circle(midpoints[0], midpoints[1], 5)
                    .fill("red")
                    .stroke({ width: 1, color: "black" });
                break
            }
            const midpoints = getMidpoint(hex.corners[i+1],hex.corners[i])
            graphics
                .circle(midpoints[0], midpoints[1], 5)
                .fill("red")
                .stroke({ width: 1, color: "black" });
        }
        // for (const corner of hex.corners) {
        //     graphics
        //         .circle(corner.x, corner.y, 5)
        //         .fill("red")
        //         .stroke({ width: 1, color: "black" });
        // }
        gameBoard.addChild(graphics);
        app.stage.addChild(gameBoard);
    });
    const sprite = Sprite.from("mushroom");
    sprite.anchor.set(0);
    sprite.position.set(0);
    app.stage.addChild(sprite);
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

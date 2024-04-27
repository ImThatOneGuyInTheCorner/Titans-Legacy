class Player {
    constructor(render) {
        this.inventory = new Map;
        this.inventoryRender = render;
        this.roads = [];
        this.outposts = [];
        this.resources = new Map;
        this.hp = 100;
        this.maxhp = 100;
        this.dmgModifier = 1;
        this.dodgeChance = 1;
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

export default Player